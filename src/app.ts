import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app: Application = express();

// Security and Performance Middleware
app.use(helmet());
app.use(compression());

// Parsers
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

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Production Metadata Endpoint
app.get('/info', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Shared Expenses App',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Enhanced Health Check Route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'ok', 
      service: 'shared-expenses-app',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      service: 'shared-expenses-app',
      version: '1.0.0',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static assets (Landing Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// Explicit Frontend Routes for SPA
const serveIndex = (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
};

app.get('/', serveIndex);
app.get('/login', serveIndex);
app.get('/dashboard', serveIndex);
app.get('/groups', serveIndex);
app.get('/groups/:groupId', serveIndex);
app.get('/groups/:groupId/members', serveIndex);
app.get('/groups/:groupId/expenses', serveIndex);
app.get('/groups/:groupId/settlements', serveIndex);
app.get('/groups/:groupId/balances', serveIndex);
app.get('/groups/:groupId/imports', serveIndex);
app.get('/imports/:importId/anomalies', serveIndex);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
