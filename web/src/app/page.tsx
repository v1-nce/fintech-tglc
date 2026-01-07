'use client';

import { useState, useEffect } from 'react';
import { apiClient, HealthStatus } from '@/lib/api';
import { StatusCard, CredentialForm, LiquidityForm, ProofVerifier } from '@/components';

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.healthCheck()
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline', network: 'unknown', issuer_configured: false }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-semibold text-black dark:text-zinc-50 mb-2">
            TGLC Platform
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Trust-Gated Liquidity Corridors on XRPL
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatusCard health={health} loading={loading} />
          <CredentialForm />
          <LiquidityForm />
          <ProofVerifier />
        </div>
      </div>
    </div>
  );
}
