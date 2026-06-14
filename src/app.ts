import express, { Application, Request, Response, NextFunction } from 'express';
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

// Professional Landing Page
app.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shared Expenses App API</title>
    <style>
        :root { --primary: #2563eb; --bg: #f8fafc; --text: #1e293b; --border: #e2e8f0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 4rem auto; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        h1 { color: var(--primary); margin-top: 0; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; margin-bottom: 1rem; }
        .section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .card { padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.2s; }
        .card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .card h3 { margin: 0 0 0.5rem 0; color: var(--primary); }
        .card p { margin: 0; font-size: 0.875rem; color: #64748b; }
        ul { padding-left: 1.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <span class="badge">System Operational</span>
        <h1>Shared Expenses App</h1>
        <p>A robust backend system for managing shared costs, dynamic group memberships, and multi-currency expense tracking. Features an intelligent CSV import pipeline with anomaly detection.</p>
        
        <div class="section">
            <h2>Available Resources</h2>
            <div class="card-grid">
                <a href="/api-docs" class="card">
                    <h3>API Documentation</h3>
                    <p>Interactive Swagger UI exploring all available endpoints, schemas, and authentication requirements.</p>
                </a>
                <a href="/health" class="card">
                    <h3>Health Check</h3>
                    <p>Real-time system status verifying database connectivity and service health.</p>
                </a>
                <a href="/info" class="card">
                    <h3>System Metadata</h3>
                    <p>Production environment details, current version (v1.0.0), and core service identifiers.</p>
                </a>
                <a href="https://github.com/Siva-Pavan02/Shared-Expenses-App" class="card" target="_blank" rel="noopener noreferrer">
                    <h3>GitHub Repository</h3>
                    <p>View the source code, architecture documentation, and deployment guides.</p>
                </a>
            </div>
        </div>

        <div class="section">
            <h2>Core Features</h2>
            <ul>
                <li>Temporal Group Membership Tracking</li>
                <li>Equal, Unequal, Percentage, and Share-based Splits</li>
                <li>Asynchronous CSV Import Pipeline</li>
                <li>Intelligent Anomaly Detection & Resolution Workflow</li>
                <li>Greedy Debt Simplification Algorithm</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
  res.status(200).send(html);
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
