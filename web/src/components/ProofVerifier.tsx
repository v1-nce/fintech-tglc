'use client';

import { useState } from 'react';
import { apiClient, ProofVerificationResponse } from '@/lib/api';

export function ProofVerifier() {
  const [proofData, setProofData] = useState('{"metrics": {"default_rate": 0.02, "avg_settlement_days": 5}}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProofVerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = JSON.parse(proofData);
      const response = await apiClient.verifyProof(data);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">Verify Proof</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
            Proof Data (JSON)
          </label>
          <textarea
            value={proofData}
            onChange={(e) => setProofData(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {result && (
          <div className="text-sm p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

