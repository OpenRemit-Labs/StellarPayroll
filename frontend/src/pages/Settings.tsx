import { useState } from 'react';
import { Loader2, ExternalLink, Wallet, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';
import { useAppStore } from '../store/useAppStore';
import { organizationsApi } from '../api/organizations';

export default function Settings() {
  const { currentOrg, setCurrentOrg, freighterPublicKey, setFreighterPublicKey } = useAppStore();
  const [name, setName] = useState('');
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [freighterLoading, setFreighterLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { org, token } = await organizationsApi.create({ name, owner_wallet_address: wallet });
      localStorage.setItem('sp_token', token);
      setCurrentOrg(org);
      toast.success('Organization created!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const connectFreighter = async () => {
    setFreighterLoading(true);
    try {
      const connStatus = await isConnected();
      if (!connStatus.isConnected) {
        toast.error(
          <span>
            Freighter is not installed.{' '}
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Install it here
            </a>
          </span>
        );
        return;
      }

      const accessRes = await requestAccess();
      if (accessRes.error) {
        toast.error(accessRes.error.message || 'Freighter access denied');
        return;
      }

      setFreighterPublicKey(accessRes.address);
      toast.success('Freighter connected!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect Freighter');
    } finally {
      setFreighterLoading(false);
    }
  };

  const recheckFreighter = async () => {
    setFreighterLoading(true);
    try {
      const res = await getAddress();
      if (res.error || !res.address) {
        setFreighterPublicKey(null);
        toast('Freighter disconnected');
      } else {
        setFreighterPublicKey(res.address);
        toast.success('Freighter still connected');
      }
    } catch {
      setFreighterPublicKey(null);
    } finally {
      setFreighterLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Freighter Wallet */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Freighter Wallet</h2>
        </div>

        {freighterPublicKey ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-800">Connected</p>
                <p className="text-xs font-mono text-emerald-700 break-all">{freighterPublicKey}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={recheckFreighter}
                disabled={freighterLoading}
                className="btn-secondary text-xs"
              >
                {freighterLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Recheck
              </button>
              <button
                onClick={() => setFreighterPublicKey(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Connect Freighter to sign payroll transactions without exposing your secret key.
            </p>
            <button
              onClick={connectFreighter}
              disabled={freighterLoading}
              className="btn-primary w-full justify-center"
            >
              {freighterLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              Connect Freighter
            </button>
            <p className="text-xs text-gray-400">
              Don't have Freighter?{' '}
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Install the browser extension
              </a>
            </p>
          </div>
        )}
      </div>

      {currentOrg ? (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Organization</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{currentOrg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Owner Wallet</span>
              <span className="font-mono text-xs">{currentOrg.owner_wallet_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network</span>
              <span className="text-emerald-600 font-medium">Testnet</span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <a
              href={`https://stellar.expert/explorer/testnet/account/${currentOrg.owner_wallet_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full justify-center"
            >
              View on Stellar Expert <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://laboratory.stellar.org/#account-creator?network=test"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full justify-center"
            >
              Get Testnet XLM (Friendbot) <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <button
            onClick={() => { setCurrentOrg(null); localStorage.removeItem('sp_token'); }}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Switch organization
          </button>
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Create Organization</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Organization Name *</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="label">Owner Stellar Wallet Address *</label>
              <input className="input font-mono text-xs" required value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="G..." />
              <p className="mt-1 text-xs text-gray-400">
                Your Stellar public key (starts with G). Get one at{' '}
                <a href="https://laboratory.stellar.org" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Stellar Laboratory</a>.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Organization
            </button>
          </form>
        </div>
      )}

      <div className="card p-5 bg-indigo-50 border-indigo-100">
        <h3 className="text-sm font-semibold text-indigo-900 mb-2">Testnet Resources</h3>
        <ul className="text-xs text-indigo-700 space-y-1">
          <li>• <a href="https://laboratory.stellar.org/#account-creator?network=test" target="_blank" rel="noopener noreferrer" className="hover:underline">Fund testnet account with Friendbot</a></li>
          <li>• <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noopener noreferrer" className="hover:underline">Stellar Expert Testnet Explorer</a></li>
          <li>• <a href="https://horizon-testnet.stellar.org" target="_blank" rel="noopener noreferrer" className="hover:underline">Horizon Testnet API</a></li>
        </ul>
      </div>
    </div>
  );
}
