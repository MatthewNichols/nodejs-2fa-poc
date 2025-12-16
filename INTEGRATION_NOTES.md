# Integration Notes

This document provides detailed notes for integrating this 2FA POC into your existing project.

## Key Implementation Patterns

### 1. Session-Based 2FA Flow

The authentication flow uses session state to track 2FA verification:

```typescript
// During login (src/back-end/src/routes/auth.ts:54-91)
if (requires2FA) {
  req.session.pendingUserId = user.id;
  req.session.requires2FA = true;
  req.session.twoFactorVerified = false;
  // User is NOT logged in yet
}

// After 2FA verification (src/back-end/src/routes/auth.ts:120-145)
req.login(user, (err) => {
  req.session.twoFactorVerified = true;
  delete req.session.pendingUserId;
  delete req.session.requires2FA;
  // NOW user is logged in
});
```

**Integration Tip:** This pattern prevents bypassing 2FA by checking `req.session.twoFactorVerified` in your middleware.

### 2. SMS Service Abstraction

The SMS service is designed for easy provider swapping:

**Interface Definition:** [src/back-end/src/services/sms/ISmsService.ts](src/back-end/src/services/sms/ISmsService.ts)
```typescript
export interface ISmsService {
  sendSms(to: string, message: string): Promise<void>;
  sendVerificationCode(to: string, code: string): Promise<void>;
}
```

**Factory Pattern:** [src/back-end/src/services/sms/smsServiceFactory.ts](src/back-end/src/services/sms/smsServiceFactory.ts)
```typescript
export function createSmsService(): ISmsService {
  return new TwilioSmsService();
  // To switch: return new SendGridSmsService();
}
```

**To Add a New Provider:**
1. Create `YourProviderSmsService.ts` implementing `ISmsService`
2. Update `smsServiceFactory.ts` to return your provider
3. Done! No other code changes needed

### 3. Supporting Multiple 2FA Methods

Users can have both TOTP and SMS enabled simultaneously:

**Database Schema:** [src/back-end/prisma/schema.prisma](src/back-end/prisma/schema.prisma)
```prisma
model User {
  totpEnabled Boolean @default(false)
  smsEnabled  Boolean @default(false)
  // Both can be true at the same time
}
```

**Login Flow:** User chooses which method to use during verification
- Frontend: [src/front-end/src/views/Verify2FAPage.vue](src/front-end/src/views/Verify2FAPage.vue:27)
- Backend: [src/back-end/src/routes/auth.ts](src/back-end/src/routes/auth.ts:99-114)

### 4. Middleware Architecture

Two-level authentication check:

**Level 1 - Basic Authentication:** [src/back-end/src/middleware/auth.ts](src/back-end/src/middleware/auth.ts:15-25)
```typescript
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  // User must be logged in via Passport
}
```

**Level 2 - 2FA Verification:** [src/back-end/src/middleware/auth.ts](src/back-end/src/middleware/auth.ts:32-44)
```typescript
export function require2FAVerified(req, res, next) {
  if (req.session.requires2FA && !req.session.twoFactorVerified) {
    return res.status(403).json({ requires2FA: true });
  }
  next();
}
```

**Usage:**
```typescript
// Protect routes requiring full auth including 2FA
router.get('/profile', requireFullAuth, handler);
// = [isAuthenticated, require2FAVerified]
```

### 5. TOTP Implementation Details

**Setup Process:** [src/back-end/src/services/auth/totpService.ts](src/back-end/src/services/auth/totpService.ts:21-51)
1. Generate secret using `otplib`
2. Create QR code with `qrcode` library
3. Generate backup codes (bcrypt hashed)
4. Store in database
5. Return QR code to user (only shown once!)

**Verification:** [src/back-end/src/services/auth/totpService.ts](src/back-end/src/services/auth/totpService.ts:83-104)
- First tries TOTP code verification
- Falls back to backup codes if TOTP fails
- Backup codes are one-time use (consider implementing used-code tracking)

**Frontend QR Display:** [src/front-end/src/views/ProfilePage.vue](src/front-end/src/views/ProfilePage.vue:294-305)
```vue
<Image :src="totpQrCode" alt="TOTP QR Code" />
<!-- QR code is base64 data URL -->
```

### 6. SMS Code Management

**Code Generation & Expiry:** [src/back-end/src/services/auth/smsService.ts](src/back-end/src/services/auth/smsService.ts:25-53)
```typescript
const code = generateCode(); // 6 digits
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

// Invalidate old codes before creating new
await prisma.smsCode.updateMany({
  where: { userId, used: false },
  data: { used: true }
});
```

**Verification:** [src/back-end/src/services/auth/smsService.ts](src/back-end/src/services/auth/smsService.ts:58-79)
- Checks code matches
- Checks not expired
- Checks not already used
- Marks as used after verification

**Cleanup:** [src/back-end/src/services/auth/smsService.ts](src/back-end/src/services/auth/smsService.ts:130-137)
```typescript
async cleanupExpiredCodes() {
  // Run this periodically (cron job, etc.)
}
```

## Database Schema Highlights

