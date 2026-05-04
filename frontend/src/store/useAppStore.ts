import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from '../types';

interface AppState {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentOrg: null,
      setCurrentOrg: (org) => set({ currentOrg: org }),
    }),
    { name: 'sp_store' }
  )
);
