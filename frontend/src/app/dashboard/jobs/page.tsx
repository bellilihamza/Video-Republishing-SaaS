'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ListVideo } from 'lucide-react';
import JobList from '@/components/dashboard/JobList';
import { PageSpinner } from '@/components/ui/Spinner';
import { setAuthToken, getJobs } from '@/lib/api';
import type { Job, PaginationInfo } from '@/types';

export default function JobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (session?.backendToken) {
      setAuthToken(session.backendToken);
    }
  }, [session]);

  const fetchJobs = useCallback(async () => {
    if (!session?.backendToken) return;
    setLoading(true);
    try {
      const { jobs: data, pagination: pag } = await getJobs({
        page,
        limit: 10,
        status: statusFilter,
      });
      setJobs(data);
      setPagination(pag);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [session, page, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll for active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some((j) =>
      ['pending', 'downloading', 'processing', 'uploading'].includes(j.status)
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  if (loading && jobs.length === 0) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <ListVideo className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-slate-400 text-sm">
            Track the progress of your video republishing jobs
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'All', value: undefined },
          { label: 'Active', value: 'downloading' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
        ].map((filter) => (
          <button
            key={filter.label}
            onClick={() => handleFilterChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === filter.value
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <JobList jobs={jobs} onRefresh={fetchJobs} />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasMore}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