### User Table
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String   // bcrypt hashed

  phoneNumber String?  // E.164 format for SMS
  bio         String?  // Example profile field

  totpEnabled Boolean @default(false)
  smsEnabled  Boolean @default(false)

  totpSecret TotpSecret?  // One-to-one
  smsCodes   SmsCode[]    // One-to-many
}
```

### Session Storage
```prisma
model Session {
  id        String   @id
  sid       String   @unique
  data      String   // JSON serialized session data
  expiresAt DateTime
}
```

Sessions store:
- Passport user data
- 2FA verification state
- Pending user ID during 2FA flow

## Frontend State Management

### Auth Store Pattern
[src/front-end/src/stores/auth.ts](src/front-end/src/stores/auth.ts)

```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => user.value !== null);

  async function loadUser() {
    // Call /api/auth/me to get current user
  }

  async function logout() {
    // Call /api/auth/logout and clear state
  }
});
```

**Usage in Components:**
```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
// Access: authStore.user, authStore.isAuthenticated
</script>
```

### API Service Pattern
[src/front-end/src/services/authService.ts](src/front-end/src/services/authService.ts)

Centralized API calls with TypeScript types:
```typescript
export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  // ... all other endpoints
};
```

## Security Considerations

### 1. Password Hashing
[src/back-end/src/services/auth/authService.ts](src/back-end/src/services/auth/authService.ts:21-22)
```typescript
const SALT_ROUNDS = 10;
const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
```

### 2. TOTP Secret Storage
Currently stored as plain text in database. For production:
```typescript
// Consider encrypting before storage
import crypto from 'crypto';

const encrypted = encrypt(secret, process.env.ENCRYPTION_KEY);
await prisma.totpSecret.create({ data: { secret: encrypted } });
```

### 3. Session Configuration
[src/back-end/src/index.ts](src/back-end/src/index.ts:38-50)
```typescript
session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true,  // No JS access
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: 'lax',  // CSRF protection
  }
})
```

### 4. Rate Limiting (TODO)
Consider adding rate limiting to:
- Login attempts: [src/back-end/src/routes/auth.ts](src/back-end/src/routes/auth.ts:48)
- 2FA verification: [src/back-end/src/routes/auth.ts](src/back-end/src/routes/auth.ts:99)
- SMS code sending: [src/back-end/src/routes/twoFactor.ts](src/back-end/src/routes/twoFactor.ts:89)

Example with express-rate-limit:
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
});

router.post('/login', loginLimiter, handler);
```

## Common Integration Tasks

### Task: Add to Existing Express App

1. **Copy Prisma schema models** to your existing schema
2. **Copy service files** (auth, sms) to your services directory
3. **Add Passport config** to your app initialization
4. **Mount routes** on your Express app:
   ```typescript
   app.use('/api/auth', authRoutes);
   app.use('/api/2fa', twoFactorRoutes);
   ```
5. **Update middleware** to use `requireFullAuth` on protected routes

### Task: Integrate with Existing User Model

If you already have a User model:
1. Add 2FA fields to your existing User schema
2. Update `authService.ts` to work with your User model
3. Update Passport serialization/deserialization
4. Keep the separate TOTP and SMS models as-is

### Task: Use Different Frontend Framework

The backend is framework-agnostic. For React, Angular, etc.:
1. Use the same API endpoints
2. Implement equivalent state management
3. Follow the same authentication flow pattern
4. Reference the Vue components for UX patterns

### Task: Switch to JWT from Sessions

Major changes required:
1. Remove express-session middleware
2. Issue JWT on successful login + 2FA
3. Store 2FA state in JWT claims during verification flow
4. Update middleware to verify JWT instead of session
5. Handle refresh tokens for security

## Testing Checklist

When integrating into your project, test:

- [ ] User registration
- [ ] Login without 2FA
- [ ] Enable TOTP 2FA
- [ ] Login with TOTP verification
- [ ] TOTP backup code usage
- [ ] Enable SMS 2FA
- [ ] Login with SMS verification
- [ ] SMS code resend
- [ ] Login with both TOTP and SMS enabled (user choice)
- [ ] Disable TOTP 2FA
- [ ] Disable SMS 2FA
- [ ] Profile updates
- [ ] Session persistence across page reloads
- [ ] Logout
- [ ] Protected route access control
- [ ] 2FA bypass prevention (direct API calls)

## Performance Considerations

### Database Indexes
The schema includes indexes on:
- `smsCode.userId` and `expiresAt` for fast lookup
- `session.expiresAt` for cleanup queries

### Cleanup Jobs
Consider running periodic cleanup:
```typescript
// Cleanup expired SMS codes
setInterval(async () => {
  await sms2FAService.cleanupExpiredCodes();
}, 60 * 60 * 1000); // Every hour

// Cleanup expired sessions (if using DB session store)
```

### Caching
Consider caching:
- User profile data (with cache invalidation on updates)
- TOTP secrets (in-memory during verification)

## Deployment Notes

### Environment Variables
Ensure all required variables are set:
- `DATABASE_URL`
- `SESSION_SECRET` (strong random string)
- `PORT`
- `NODE_ENV=production`
- `TWILIO_*` (if using SMS)

### Database Migrations
Run migrations before deployment:
```bash
cd src/back-end
npx prisma migrate deploy
```

### Build Process
```bash
npm run build
# Builds both frontend and backend
```

### Serve Static Frontend
In production, serve the built frontend from the backend:
```typescript
app.use(express.static(path.join(__dirname, '../../front-end/dist')));
```

## Support & References

All code includes inline documentation. Look for:
- `/** INTEGRATION NOTE: ... */` comments
- JSDoc comments on functions
- TypeScript interfaces for type safety

Key reference files:
- Backend entry: [src/back-end/src/index.ts](src/back-end/src/index.ts)
- Auth routes: [src/back-end/src/routes/auth.ts](src/back-end/src/routes/auth.ts)
- 2FA routes: [src/back-end/src/routes/twoFactor.ts](src/back-end/src/routes/twoFactor.ts)
- SMS abstraction: [src/back-end/src/services/sms/](src/back-end/src/services/sms/)
