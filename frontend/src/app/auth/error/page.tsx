'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'Access was denied. You may not have permission to sign in.',
    Verification: 'The verification token has expired or has been used.',
    OAuthSignin: 'Error connecting to Google. Please try again.',
    OAuthCallback: 'Error during the Google callback. Please try again.',
    OAuthCreateAccount: 'Could not create your account. Please try again.',
    EmailCreateAccount: 'Could not create your account via email.',
    Callback: 'An error occurred during authentication callback.',
    OAuthAccountNotLinked: 'This email is already linked to another account.',
    SessionRequired: 'You must be signed in to access this page.',
    Default: 'An unexpected error occurred. Please try again.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center animate-[scaleIn_0.3s_ease-out]">
        <div className="glass-card p-8">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">
            Authentication Error
          </h1>

          <p className="text-slate-400 text-sm mb-6">{message}</p>

          {error && (
            <p className="text-xs text-slate-600 mb-6 font-mono">
              Error code: {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signin">
              <Button variant="primary" size="md">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
