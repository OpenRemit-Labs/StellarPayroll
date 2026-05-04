import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
}

export default function StatCard({ label, value, icon, trend, trendUp, sub }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">{icon}</div>
      </div>
    </div>
  );
}
