# Quick Start Guide

Get the 2FA POC up and running in 5 minutes.

## Prerequisites
- Node.js 18+
- PostgreSQL running
- Terminal/Command prompt

## 1. Database Setup (30 seconds)

```bash
# Create PostgreSQL user with CREATEDB permission (needed for Prisma shadow DB)
psql -U postgres -c "CREATE USER twofauser WITH PASSWORD 'a_random_password' CREATEDB;"

# Create database
createdb -U postgres nodejs-2fa-poc

# Grant privileges
psql -U postgres -c 'GRANT ALL PRIVILEGES ON DATABASE "nodejs-2fa-poc" TO twofauser;'
psql -U postgres -d nodejs-2fa-poc -c 'GRANT ALL ON SCHEMA public TO twofauser;'

# Alternatively, do it all in psql interactive session:
# psql -U postgres
# CREATE USER twofauser WITH PASSWORD 'a_random_password' CREATEDB;
# CREATE DATABASE "nodejs-2fa-poc";
# GRANT ALL PRIVILEGES ON DATABASE "nodejs-2fa-poc" TO twofauser;
# \c nodejs-2fa-poc
# GRANT ALL ON SCHEMA public TO twofauser;
# \q

# If you already created the user without CREATEDB, grant it now:
# psql -U postgres -c "ALTER USER twofauser CREATEDB;"
```

## 2. Install Dependencies (2 minutes)

```bash
# Install all dependencies (root, backend, frontend)
npm install
cd src/back-end && npm install
cd ../front-end && npm install
cd ../..
```

## 3. Configure Environment (1 minute)

Edit `src/back-end/.env` and update:

```env
# Generate a random secret:
SESSION_SECRET=your-random-secret-here

# Optional: Add Twilio credentials for SMS testing
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+15551234567
```

## 4. Initialize Database (30 seconds)

```bash
# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
```

When prompted for migration name: `initial_setup`

## 5. Start Application (10 seconds)

```bash
# Start both frontend and backend
npm run dev
```

## 6. Open Browser

Navigate to: **http://localhost:5173**

## First Steps

1. **Register:** Create a new account
2. **Login:** Sign in with your credentials
3. **Profile:** Click "Profile" in the nav
4. **Enable 2FA:** Try enabling TOTP or SMS 2FA
5. **Test:** Logout and login again to test 2FA

## Common Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes (dev)
npm run db:studio        # Open Prisma Studio GUI

# Build
npm run build            # Build for production
```

## Troubleshooting

**Port already in use?**
- Backend: Change `PORT` in `src/back-end/.env`
- Frontend: Change port in `src/front-end/vite.config.ts`

**Database connection failed?**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify `DATABASE_URL` in `src/back-end/.env`

**Can't send SMS?**
- TOTP 2FA works without Twilio
- For SMS, get free trial at https://www.twilio.com/try-twilio

## Next Steps

- See [SETUP.md](SETUP.md) for detailed setup
- See [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) for integration patterns
- See [README.md](README.md) for architecture overview

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health
- Prisma Studio: http://localhost:5555 (when running `npm run db:studio`)
