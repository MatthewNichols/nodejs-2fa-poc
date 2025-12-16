/**
 * SMS Service Interface
 *
 * This interface defines the contract for SMS sending services.
 * Implement this interface to create different SMS provider integrations.
 *
 * INTEGRATION NOTE: To use a different SMS provider:
 * 1. Create a new class implementing this interface
 * 2. Update smsServiceFactory.ts to instantiate your provider
 * 3. No changes needed elsewhere in the codebase
 */
export interface ISmsService {
  /**
   * Send an SMS message to a phone number
   * @param to - Phone number in E.164 format (e.g., +15551234567)
   * @param message - Message content to send
   * @returns Promise that resolves when message is sent
   * @throws Error if sending fails
   */
  sendSms(to: string, message: string): Promise<void>;

  /**
   * Send a verification code via SMS
   * @param to - Phone number in E.164 format
   * @param code - Verification code to send
   * @returns Promise that resolves when message is sent
   */
  sendVerificationCode(to: string, code: string): Promise<void>;
}
