import crypto from 'crypto';
import path from 'path';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt a string using AES-256-GCM.
 */
export function encrypt(text: string): string {
  const key = Buffer.from(env.encryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM.
 */
export function decrypt(encryptedText: string): string {
  const key = Buffer.from(env.encryptionKey, 'hex');
  const [ivHex, tagHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !tagHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate the temp directory path for a job.
 */
export function getJobTempDir(jobId: string): string {
  return path.join(env.tempDir, jobId);
}

/**
 * Get the input video file path for a job.
 */
export function getInputVideoPath(jobId: string): string {
  return path.join(getJobTempDir(jobId), 'input.mp4');
}

/**
 * Get the output video file path for a job.
 */
export function getOutputVideoPath(jobId: string): string {
  return path.join(getJobTempDir(jobId), 'output.mp4');
}

/**
 * Validate a video URL from supported platforms.
 */
export function validateVideoUrl(url: string): { valid: boolean; platform: string | null } {
  const patterns: Record<string, RegExp> = {
    tiktok: /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\//i,
    facebook: /^https?:\/\/(www\.|m\.|web\.)?facebook\.com\//i,
    facebook_watch: /^https?:\/\/(www\.)?fb\.watch\//i,
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return {
        valid: true,
        platform: platform.startsWith('facebook_') ? 'facebook' : platform,
      };
    }
  }

  return { valid: false, platform: null };
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a short random ID.
 */
export function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Format bytes to a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
