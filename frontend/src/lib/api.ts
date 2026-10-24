import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  Job,
  User,
  Account,
  JobsResponse,
  AccountStatusResponse,
  CreateJobFormData,
  PaginationInfo,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance with base URL and interceptors.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Set the auth token for API requests.
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// Request interceptor to attach JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken && config.headers) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Create a more descriptive error
    const enhancedError = new Error(message);
    (enhancedError as Error & { status?: number }).status = error.response?.status;
    throw enhancedError;
  }
);

// ============================================
// Auth API
// ============================================

export async function getGoogleAuthUrl(): Promise<string> {
  const { data } = await api.get<{ success: boolean; url: string }>('/auth/google/url');
  return data.url;
}

export async function googleCallback(code: string): Promise<{
  token: string;
  user: User;
}> {
  const { data } = await api.post<{
    success: boolean;
    token: string;
    user: User;
  }>('/auth/google/callback', { code });
  return { token: data.token, user: data.user };
}

export async function getMe(): Promise<{
  user: User;
  accounts: Record<string, { connected: boolean; isExpired?: boolean; expiresAt?: string }>;
}> {
  const { data } = await api.get<{
    success: boolean;
    user: User;
    accounts: Record<string, { connected: boolean; isExpired?: boolean; expiresAt?: string }>;
  }>('/auth/me');
  return { user: data.user, accounts: data.accounts };
}

export async function refreshAuthToken(): Promise<string> {
  const { data } = await api.post<{ success: boolean; token: string }>('/auth/refresh');
  return data.token;
}

export async function logout(): Promise<void> {
  await api.delete('/auth/logout');
}

// ============================================
// Jobs API
// ============================================

export async function createJob(formData: CreateJobFormData): Promise<Job> {
  const payload = {
    videoUrl: formData.videoUrl,
    targetPlatform: formData.targetPlatform,
    title: formData.title,
    description: formData.description,
    tags: formData.tags
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean),
    privacyStatus: formData.privacyStatus,
    trimDuration: formData.trimDuration,
  };

  const { data } = await api.post<{ success: boolean; job: Job }>('/jobs', payload);
  return data.job;
}

export async function getJobs(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ jobs: Job[]; pagination: PaginationInfo }> {
  const { data } = await api.get<JobsResponse>('/jobs', { params });
  return { jobs: data.jobs, pagination: data.pagination };
}

export async function getJobById(id: string): Promise<Job> {
  const { data } = await api.get<{ success: boolean; job: Job }>(`/jobs/${id}`);
  return data.job;
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}

// ============================================
// Accounts API
// ============================================

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<{ success: boolean; accounts: Account[] }>('/accounts');
  return data.accounts;
}

export async function getAccountStatus(): Promise<AccountStatusResponse['status']> {
  const { data } = await api.get<AccountStatusResponse>('/accounts/status');
  return data.status;
}

export async function disconnectAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}

// ============================================
// Videos API
// ============================================

export async function getPublishedVideos(params?: {
  page?: number;
  limit?: number;
}): Promise<{ videos: Job[]; pagination: PaginationInfo }> {
  const { data } = await api.get<{
    success: boolean;
    videos: Job[];
    pagination: PaginationInfo;
  }>('/videos', { params });
  return { videos: data.videos, pagination: data.pagination };
}

export async function getVideoById(id: string): Promise<Job> {
  const { data } = await api.get<{ success: boolean; video: Job }>(`/videos/${id}`);
  return data.video;
}

export default api;
