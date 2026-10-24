'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { setAuthToken, getAccounts, getAccountStatus } from '@/lib/api';
import type { Account } from '@/types';

export function useAccounts() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statusMap, setStatusMap] = useState<
    Record<string, { connected: boolean; isExpired?: boolean; expiresAt?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!session?.backendToken) return;

    setAuthToken(session.backendToken);

    try {
      const [accountsData, status] = await Promise.all([
        getAccounts(),
        getAccountStatus(),
      ]);
      setAccounts(accountsData);
      setStatusMap(status);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const isYouTubeConnected = statusMap.youtube?.connected ?? false;
  const isYouTubeExpired = statusMap.youtube?.isExpired ?? false;

  return {
    accounts,
    statusMap,
    loading,
    error,
    isYouTubeConnected,
    isYouTubeExpired,
    refresh: fetchAccounts,
  };
}
