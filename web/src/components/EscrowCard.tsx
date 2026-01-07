'use client';

interface EscrowCardProps {
  escrow: {
    escrow_id: string;
    amount: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
  };
}

export function EscrowCard({ escrow }: EscrowCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">Escrow #{escrow.escrow_id.slice(0, 8)}</h3>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[escrow.status]}`}>
          {escrow.status}
        </span>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p>Amount: {escrow.amount} XRP</p>
        <p>Created: {new Date(escrow.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
