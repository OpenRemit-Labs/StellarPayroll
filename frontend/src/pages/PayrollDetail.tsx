import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePayroll } from '../hooks/usePayrolls';
import PayrollStatusBadge from '../components/PayrollStatusBadge';

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx';

function exportCSV(payroll: any) {
  const rows = [
    ['Employee', 'Wallet', 'Amount', 'Currency', 'Status', 'TX Hash'],
    ...(payroll.items || []).map((i: any) => [
      i.employee_name, i.wallet_address, i.amount, i.currency, i.status, i.tx_hash || '',
    ]),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payroll-${payroll.id}.csv`;
  a.click();
}

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: payroll, isLoading } = usePayroll(id);

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>;
  if (!payroll) return <p className="text-sm text-gray-500">Payroll not found.</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{payroll.name}</h1>
            <PayrollStatusBadge status={payroll.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(payroll.created_at), 'MMM d, yyyy HH:mm')}
            {payroll.executed_at && ` · Executed ${format(new Date(payroll.executed_at), 'MMM d HH:mm')}`}
          </p>
        </div>
        <button onClick={() => exportCSV(payroll)} className="btn-secondary">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-lg font-bold font-mono mt-1">{Number(payroll.total_amount).toLocaleString()} {payroll.currency}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Recipients</p>
          <p className="text-lg font-bold mt-1">{payroll.items?.length ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Success Rate</p>
          <p className="text-lg font-bold mt-1">
            {payroll.items?.length
              ? `${Math.round((payroll.items.filter((i) => i.status === 'success').length / payroll.items.length) * 100)}%`
              : '—'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Payment Items</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-th">Employee</th>
              <th className="table-th">Wallet</th>
              <th className="table-th text-right">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th">TX Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(payroll.items || []).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-td font-medium">{item.employee_name}</td>
                <td className="table-td font-mono text-xs text-gray-400">
                  {item.wallet_address ? `${item.wallet_address.slice(0, 6)}…${item.wallet_address.slice(-4)}` : '—'}
                </td>
                <td className="table-td text-right font-mono">{Number(item.amount).toFixed(7)} {item.currency}</td>
                <td className="table-td"><PayrollStatusBadge status={item.status} /></td>
                <td className="table-td">
                  {item.tx_hash ? (
                    <a
                      href={`${EXPLORER_BASE}/${item.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-mono"
                    >
                      {item.tx_hash.slice(0, 10)}… <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : item.error_message ? (
                    <span className="text-xs text-red-500">{item.error_message.slice(0, 40)}</span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
