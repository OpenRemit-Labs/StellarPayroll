# Contributing to StellarPayroll

Thank you for your interest in contributing! StellarPayroll is open-source infrastructure for global payroll on Stellar, and we welcome contributions of all kinds.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/StellarPayroll.git`
3. Follow the [Quick Start](README.md#quick-start) guide to get the project running locally
4. Create a feature branch: `git checkout -b feat/your-feature-name`

## Development Workflow

```bash
# Backend (hot reload)
cd backend && npm run dev

# Frontend (hot reload)
cd frontend && npm run dev
```

## Code Style

- **TypeScript** throughout — no `any` unless unavoidable
- **Backend**: Express route handlers should be thin; business logic lives in `stellar/` or service classes
- **Frontend**: React Query for server state, Zustand for client state, Tailwind for styling
- Keep components small and focused
- Add JSDoc comments to public functions in `stellar/`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Reference any related issues with `Closes #123`
- Ensure the app builds without errors: `npm run build`
- Test your changes against the Stellar testnet

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Stellar network (testnet/mainnet)
- Node.js and browser versions

## Feature Requests

Open an issue with the `enhancement` label. Describe the use case and why it matters for global payroll.

## Areas We Need Help

- **Testing**: Unit tests for `BulkPayoutEngine`, integration tests for API routes
- **Freighter wallet integration**: Replace secret key input with Freighter browser extension signing
- **Scheduled payrolls**: Cron-based execution of scheduled payroll batches
- **Multi-currency**: Support for additional Stellar-based stablecoins (EURC, etc.)
- **Mobile**: Improve mobile responsiveness
- **Docs**: Tutorials, deployment guides, video walkthroughs

## Code of Conduct

Be respectful and constructive. We're building infrastructure for financial inclusion — that mission deserves a welcoming community.
