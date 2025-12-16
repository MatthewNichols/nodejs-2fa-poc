# Node.js 2FA POC

A proof-of-concept Node.js application demonstrating comprehensive two-factor authentication (2FA) using Passport.js, with support for both TOTP (Time-based One-Time Password) and SMS-based verification.

## 🎯 Purpose

This POC demonstrates authentication patterns including:
- User registration and login with Passport.js
- Optional 2FA with multiple methods (TOTP and SMS)
- Users can enable both TOTP and SMS 2FA simultaneously
- Abstracted SMS service layer (Twilio implementation included, easily swappable)
- Session-based authentication
- User profiles

## 🏗️ Architecture

### Backend (`src/back-end`)
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with express-session
- **Database**: PostgreSQL with Prisma ORM
- **2FA Methods**:
  - TOTP: Using authenticator apps (Google Authenticator, Authy, etc.)
  - SMS: Abstracted service layer with Twilio implementation

### Frontend (`src/front-end`)
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **UI Library**: PrimeVue
- **Styling**: SCSS
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (running locally or accessible)
- Twilio account (for SMS 2FA testing)

## 🚀 Getting Started

### 1. Database Setup

Ensure PostgreSQL is running and the database exists:
```bash
createdb nodejs-2fa-poc
```

### 2. Environment Configuration

Backend environment variables are in `src/back-end/.env`:
```env
POSTGRESQL_CONNECTION=postgresql://2fa_appuser:a_random_password@localhost:5432/nodejs-2fa-poc
SESSION_SECRET=your-secret-key-here
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

### 3. Installation & Running

```bash
# Install all dependencies (root, backend, frontend)
npm install

# Run database migrations
npm run db:migrate

# Start both frontend and backend in development mode
npm run dev

# Or run individually:
npm run dev:backend   # Backend only on http://localhost:3000
npm run dev:frontend  # Frontend only on http://localhost:5173
```

## 🔐 Authentication Flow

### Registration
1. User registers with email, username, password, and phone number
2. Account is created in pending state
3. User can log in with basic credentials

### Login
1. User provides username/password
2. If 2FA is enabled, user is prompted for verification
3. User can choose TOTP or SMS verification method
4. Upon successful verification, session is established

### 2FA Setup
Users can enable/disable 2FA methods from their profile:

**TOTP Setup:**
1. Navigate to profile → Enable TOTP
2. Scan QR code with authenticator app
3. Enter verification code to confirm
4. Backup codes are generated

**SMS Setup:**
1. Navigate to profile → Enable SMS 2FA
2. Phone number is verified with a test code
3. Future logins will send SMS codes

## 📁 Project Structure

```
nodejs-2fa-poc/
├── package.json                 # Root package with dev scripts
├── src/
│   ├── back-end/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── src/
│   │       ├── index.ts         # Express app entry
│   │       ├── config/          # Passport, session config
│   │       ├── routes/          # API endpoints
│   │       ├── services/        # Business logic
│   │       │   ├── sms/         # SMS abstraction layer
│   │       │   └── auth/        # Auth services
│   │       ├── middleware/      # Auth middleware
│   │       └── types/           # TypeScript types
│   └── front-end/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.ts
│       │   ├── App.vue
│       │   ├── router/
│       │   ├── views/           # Page components
│       │   ├── components/      # Reusable components
│       │   ├── services/        # API clients
│       │   └── stores/          # State management
│       └── public/
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns 2FA required if enabled)
- `POST /api/auth/verify-2fa` - Verify 2FA code
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### 2FA Management
- `POST /api/2fa/totp/setup` - Initialize TOTP setup
- `POST /api/2fa/totp/verify` - Verify and enable TOTP
- `DELETE /api/2fa/totp` - Disable TOTP
- `POST /api/2fa/sms/setup` - Enable SMS 2FA
- `POST /api/2fa/sms/verify` - Verify SMS code
- `DELETE /api/2fa/sms` - Disable SMS 2FA

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

## 🔧 Implementation Notes for Integration

### SMS Service Abstraction
The SMS service is abstracted in `src/back-end/src/services/sms/`:
- `ISmsService.ts` - Interface defining the contract
- `TwilioSmsService.ts` - Twilio implementation
- `smsServiceFactory.ts` - Factory for dependency injection

**To swap SMS providers:**
1. Create new class implementing `ISmsService`
2. Update factory to instantiate your provider
3. No other code changes needed

### Passport.js Strategy
Located in `src/back-end/src/config/passport.ts`:
- Uses local strategy for username/password
- Session serialization/deserialization
- User lookup with Prisma

### Session Management
- Express-session with PostgreSQL store (via Prisma)
- Session data includes 2FA pending state
- Middleware checks 2FA completion before granting access

### Database Schema (Prisma)
Key models:
- `User` - Auth credentials, profile, 2FA settings
- `Session` - Express session storage
- `TotpSecret` - TOTP secrets and backup codes
- `SmsCode` - SMS verification codes with expiry

### Security Considerations
- Passwords hashed with bcrypt
- TOTP secrets encrypted at rest
- SMS codes expire after 10 minutes
- Rate limiting on verification attempts
- Backup codes for TOTP recovery

## 📝 Development Notes

- TypeScript strict mode enabled throughout
- ESLint + Prettier configured for code consistency
- All async operations properly typed
- Error handling follows REST conventions
- CORS configured for local development

## 🎓 Learning Outcomes

This POC demonstrates:
1. Multi-factor authentication implementation patterns
2. Service abstraction for swappable dependencies
3. Session-based auth vs. JWT considerations
4. Secure storage of sensitive 2FA data
5. User experience for 2FA enrollment and verification
6. Full-stack TypeScript development

## 📄 License

MIT License - See LICENSE file

---

**Note**: This is a proof-of-concept for learning and reference purposes. For production use, additional security hardening, testing, and monitoring should be implemented.
