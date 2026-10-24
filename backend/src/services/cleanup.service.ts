import fs from 'fs';
import path from 'path';
import { getJobTempDir } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Delete all temporary files for a job after successful upload.
 * Removes the entire /tmp/videos/{jobId}/ directory.
 */
export async function cleanupJobFiles(jobId: string): Promise<void> {
  const tempDir = getJobTempDir(jobId);

  if (!fs.existsSync(tempDir)) {
    logger.debug(`[Job ${jobId}] No temp files to clean up at: ${tempDir}`);
    return;
  }

  try {
    deleteDirRecursive(tempDir);
    logger.info(`[Job ${jobId}] Temp files cleaned up: ${tempDir}`);
  } catch (error) {
    // Non-fatal: log warning but don't fail the job
    logger.warn(`[Job ${jobId}] Failed to clean up temp files at ${tempDir}:`, error);
  }
}

/**
 * Recursively delete a directory.
 */
function deleteDirRecursive(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;

  fs.readdirSync(dirPath).forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      deleteDirRecursive(filePath);
    } else {
      fs.unlinkSync(filePath);
      logger.debug(`Deleted file: ${filePath}`);
    }
  });

  fs.rmdirSync(dirPath);
  logger.debug(`Deleted directory: ${dirPath}`);
}

/**
 * Clean up stale job directories older than a given number of hours.
 * Useful for a periodic cleanup job to handle failed/abandoned jobs.
 */
export async function cleanupStaleDirs(tempBaseDir: string, olderThanHours = 24): Promise<void> {
  if (!fs.existsSync(tempBaseDir)) return;

  const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
  let cleaned = 0;

  const entries = fs.readdirSync(tempBaseDir);

  for (const entry of entries) {
    const entryPath = path.join(tempBaseDir, entry);
    const stat = fs.statSync(entryPath);

    if (stat.isDirectory() && stat.mtimeMs < cutoffTime) {
      try {
        deleteDirRecursive(entryPath);
        cleaned++;
        logger.info(`Stale dir cleaned: ${entryPath}`);
      } catch (error) {
        logger.warn(`Failed to clean stale dir ${entryPath}:`, error);
      }
    }
  }

  if (cleaned > 0) {
    logger.info(`Stale cleanup complete. Removed ${cleaned} director${cleaned === 1 ? 'y' : 'ies'}`);
  }
}
