import { apiClient } from './client';
import { Organization, OrgStats } from '../types';

export const organizationsApi = {
  create: async (data: { name: string; owner_wallet_address: string }) => {
    const res = await apiClient.post<{ org: Organization; token: string }>('/organizations', data);
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get<Organization>(`/organizations/${id}`);
    return res.data;
  },
  getStats: async (id: string) => {
    const res = await apiClient.get<OrgStats>(`/organizations/${id}/stats`);
    return res.data;
  },
};
