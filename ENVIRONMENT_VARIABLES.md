# Environment Variables Configuration

The Shared Expenses App relies on several environment variables to secure its configuration and connect to external services. 

**DO NOT COMMIT `.env` FILES TO VERSION CONTROL.**

Below is a template for the required environment variables. Copy this into your `.env` file locally, or paste the keys and values into your PaaS provider's dashboard (e.g., Render Environment Variables).

```env
# ==========================================
# SERVER CONFIGURATION
# ==========================================
# The port the Express application will bind to. 
# Render automatically sets this to 10000 if not specified.
PORT=3000

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
# The full PostgreSQL connection string.
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]
# Example (Local): postgresql://postgres:postgres@localhost:5432/shared_expenses?schema=public
# Example (Render): postgresql://myuser:mypass@dpg-xyz-a.oregon-postgres.render.com/shared_expenses
DATABASE_URL="postgresql://user:password@localhost:5432/shared_expenses?schema=public"

# ==========================================
# SECURITY CONFIGURATION
# ==========================================
# The secret string used to cryptographically sign JSON Web Tokens (JWT).
# In production, this must be a long, unguessable string.
# You can generate a secure one using `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
JWT_SECRET="your-development-jwt-secret-do-not-use-in-production"
```
