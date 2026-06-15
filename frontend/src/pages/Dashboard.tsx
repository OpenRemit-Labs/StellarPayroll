import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Send, DollarSign, Clock, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { organizationsApi } from '../api/organizations';
import { payrollsApi } from '../api/payrolls';
import StatCard from '../components/StatCard';
import PayrollStatusBadge from '../components/PayrollStatusBadge';

export default function Dashboard() {
  const org = useAppStore((s) => s.currentOrg);

  const { data: stats } = useQuery({
    queryKey: ['stats', org?.id],
    queryFn: () => organizationsApi.getStats(org!.id),
    enabled: !!org,
  });

  const { data: payrolls, isLoading: payrollsLoading } = useQuery({
    queryKey: ['payrolls', org?.id],
    queryFn: () => payrollsApi.list(org!.id),
    enabled: !!org,
  });

  if (!org) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="card p-10">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to StellarPayroll</h2>
          <p className="text-gray-500 text-sm mb-6">
            Global payroll infrastructure on Stellar. Pay your team anywhere, instantly.
          </p>
          <Link to="/settings" className="btn-primary">
            Create your organization <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const recentPayrolls = payrolls?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
        <Link to="/payrolls/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Run Payroll
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats?.totalEmployees ?? '—'}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Total Payrolls"
          value={stats?.totalPayrolls ?? '—'}
          icon={<Send className="w-5 h-5" />}
        />
        <StatCard
          label="Total Paid Out"
          value={stats ? `${Number(stats.totalPaid).toLocaleString()} tokens` : '—'}
          icon={<DollarSign className="w-5 h-5" />}
          sub="XLM + USDC combined"
        />
        <StatCard
          label="Last Payroll"
          value={stats?.lastPayroll ? format(new Date(stats.lastPayroll.created_at), 'MMM d') : '—'}
          icon={<Clock className="w-5 h-5" />}
          sub={stats?.lastPayroll?.name}
        />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Payrolls</h2>
          <Link to="/payrolls/new" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            New payroll →
          </Link>
        </div>
        {payrollsLoading ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Currency</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="table-td"><div className="h-3.5 bg-gray-200 rounded animate-pulse w-28" /></td>
                  <td className="table-td"><div className="h-3.5 bg-gray-200 rounded animate-pulse w-12" /></td>
                  <td className="table-td"><div className="h-3.5 bg-gray-200 rounded animate-pulse w-16" /></td>
                  <td className="table-td"><div className="h-3.5 bg-gray-200 rounded animate-pulse w-20" /></td>
                  <td className="table-td"><div className="h-3.5 bg-gray-200 rounded animate-pulse w-20" /></td>
                  <td className="table-td" />
                </tr>
              ))}
            </tbody>
          </table>
        ) : recentPayrolls.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No payrolls yet.{' '}
            <Link to="/payrolls/new" className="text-indigo-600 hover:underline">
              Create your first payroll
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Currency</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentPayrolls.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium text-gray-900">{p.name}</td>
                  <td className="table-td">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.currency}</span>
                  </td>
                  <td className="table-td font-mono">{Number(p.total_amount).toLocaleString()}</td>
                  <td className="table-td">
                    <PayrollStatusBadge status={p.status} />
                  </td>
                  <td className="table-td text-gray-400">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                  <td className="table-td">
                    <Link to={`/payrolls/${p.id}`} className="text-xs text-indigo-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
