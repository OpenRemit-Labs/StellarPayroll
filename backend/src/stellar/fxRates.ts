import axios from 'axios';
import { config } from '../config';

export interface FXRates {
  USD: number;
  NGN: number;
  EUR: number;
  GBP: number;
}

const MOCK_RATES: Record<'XLM' | 'USDC', FXRates> = {
  XLM: { USD: 0.11, NGN: 180, EUR: 0.10, GBP: 0.087 },
  USDC: { USD: 1.0, NGN: 1650, EUR: 0.92, GBP: 0.79 },
};

export class FXService {
  async getRates(baseCurrency: 'XLM' | 'USDC'): Promise<FXRates> {
    if (config.stellarNetwork === 'testnet') {
      return MOCK_RATES[baseCurrency];
    }

    try {
      // For USDC (pegged to USD), use USD as base
      const base = baseCurrency === 'USDC' ? 'USD' : 'XLM';
      const { data } = await axios.get(`${config.fxApiUrl}/${base}`, { timeout: 5000 });
      const rates = data.rates as Record<string, number>;

      if (baseCurrency === 'USDC') {
        return {
          USD: 1.0,
          NGN: rates.NGN || MOCK_RATES.USDC.NGN,
          EUR: rates.EUR || MOCK_RATES.USDC.EUR,
          GBP: rates.GBP || MOCK_RATES.USDC.GBP,
        };
      }

      // XLM: get XLM/USD price then derive others
      const xlmUsd = MOCK_RATES.XLM.USD; // fallback
      return {
        USD: xlmUsd,
        NGN: xlmUsd * (rates.NGN || 1500),
        EUR: xlmUsd * (rates.EUR || 0.92),
        GBP: xlmUsd * (rates.GBP || 0.79),
      };
    } catch {
      return MOCK_RATES[baseCurrency];
    }
  }
}

export const fxService = new FXService();
