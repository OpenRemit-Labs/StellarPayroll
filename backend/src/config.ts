import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stellarpayroll',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  stellarNetwork: (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'mainnet',
  stellarHorizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  stellarUsdcIssuer: process.env.STELLAR_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  fxApiUrl: process.env.FX_API_URL || 'https://api.exchangerate-api.com/v4/latest',
};
