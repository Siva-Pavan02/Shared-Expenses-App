import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

import { prisma } from './config/prisma';
import authRoutes from './modules/auth/routes/auth.routes';
import groupsRoutes from './modules/groups/routes/groups.routes';
import expensesRoutes from './modules/expenses/routes/expenses.routes';
import settlementsRoutes from './modules/settlements/routes/settlements.routes';
import importsRoutes from './modules/imports/routes/imports.routes';
import anomaliesRoutes from './modules/anomalies/routes/anomalies.routes';

// Routes
app.use('/auth', authRoutes);
app.use('/groups', groupsRoutes);
app.use('/expenses', expensesRoutes); // Top-level routes for specific expenses
app.use('/settlements', settlementsRoutes); // Top-level routes for specific settlements
app.use('/imports', importsRoutes); // Top-level routes for CSV import and fetching job details
app.use('/anomalies', anomaliesRoutes); // Top-level routes for reviewing anomalies

// Basic health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
