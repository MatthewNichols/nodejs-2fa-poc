// Common types used throughout the application

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  bio: string | null;
  totpEnabled: boolean;
  smsEnabled: boolean;
  createdAt: Date;
}

export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface Verify2FADTO {
  code: string;
  method: '2fa-totp' | '2fa-sms';
}

export interface UpdateProfileDTO {
  phoneNumber?: string;
  bio?: string;
}

export interface TotpSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
