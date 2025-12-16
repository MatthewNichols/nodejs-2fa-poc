import api from './api';
import type {
  LoginCredentials,
  RegisterData,
  Verify2FAData,
  ApiResponse,
  LoginResponse,
  User,
  TotpSetup,
  UpdateProfileData,
} from '../types';

/**
 * Authentication Service
 *
 * All API calls for authentication, 2FA, and profile management
 */

export const authService = {
  // ======== Auth ========
  async register(data: RegisterData): Promise<ApiResponse<User>> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async verify2FA(data: Verify2FAData): Promise<ApiResponse<{ user: any }>> {
    const response = await api.post('/auth/verify-2fa', data);
    return response.data;
  },

  async logout(): Promise<ApiResponse> {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // ======== Profile ========
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    const response = await api.put('/profile', data);
    return response.data;
  },

  // ======== TOTP 2FA ========
  async setupTotp(): Promise<ApiResponse<TotpSetup>> {
    const response = await api.post('/2fa/totp/setup');
    return response.data;
  },

  async verifyTotp(code: string): Promise<ApiResponse> {
    const response = await api.post('/2fa/totp/verify', { code });
    return response.data;
  },

  async disableTotp(): Promise<ApiResponse> {
    const response = await api.delete('/2fa/totp');
    return response.data;
  },

  // ======== SMS 2FA ========
  async setupSms(): Promise<ApiResponse> {
    const response = await api.post('/2fa/sms/setup');
    return response.data;
  },

  async verifySms(code: string): Promise<ApiResponse> {
    const response = await api.post('/2fa/sms/verify', { code });
    return response.data;
  },

  async resendSms(): Promise<ApiResponse> {
    const response = await api.post('/2fa/sms/resend');
    return response.data;
  },

  async disableSms(): Promise<ApiResponse> {
    const response = await api.delete('/2fa/sms');
    return response.data;
  },
};
