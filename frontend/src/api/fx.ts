import { apiClient } from './client';

export interface FXRates {
  USD: number;
  NGN: number;
  EUR: number;
  GBP: number;
}

export interface AllFXRates {
  XLM: FXRates;
  USDC: FXRates;
  stale: boolean;
}

export const fxApi = {
  getRates: async (): Promise<AllFXRates> => {
    const res = await apiClient.get<AllFXRates>('/fx/rates');
    return res.data;
  },
};
