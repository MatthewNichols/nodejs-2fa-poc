# Setup Guide - Node.js 2FA POC

This guide will help you get the application running locally.

## Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18 or higher)
- **PostgreSQL** (running locally or accessible)
- **Twilio Account** (optional, for SMS 2FA testing)

## Step-by-Step Setup

### 1. Database Setup

Create the PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE "nodejs-2fa-poc";

# Create a user (if needed)
CREATE USER 2fa_appuser WITH PASSWORD 'a_random_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "nodejs-2fa-poc" TO 2fa_appuser;

# Exit psql
\q
```

### 2. Environment Configuration

The backend `.env` file is already created at `src/back-end/.env`. Update the following values:

```env
# Database connection
DATABASE_URL=postgresql://2fa_appuser:a_random_password@localhost:5432/nodejs-2fa-poc

# Session secret (change this to a random string!)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Server configuration
PORT=3000
NODE_ENV=development

# Twilio configuration (for SMS 2FA)
TWILIO_ACCOUNT_SID=your-twilio-account-sid-here
TWILIO_AUTH_TOKEN=your-twilio-auth-token-here
TWILIO_PHONE_NUMBER=your-twilio-phone-number-here
```

**Important Notes:**
- Generate a strong random string for `SESSION_SECRET`
- If you don't have Twilio credentials yet, you can still test TOTP 2FA
- Twilio credentials can be obtained from https://www.twilio.com/console

### 3. Install Dependencies

From the root directory:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd src/back-end
npm install

# Install frontend dependencies
cd ../front-end
npm install

# Go back to root
cd ../..
```

Or use the convenience script:

```bash
npm run install:all
```

### 4. Database Migration

Generate Prisma client and run migrations:

```bash
# From root directory
npm run db:generate
npm run db:migrate
```

When prompted for a migration name, you can use: `initial_setup`

This will:
- Generate the Prisma client
- Create all database tables (users, sessions, totp_secrets, sms_codes)
- Set up relationships and indexes

### 5. Verify Database Setup

Optional - open Prisma Studio to view your database:

```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555 where you can inspect tables.

### 6. Start the Application

From the root directory:

```bash
# Start both backend and frontend concurrently
npm run dev
```

Or run them separately in different terminals:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Health Check:** http://localhost:3000/health

## Testing the Application

### 1. Register a User

1. Navigate to http://localhost:5173
2. Click "Register"
3. Fill in the form:
   - Email: test@example.com
   - Username: testuser
   - Password: password123
   - Phone Number: +15551234567 (use your real number for SMS testing)
4. Click "Register"

### 2. Login

1. Click "Login"
2. Enter your username and password
3. If you haven't enabled 2FA yet, you'll be logged in directly

### 3. Enable TOTP 2FA

1. Go to your Profile page
2. In the "Authenticator App (TOTP)" section, click "Enable TOTP"
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Save the backup codes shown
5. Enter the 6-digit code from your app
6. Click "Verify & Enable"

### 4. Enable SMS 2FA

1. Make sure you have a phone number in your profile (update if needed)
2. In the "SMS Verification" section, click "Enable SMS 2FA"
3. You'll receive an SMS with a verification code
4. Enter the code and click "Verify & Enable"

### 5. Test 2FA Login

1. Logout
2. Login again with your credentials
3. You'll be redirected to the 2FA verification page
4. Choose your verification method (TOTP or SMS)
5. Enter the code and verify

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
# Make sure the user, password, and database name match
```

### Prisma Migration Issues

```bash
# Reset the database (WARNING: deletes all data)
cd src/back-end
npx prisma migrate reset

# Or manually drop and recreate
psql -U postgres -c "DROP DATABASE \"nodejs-2fa-poc\";"
psql -U postgres -c "CREATE DATABASE \"nodejs-2fa-poc\";"
npm run db:migrate
```

### SMS Not Sending

1. Verify Twilio credentials in `.env`
2. Check Twilio console for errors
3. Ensure phone number is in E.164 format (+15551234567)
4. For testing, Twilio trial accounts can only send to verified numbers

### Port Already in Use

If ports 3000 or 5173 are already in use:

**Backend (3000):**
Edit `src/back-end/.env` and change `PORT=3000` to another port

**Frontend (5173):**
Edit `src/front-end/vite.config.ts` and change the port in the `server` section

## Next Steps

### Integrating into Your Existing Project

When moving this POC code into your existing project, refer to these key files:

**Backend Integration:**
- [src/back-end/src/config/passport.ts](src/back-end/src/config/passport.ts) - Passport.js configuration
- [src/back-end/src/middleware/auth.ts](src/back-end/src/middleware/auth.ts) - Authentication middleware
- [src/back-end/src/services/sms/](src/back-end/src/services/sms/) - SMS service abstraction
- [src/back-end/prisma/schema.prisma](src/back-end/prisma/schema.prisma) - Database schema

**Frontend Integration:**
- [src/front-end/src/stores/auth.ts](src/front-end/src/stores/auth.ts) - Auth state management
- [src/front-end/src/services/authService.ts](src/front-end/src/services/authService.ts) - API client
- [src/front-end/src/views/](src/front-end/src/views/) - Page components showing UX patterns

**Key Patterns:**
1. Session-based authentication with 2FA state tracking
2. SMS service abstraction for easy provider swapping
3. Supporting multiple 2FA methods simultaneously
4. TOTP with backup codes for recovery

### Customization

**Change SMS Provider:**
1. Create a new class implementing `ISmsService` in `src/back-end/src/services/sms/`
2. Update `smsServiceFactory.ts` to return your new provider
3. No other code changes needed

**Add More 2FA Methods:**
- Follow the pattern in `src/back-end/src/routes/twoFactor.ts`
- Add new service in `src/back-end/src/services/auth/`
- Update Prisma schema if needed for data storage

## Production Considerations

Before deploying to production:

1. **Session Store:** Replace memory store with connect-pg-simple
2. **Environment Variables:** Use proper secrets management
3. **HTTPS:** Enable secure cookies (set `secure: true` in session config)
4. **Rate Limiting:** Add rate limiting to prevent brute force attacks
5. **Error Logging:** Implement proper error tracking (Sentry, etc.)
6. **Database Backups:** Set up automated database backups
7. **TOTP Secret Encryption:** Consider encrypting TOTP secrets at rest

## Support

For issues or questions:
- Check the [README.md](README.md) for architecture overview
- Review inline code comments for integration notes
- All services and routes are documented with JSDoc comments
