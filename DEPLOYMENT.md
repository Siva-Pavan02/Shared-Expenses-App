# Deployment Guide

The Shared Expenses App backend is a stateless Node.js REST API that is heavily optimized for modern Platform-as-a-Service (PaaS) environments. This guide uses **Render** as the reference deployment target, though the concepts apply universally to Heroku, Railway, or AWS Elastic Beanstalk.

## Prerequisites
1. A GitHub repository containing the application code.
2. A managed PostgreSQL database (e.g., Render PostgreSQL, Supabase, or AWS RDS).

## 1. Prepare the Deployment Target (Render)
1. Log in to [Render](https://render.com).
2. Create a new **PostgreSQL** database instance. Save the *Internal Database URL*.
3. Create a new **Web Service**.
4. Connect your GitHub repository.

## 2. Configuration Settings
Set the following properties in the Web Service settings:
- **Environment**: Node
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
  - *Why?* This ensures dependencies are installed, the Prisma client matches your exact database schema, any pending migrations are executed, and TypeScript is compiled to pure JavaScript.
- **Start Command**: `npm start`
  - *Why?* This executes `node dist/server.js` (defined in `package.json`). We do not use `ts-node` or `nodemon` in production due to memory and performance overhead.

## 3. Environment Variables
In the Render dashboard, navigate to the Environment tab and add the variables listed in `ENVIRONMENT_VARIABLES.md`.

## 4. Production Security Hardening
Before launching to actual end users, ensure you have reviewed the following:
- Ensure `.env` is strongly `.gitignore`d (already handled).
- Ensure `JWT_SECRET` is a long, cryptographically secure random string (at least 64 characters) and *not* the same as your development secret.
- Configure `cors()` in `app.ts` to strictly allow requests only from your specific frontend domain. Currently, it defaults to accepting all origins.

## 5. Deployment Verification
1. Click **Manual Deploy** or push to your `main` branch.
2. Monitor the Build Logs. Ensure `prisma migrate deploy` executes successfully.
3. Once deployed, test the health check endpoint:
   ```bash
   curl https://your-render-url.onrender.com/
   ```
4. If you receive a `200 OK` or `404 Not Found` (instead of a `502 Bad Gateway`), the server has successfully booted.
