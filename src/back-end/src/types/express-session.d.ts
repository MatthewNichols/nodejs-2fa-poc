import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: string;
    };
    // Track 2FA verification state during login
    pendingUserId?: string;
    requires2FA?: boolean;
    twoFactorVerified?: boolean;
  }
}
