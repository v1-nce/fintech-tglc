'use client';

import { HealthStatus } from '@/lib/api';

interface StatusCardProps {
  health: HealthStatus | null;
  loading: boolean;
}

export function StatusCard({ health, loading }: StatusCardProps) {
  const statusColor = health?.status === 'online' || health?.status === 'healthy'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">System Status</h2>
      {loading ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Checking...</div>
      ) : health ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Status</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
              {health.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Network</span>
            <span className="text-sm font-mono text-black dark:text-zinc-50">
              {health.network}
            </span>
          </div>
          {health.issuer_configured !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Issuer</span>
              <span className={`px-2 py-1 rounded text-xs ${
                health.issuer_configured
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {health.issuer_configured ? 'Configured' : 'Not Set'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-red-600 dark:text-red-400">Unable to connect</div>
      )}
    </div>
  );
}

