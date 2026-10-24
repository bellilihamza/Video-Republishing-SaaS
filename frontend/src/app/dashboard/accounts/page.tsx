'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link2 } from 'lucide-react';
import ConnectedAccounts from '@/components/dashboard/ConnectedAccounts';
import { setAuthToken } from '@/lib/api';

export default function AccountsPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.backendToken) {
      setAuthToken(session.backendToken);
    }
  }, [session]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Connected Accounts</h1>
          <p className="text-slate-400 text-sm">
            Manage your connected platform accounts
          </p>
        </div>
      </div>

      {/* Accounts */}
      <ConnectedAccounts />
    </div>
  );
}
