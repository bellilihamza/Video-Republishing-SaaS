'use client';

import { useEffect, useState, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Youtube,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
  setAuthToken,
  getAccounts,
  getAccountStatus,
  disconnectAccount as disconnectAccountApi,
} from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Account } from '@/types';

interface PlatformConfig {
  key: string;
  label: string;
  icon: typeof Youtube;
  color: string;
  enabled: boolean;
}

const platforms: PlatformConfig[] = [
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: 'from-red-500 to-rose-600',
    enabled: true,
  },
];

export default function ConnectedAccounts() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statusMap, setStatusMap] = useState<
    Record<string, { connected: boolean; isExpired?: boolean; expiresAt?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.backendToken) {
      setLoading(false);
      return;
    }

    setAuthToken(session.backendToken);

    try {
      const [accountsData, status] = await Promise.all([
        getAccounts(),
        getAccountStatus(),
      ]);
      setAccounts(accountsData);
      setStatusMap(status);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConnect = async () => {
    // Use NextAuth to initiate Google OAuth with YouTube scopes
    await signIn('google', { callbackUrl: '/dashboard/accounts' });
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    setDisconnecting(accountId);
    try {
      await disconnectAccountApi(accountId);
      toast.success('Account disconnected');
      fetchData();
    } catch (error) {
      toast.error((error as Error).message || 'Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platforms.map((platform) => {
        const status = statusMap[platform.key];
        const account = accounts.find((a) => a.platform === platform.key);
        const isConnected = status?.connected || false;
        const isExpired = status?.isExpired || false;

        return (
          <Card key={platform.key}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <platform.icon className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">
                        {platform.label}
                      </h3>
                      {isConnected ? (
                        isExpired ? (
                          <Badge variant="warning" size="sm" dot dotClassName="status-dot-processing">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot dotClassName="status-dot-completed">
                            Connected
                          </Badge>
                        )
                      ) : (
                        <Badge variant="default" size="sm">
                          Not connected
                        </Badge>
                      )}
                    </div>

                    {isConnected && account && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          Connected {formatDate(account.connectedAt)}
                        </p>
                        {status?.expiresAt && (
                          <p className="text-xs text-slate-500">
                            Token expires: {formatDate(status.expiresAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {!isConnected && (
                      <p className="text-sm text-slate-500">
                        Connect your Google account to upload videos to YouTube
                      </p>
                    )}

                    {isExpired && (
                      <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-400">
                          Your authorization has expired. Please reconnect to continue uploading.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConnected ? (
                    <>
                      {isExpired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleConnect}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Reconnect
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => account && handleDisconnect(account.id)}
                        isLoading={disconnecting === account?.id}
                        className="text-slate-500 hover:text-red-400"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleConnect}
                      disabled={!platform.enabled}
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Future platforms teaser */}
      <div className="glass-card p-6 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <span className="text-lg">🔜</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">
              More Platforms Coming Soon
            </p>
            <p className="text-xs text-slate-600">
              TikTok, Instagram, and Facebook publishing support is on the roadmap
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
