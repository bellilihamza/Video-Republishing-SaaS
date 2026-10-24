import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { JobStatus } from '@/types';

/**
 * Merge Tailwind CSS classes with clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format a date string to relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Get status badge color classes.
 */
export function getStatusColor(status: JobStatus): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors: Record<JobStatus, { bg: string; text: string; dot: string }> = {
    pending: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      dot: 'status-dot-pending',
    },
    downloading: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      dot: 'status-dot-downloading',
    },
    processing: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      dot: 'status-dot-processing',
    },
    uploading: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      dot: 'status-dot-uploading',
    },
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      dot: 'status-dot-completed',
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      dot: 'status-dot-failed',
    },
  };

  return colors[status] || colors.pending;
}

/**
 * Get the platform icon name.
 */
export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
  };
  return labels[platform] || platform;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate a string to a max length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}

/**
 * Detect source platform from a video URL.
 */
export function detectPlatform(url: string): string | null {
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook';
  return null;
}
