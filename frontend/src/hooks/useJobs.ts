'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { setAuthToken, getJobs } from '@/lib/api';
import type { Job, PaginationInfo } from '@/types';

interface UseJobsOptions {
  status?: string;
  limit?: number;
  pollInterval?: number;
}

export function useJobs(options: UseJobsOptions = {}) {
  const { status, limit = 10, pollInterval = 5000 } = options;
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    if (!session?.backendToken) return;

    setAuthToken(session.backendToken);

    try {
      const { jobs: data, pagination: pag } = await getJobs({
        page,
        limit,
        status,
      });
      setJobs(data);
      setPagination(pag);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session, page, limit, status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-poll when there are active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some((j) =>
      ['pending', 'downloading', 'processing', 'uploading'].includes(j.status)
    );

    if (!hasActiveJobs || !pollInterval) return;

    const interval = setInterval(fetchJobs, pollInterval);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs, pollInterval]);

  return {
    jobs,
    pagination,
    loading,
    error,
    page,
    setPage,
    refresh: fetchJobs,
  };
}
