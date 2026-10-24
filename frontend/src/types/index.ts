export type JobStatus =
  | 'pending'
  | 'downloading'
  | 'processing'
  | 'uploading'
  | 'completed'
  | 'failed';

export type SourcePlatform = 'tiktok' | 'instagram' | 'facebook';
export type TargetPlatform = 'youtube';
export type PrivacyStatus = 'public' | 'unlisted' | 'private';

export interface Job {
  _id: string;
  userId: string;
  videoUrl: string;
  sourcePlatform: SourcePlatform;
  targetPlatform: TargetPlatform;
  status: JobStatus;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: PrivacyStatus;
  trimDuration: number;
  outputVideoPath?: string;
  publishedVideoUrl?: string;
  publishedVideoId?: string;
  errorMessage?: string;
  attempts: number;
  queueJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  platform: string;
  provider: string;
  isConnected: boolean;
  isExpired: boolean;
  expiresAt: string;
  connectedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JobsResponse {
  success: boolean;
  jobs: Job[];
  pagination: PaginationInfo;
}

export interface AccountStatusResponse {
  success: boolean;
  status: Record<string, {
    connected: boolean;
    isExpired?: boolean;
    expiresAt?: string;
  }>;
}

export type CreateJobFormData = {
  videoUrl: string;
  title: string;
  description: string;
  tags: string;
  privacyStatus: PrivacyStatus;
  trimDuration: number;
  targetPlatform: TargetPlatform;
};
