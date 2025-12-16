export interface User {
  id: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  bio: string | null;
  totpEnabled: boolean;
  smsEnabled: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  phoneNumber?: string;
}

export interface Verify2FAData {
  code: string;
  method: '2fa-totp' | '2fa-sms';
}

export interface UpdateProfileData {
  phoneNumber?: string;
  bio?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  requires2FA: boolean;
  methods?: {
    totp: boolean;
    sms: boolean;
  };
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface TotpSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}
