'use client';

interface TrustLineStatusProps {
  trustLine: {
    currency: string;
    issuer: string;
    balance: string;
    limit: string;
  };
}

export function TrustLineStatus({ trustLine }: TrustLineStatusProps) {
  const isActive = parseFloat(trustLine.limit) > 0;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{trustLine.currency}</h3>
        <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p>Issuer: {trustLine.issuer.slice(0, 8)}...</p>
        <p>Balance: {trustLine.balance}</p>
        <p>Limit: {trustLine.limit}</p>
      </div>
    </div>
  );
}
