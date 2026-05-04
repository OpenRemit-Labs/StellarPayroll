# Roadmap

StellarPayroll is production-ready infrastructure. This roadmap outlines what's built and what's coming.

## ✅ v1.0 — Core Infrastructure (Current)

- [x] Organization management with JWT auth
- [x] Employee/contractor management with CSV import
- [x] Payroll batch creation (XLM + USDC)
- [x] Bulk payment engine (up to 100 ops per transaction)
- [x] Partial failure handling with per-payment retry
- [x] Transaction tracking with Stellar Explorer links
- [x] FX rate display (USD, NGN, EUR, GBP)
- [x] Non-custodial signing (secret key never stored)
- [x] Testnet + mainnet support
- [x] React dashboard with payroll wizard

---

## 🔨 v1.1 — Wallet Integration

- [ ] **Freighter wallet support** — replace secret key input with browser extension signing
- [ ] **Albedo support** — web-based signing without extension
- [ ] WalletConnect integration

---

## 📅 v1.2 — Scheduled Payrolls

- [ ] Cron-based scheduled execution
- [ ] Recurring payroll templates (weekly, bi-weekly, monthly)
- [ ] Email/webhook notifications on execution
- [ ] Payroll approval workflow (finance → admin)

---

## 💱 v1.3 — Multi-Currency & FX

- [ ] Live XLM/USD price feed (CoinGecko or Stellar DEX)
- [ ] EURC support (Euro stablecoin on Stellar)
- [ ] Per-employee currency preference
- [ ] Stellar DEX path payments for automatic FX conversion

---

## 👤 v1.4 — Employee Portal

- [ ] Employee self-service login (wallet-based auth)
- [ ] Payment history view
- [ ] Downloadable pay stubs (PDF)
- [ ] Tax export (CSV with fiat equivalents at time of payment)

---

## 🏢 v1.5 — Enterprise Features

- [ ] Multi-admin organizations with role-based access
- [ ] Audit log for all actions
- [ ] Payroll approval workflow
- [ ] Webhook events (payroll.executed, payment.failed)
- [ ] REST API with API keys for programmatic access

---

## 🌍 v2.0 — Financial Inclusion Layer

- [ ] Integration with Stellar Anchor network for local cash-out
- [ ] Mobile-first PWA for employees in low-bandwidth regions
- [ ] Support for Stellar-based local stablecoins (NGNC, etc.)
- [ ] Compliance toolkit (KYC hooks, reporting)

---

## Contributing to the Roadmap

Have a feature idea? Open an issue with the `roadmap` label. We prioritize features that directly serve remote workers in emerging markets.
