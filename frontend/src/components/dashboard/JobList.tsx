'use client';

import toast from 'react-hot-toast';
import { Inbox } from 'lucide-react';
import JobStatusCard from './JobStatusCard';
import { deleteJob as deleteJobApi } from '@/lib/api';
import type { Job } from '@/types';

interface JobListProps {
  jobs: Job[];
  onRefresh: () => void;
  compact?: boolean;
}

export default function JobList({ jobs, onRefresh, compact = false }: JobListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await deleteJobApi(id);
      toast.success('Job deleted');
      onRefresh();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete job');
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No jobs yet</p>
        <p className="text-sm text-slate-600 mt-1">
          Publish your first video to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobStatusCard
          key={job._id}
          job={job}
          onDelete={handleDelete}
          compact={compact}
        />
      ))}
    </div>
  );
}
