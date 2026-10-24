import { spawn } from 'child_process';
import fs from 'fs';
import { getInputVideoPath, getOutputVideoPath } from '../utils/helpers';
import { logger } from '../utils/logger';

export interface ProcessOptions {
  trimDuration?: number;
  removeWatermark?: boolean;
}

export interface ProcessResult {
  outputPath: string;
  duration: number;
  fileSize: number;
}

/**
 * Process a downloaded video using FFmpeg.
 * - Optionally removes watermarks (TikTok/Instagram style)
 * - Trims to specified duration
 * - Re-encodes for YouTube Shorts compatibility (vertical 9:16)
 */
export async function processVideo(
  jobId: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const inputPath = getInputVideoPath(jobId);
  const outputPath = getOutputVideoPath(jobId);
  const { trimDuration = 60, removeWatermark = false } = options;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video not found at: ${inputPath}`);
  }

  logger.info(`[Job ${jobId}] Starting video processing. Trim: ${trimDuration}s, Remove watermark: ${removeWatermark}`);

  // Get video info (duration + dimensions) via FFprobe
  const videoInfo = await getVideoInfo(inputPath);
  const finalDuration = Math.min(trimDuration, videoInfo.duration);

  logger.info(`[Job ${jobId}] Input: ${videoInfo.width}x${videoInfo.height}, Duration: ${videoInfo.duration}s → Processing to: ${finalDuration}s`);

  await runFFmpeg(inputPath, outputPath, finalDuration, removeWatermark, videoInfo);

  if (!fs.existsSync(outputPath)) {
    throw new Error('Video processing failed: output file not created');
  }

  const stats = fs.statSync(outputPath);
  logger.info(`[Job ${jobId}] Video processed. Output size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  return {
    outputPath,
    duration: finalDuration,
    fileSize: stats.size,
  };
}

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
}

/**
 * Build the FFmpeg video filter chain.
 * When removeWatermark is enabled:
 *  1. Crops bottom 15% to remove username/caption overlay
 * Then scales and pads to 9:16 (1080x1920) for YouTube Shorts.
 */
function buildVideoFilters(removeWatermark: boolean, videoInfo: VideoInfo): string {
  const filters: string[] = [];

  if (removeWatermark) {
    const { height } = videoInfo;
    // Crop out the bottom 15% where username/caption usually lives
    const cropH = Math.round(height * 0.85);
    filters.push(`crop=iw:${cropH}:0:0`);
  }

  // Scale to fit within 1080x1920 maintaining aspect ratio, then pad to exact size
  filters.push('scale=1080:1920:force_original_aspect_ratio=decrease');
  filters.push('pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black');
  filters.push('setsar=1');

  return filters.join(',');
}

/**
 * Run FFmpeg to process a video (trim, remove watermark, re-encode).
 */
function runFFmpeg(
  inputPath: string,
  outputPath: string,
  duration: number,
  removeWatermark: boolean,
  videoInfo: VideoInfo
): Promise<void> {
  return new Promise((resolve, reject) => {
    const videoFilters = buildVideoFilters(removeWatermark, videoInfo);

    const args = [
      '-i', inputPath,
      '-t', duration.toString(),
      '-vf', videoFilters,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ];

    logger.info(`Running FFmpeg: ffmpeg ${args.join(' ')}`);

    const proc = spawn('ffmpeg', args);

    let stderr = '';

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      const line = data.toString().trim();
      if (line.includes('time=')) {
        logger.debug(`FFmpeg progress: ${line}`);
      }
    });

    proc.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error(`FFmpeg stderr: ${stderr.slice(-1000)}`);
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err: Error) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('FFmpeg is not installed. Please install it: https://ffmpeg.org/download.html'));
      } else {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`));
      }
    });
  });
}

/**
 * Get video info (duration, width, height) using FFprobe.
 */
function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      '-select_streams', 'v:0',
      videoPath,
    ];

    const proc = spawn('ffprobe', args);

    let stdout = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.on('close', (code: number) => {
      if (code !== 0) {
        logger.warn(`ffprobe failed for ${videoPath}, using defaults`);
        resolve({ duration: 60, width: 1080, height: 1920 });
        return;
      }

      try {
        const info = JSON.parse(stdout);
        const duration = parseFloat(info?.format?.duration || '60');
        const videoStream = info?.streams?.[0];
        const width = videoStream?.width || 1080;
        const height = videoStream?.height || 1920;
        resolve({ duration: Math.ceil(duration), width, height });
      } catch {
        resolve({ duration: 60, width: 1080, height: 1920 });
      }
    });

    proc.on('error', () => {
      resolve({ duration: 60, width: 1080, height: 1920 });
    });
  });
}
