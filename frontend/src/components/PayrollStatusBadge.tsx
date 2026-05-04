import { PayrollStatus, ItemStatus } from '../types';

const STATUS_STYLES: Record<PayrollStatus | ItemStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failed: 'bg-red-50 text-red-700 border border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export default function PayrollStatusBadge({ status }: { status: PayrollStatus | ItemStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}
