'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

export default function HeroCTA() {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeIn_0.8s_ease-out]">
      <Link
        href={isLoggedIn ? '/dashboard' : '/auth/signin'}
        className="btn-glow text-base px-8 py-3.5 flex items-center gap-2"
      >
        {isLoggedIn ? (
          <>
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </>
        ) : (
          <>
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Link>
      <Link
        href={isLoggedIn ? '/dashboard/publish' : '#features'}
        className="px-8 py-3.5 rounded-xl text-slate-300 border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-base font-medium"
      >
        {isLoggedIn ? 'Publish Video' : 'Learn More'}
      </Link>
    </div>
  );
}
