'use client';

import {
  Clock,
  ExternalLink,
  Trash2,
  AlertCircle,
  Download,
  Cog,
  Upload,
  CheckCircle2,
  CircleDashed,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  getStatusColor,
  getPlatformLabel,
  formatRelativeTime,
  capitalize,
  truncate,
} from '@/lib/utils';
import type { Job, JobStatus } from '@/types';

interface JobStatusCardProps {
  job: Job;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const statusLabels: Record<JobStatus, string> = {
  pending: 'Waiting in queue',
  downloading: 'Downloading video...',
  processing: 'Processing with FFmpeg...',
  uploading: 'Uploading to YouTube...',
  completed: 'Published successfully',
  failed: 'Job failed',
};

const pipelineSteps = [
  { key: 'pending', label: 'Queue', icon: CircleDashed },
  { key: 'downloading', label: 'Download', icon: Download },
  { key: 'processing', label: 'Process', icon: Cog },
  { key: 'uploading', label: 'Upload', icon: Upload },
  { key: 'completed', label: 'Done', icon: CheckCircle2 },
] as const;

function getStepIndex(status: JobStatus): number {
  if (status === 'failed') return -1;
  return pipelineSteps.findIndex((s) => s.key === status);
}

export default function JobStatusCard({ job, onDelete, compact = false }: JobStatusCardProps) {
  const statusColor = getStatusColor(job.status);
  const isActive = ['pending', 'downloading', 'processing', 'uploading'].includes(job.status);
  const currentStepIndex = getStepIndex(job.status);
  const isFailed = job.status === 'failed';

  return (
    <Card className={compact ? 'p-4' : 'p-5'}>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title and status */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h4 className="text-sm font-semibold text-white truncate">
                {truncate(job.title, 50)}
              </h4>
              <Badge
                variant={
                  job.status === 'completed'
                    ? 'success'
                    : job.status === 'failed'
                    ? 'error'
                    : isActive
                    ? 'info'
                    : 'default'
                }
                size="sm"
                dot
                dotClassName={statusColor.dot}
              >
                {capitalize(job.status)}
              </Badge>
            </div>

            {/* Status message */}
            <p className="text-xs text-slate-500 mb-2">
              {statusLabels[job.status]}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="purple" size="sm">
                {getPlatformLabel(job.sourcePlatform)}
              </Badge>
              <span className="text-xs text-slate-600">→</span>
              <Badge variant="error" size="sm">
                YouTube
              </Badge>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(job.createdAt)}
              </span>
            </div>

            {/* Error message */}
            {job.status === 'failed' && job.errorMessage && (
              <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 leading-relaxed">
                  {truncate(job.errorMessage, 150)}
                </p>
              </div>
            )}

            {/* Published URL */}
            {job.status === 'completed' && job.publishedVideoUrl && (
              <a
                href={job.publishedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on YouTube
              </a>
            )}
          </div>

          {/* Actions */}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(job._id)}
              className="text-slate-500 hover:text-red-400 flex-shrink-0"
              title="Delete job"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* ── Detailed Pipeline Steps ── */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between gap-1">
            {pipelineSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = !isFailed && currentStepIndex > index;
              const isCurrent = !isFailed && currentStepIndex === index;

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  {/* Step circle + label */}
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className={`
                        w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300
                        ${isCompleted
                          ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                          : isCurrent
                          ? 'bg-indigo-500/25 text-indigo-300 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20'
                          : isFailed && index <= 0
                          ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'
                          : 'bg-white/5 text-slate-600 ring-1 ring-white/5'
                        }
                      `}
                      style={isCurrent ? { animation: 'progressPulse 2s ease-in-out infinite' } : undefined}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <StepIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                    </div>
                    <span
                      className={`hidden sm:block text-[10px] font-medium leading-none ${
                        isCompleted
                          ? 'text-indigo-400'
                          : isCurrent
                          ? 'text-indigo-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line between steps */}
                  {index < pipelineSteps.length - 1 && (
                    <div className="flex-1 h-px mx-1.5 mt-[-14px]">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          isCompleted
                            ? 'bg-indigo-500/40'
                            : 'bg-white/5'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
