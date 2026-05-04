import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAppStore } from '../store/useAppStore';

export default function Layout({ children }: { children: ReactNode }) {
  const org = useAppStore((s) => s.currentOrg);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <span className="text-sm font-semibold text-gray-900">{org?.name || 'StellarPayroll'}</span>
            {org && (
              <span className="ml-2 text-xs text-gray-400 font-mono">
                {org.owner_wallet_address.slice(0, 6)}…{org.owner_wallet_address.slice(-4)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Testnet
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
