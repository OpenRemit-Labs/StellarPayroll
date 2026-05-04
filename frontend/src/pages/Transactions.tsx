import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { transactionsApi } from '../api/payrolls';

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx';

export default function Transactions() {
  const org = useAppStore((s) => s.currentOrg);
  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions', org?.id],
    queryFn: () => transactionsApi.list(org!.id),
    enabled: !!org,
  });

  if (!org) return <p className="text-sm text-gray-500">Create an organization first.</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Transactions</h1>

      <div className="card">
        {isLoading ? (
          <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
        ) : txs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No transactions yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Date</th>
                <th className="table-th">Payroll</th>
                <th className="table-th">TX Hash</th>
                <th className="table-th">Ledger</th>
                <th className="table-th">Status</th>
                <th className="table-th">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {txs.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="table-td text-gray-500 text-xs">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</td>
                  <td className="table-td text-sm">{tx.payroll_name || '—'}</td>
                  <td className="table-td">
                    <a
                      href={`${EXPLORER_BASE}/${tx.stellar_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-mono"
                    >
                      {tx.stellar_tx_hash.slice(0, 12)}… <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="table-td font-mono text-xs">{tx.ledger ?? '—'}</td>
                  <td className="table-td">
                    <span className={`text-xs font-medium ${tx.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="table-td font-mono text-xs text-gray-400">{tx.fee_charged ? `${tx.fee_charged} stroops` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
