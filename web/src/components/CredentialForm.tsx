'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export function CredentialForm() {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('1000000');
  const [currency, setCurrency] = useState('CORRIDOR_ELIGIBLE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await apiClient.issueCredential(address, amount, currency);
      setResult(`Credential issued. Issuer: ${response.issuer}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4 text-black dark:text-zinc-50">Issue Credential</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
            Principal Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="rXXX..."
            required
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
            Amount
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
            Currency
          </label>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Issuing...' : 'Issue'}
        </button>
        {result && (
          <div className="text-sm text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/20 rounded">
            {result}
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

