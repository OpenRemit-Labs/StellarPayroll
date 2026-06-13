import axios from 'axios';

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

const FALLBACK_RATES: Record<'XLM' | 'USDC', FXRates> = {
  XLM: { USD: 0.11, NGN: 180, EUR: 0.10, GBP: 0.087 },
  USDC: { USD: 1.0, NGN: 1650, EUR: 0.92, GBP: 0.79 },
};

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  xlm: FXRates;
  usdc: FXRates;
  fetchedAt: number;
  stale: boolean;
}

let cache: CacheEntry | null = null;

export class FXService {
  private async fetchFromCoinGecko(): Promise<{ xlm: FXRates; usdc: FXRates }> {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: { ids: 'stellar,usd-coin', vs_currencies: 'usd,ngn,eur,gbp' },
        timeout: 5000,
      }
    );

    const xlm = data['stellar'] ?? {};
    const usdc = data['usd-coin'] ?? {};

    return {
      xlm: {
        USD: xlm.usd ?? FALLBACK_RATES.XLM.USD,
        NGN: xlm.ngn ?? FALLBACK_RATES.XLM.NGN,
        EUR: xlm.eur ?? FALLBACK_RATES.XLM.EUR,
        GBP: xlm.gbp ?? FALLBACK_RATES.XLM.GBP,
      },
      usdc: {
        USD: usdc.usd ?? FALLBACK_RATES.USDC.USD,
        NGN: usdc.ngn ?? FALLBACK_RATES.USDC.NGN,
        EUR: usdc.eur ?? FALLBACK_RATES.USDC.EUR,
        GBP: usdc.gbp ?? FALLBACK_RATES.USDC.GBP,
      },
    };
  }

  async getAllRates(): Promise<AllFXRates> {
    const now = Date.now();

    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return { XLM: cache.xlm, USDC: cache.usdc, stale: cache.stale };
    }

    try {
      const { xlm, usdc } = await this.fetchFromCoinGecko();
      cache = { xlm, usdc, fetchedAt: now, stale: false };
      return { XLM: xlm, USDC: usdc, stale: false };
    } catch {
      if (cache) {
        cache = { ...cache, stale: true };
        return { XLM: cache.xlm, USDC: cache.usdc, stale: true };
      }
      return { XLM: FALLBACK_RATES.XLM, USDC: FALLBACK_RATES.USDC, stale: true };
    }
  }

  async getRates(baseCurrency: 'XLM' | 'USDC'): Promise<FXRates> {
    const all = await this.getAllRates();
    return all[baseCurrency];
  }
}

export const fxService = new FXService();
