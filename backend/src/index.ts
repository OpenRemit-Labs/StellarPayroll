import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import organizationsRouter from './routes/organizations';
import employeesRouter from './routes/employees';
import payrollsRouter from './routes/payrolls';
import transactionsRouter from './routes/transactions';
import fxRouter from './routes/fx';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', network: config.stellarNetwork }));

app.use('/api/organizations', organizationsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/payrolls', payrollsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/fx', fxRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`StellarPayroll API running on port ${config.port} [${config.stellarNetwork}]`);
});

export default app;
