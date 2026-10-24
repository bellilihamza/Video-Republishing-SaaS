'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import JobList from '@/components/dashboard/JobList';
import { setAuthToken, getJobs } from '@/lib/api';
import type { Job } from '@/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.backendToken) {
      setAuthToken(session.backendToken);
      fetchJobs();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const { jobs: data } = await getJobs({ limit: 5 });
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Jobs',
      value: jobs.length,
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      label: 'Completed',
      value: jobs.filter((j) => j.status === 'completed').length,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'In Progress',
      value: jobs.filter((j) =>
        ['pending', 'downloading', 'processing', 'uploading'].includes(j.status)
      ).length,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Failed',
      value: jobs.filter((j) => j.status === 'failed').length,
      icon: AlertCircle,
      color: 'from-red-500 to-rose-500',
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
          </p>
        </div>
        <Link href="/dashboard/publish">
          <Button
            variant="primary"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Publish Video
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
          <Link href="/dashboard/jobs">
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All
            </Button>
          </Link>
        </div>
        <JobList jobs={jobs} onRefresh={fetchJobs} compact />
      </div>
    </div>
  );
}
