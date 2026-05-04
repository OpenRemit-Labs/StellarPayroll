import { useState, useRef } from 'react';
import { Plus, Upload, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';
import { useEmployees, useCreateEmployee, useDeleteEmployee, useImportEmployees } from '../hooks/useEmployees';
import { Employee } from '../types';

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Employees() {
  const org = useAppStore((s) => s.currentOrg);
  const orgId = org?.id || '';
  const { data: employees = [], isLoading } = useEmployees(orgId);
  const createMutation = useCreateEmployee(orgId);
  const deleteMutation = useDeleteEmployee(orgId);
  const importMutation = useImportEmployees(orgId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', wallet_address: '', role: 'employee', currency: 'USDC' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(form as Partial<Employee>);
      toast.success('Employee added');
      setForm({ name: '', email: '', wallet_address: '', role: 'employee', currency: 'USDC' });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Employee removed');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
    });
    try {
      const result = await importMutation.mutateAsync(rows as Partial<Employee>[]);
      toast.success(`Imported ${result.imported} employees`);
    } catch (err: any) {
      toast.error(err.message);
    }
    e.target.value = '';
  };

  if (!org) return <p className="text-sm text-gray-500">Create an organization first.</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Employees</h1>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="btn-secondary">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New Employee</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alice Okafor" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alice@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Stellar Wallet Address *</label>
              <input className="input font-mono text-xs" required value={form.wallet_address} onChange={(e) => setForm({ ...form, wallet_address: e.target.value })} placeholder="G..." />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Preferred Currency</label>
              <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
        ) : employees.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            No employees yet. Add your first team member above.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Wallet</th>
                <th className="table-th">Currency</th>
                <th className="table-th">Role</th>
                <th className="table-th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium text-gray-900">{emp.name}</td>
                  <td className="table-td text-gray-500">{emp.email || '—'}</td>
                  <td className="table-td font-mono text-xs text-gray-500">{truncateAddress(emp.wallet_address)}</td>
                  <td className="table-td">
                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{emp.currency}</span>
                  </td>
                  <td className="table-td capitalize text-gray-500">{emp.role}</td>
                  <td className="table-td">
                    <button onClick={() => handleDelete(emp.id, emp.name)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
        <strong>CSV format:</strong> name, email, wallet_address, role, currency — one employee per row.
      </div>
    </div>
  );
}
