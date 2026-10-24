'use client';

import { signIn } from 'next-auth/react';
import { Zap, Chrome } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useState } from 'react';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-indigo-600/8 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md animate-[scaleIn_0.3s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Re<span className="gradient-text">Publish</span>
            </span>
          </Link>
        </div>

        {/* Sign-in card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-sm">
              Sign in to republish your videos to YouTube
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            variant="secondary"
            size="lg"
            className="w-full text-base"
            leftIcon={!isLoading ? <Chrome className="w-5 h-5" /> : undefined}
          >
            {isLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
          </Button>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>YouTube upload scope included</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>Tokens encrypted with AES-256-GCM</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
