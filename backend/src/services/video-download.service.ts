import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getJobTempDir, getInputVideoPath } from '../utils/helpers';
import { logger } from '../utils/logger';

export interface DownloadResult {
  inputPath: string;
  fileSize: number;
}

/**
 * Download a video from a URL using yt-dlp.
 * Stores the downloaded video at /tmp/videos/{jobId}/input.mp4
 */
export async function downloadVideo(
  jobId: string,
  videoUrl: string
): Promise<DownloadResult> {
  const tempDir = getJobTempDir(jobId);
  const inputPath = getInputVideoPath(jobId);

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  logger.info(`[Job ${jobId}] Starting video download from: ${videoUrl}`);

  await runYtDlp(videoUrl, inputPath);

  // Verify the file was downloaded
  if (!fs.existsSync(inputPath)) {
    // yt-dlp might have downloaded with a different extension, check for it
    const files = fs.readdirSync(tempDir);
    const videoFile = files.find((f) => /\.(mp4|webm|mkv|mov|avi)$/i.test(f));

    if (!videoFile) {
      throw new Error(`Download failed: no video file found in ${tempDir}`);
    }

    // Rename to input.mp4
    fs.renameSync(path.join(tempDir, videoFile), inputPath);
  }

  const stats = fs.statSync(inputPath);
  logger.info(`[Job ${jobId}] Video downloaded successfully. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  return {
    inputPath,
    fileSize: stats.size,
  };
}

/**
 * Run yt-dlp to download a video.
 */
function runYtDlp(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '--no-warnings',
      '--no-playlist',
      '--merge-output-format', 'mp4',
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '-o', outputPath,
      '--no-check-certificates',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      // For TikTok: try to get the video without watermark
      '--extractor-args', 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com',
      url,
    ];

    logger.debug(`Running yt-dlp with args: ${args.join(' ')}`);

    const process = spawn('yt-dlp', args);

    let stderr = '';

    process.stdout.on('data', (data: Buffer) => {
      logger.debug(`yt-dlp stdout: ${data.toString().trim()}`);
    });

    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      logger.debug(`yt-dlp stderr: ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp#installation'));
      } else {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      }
    });
  });
}
