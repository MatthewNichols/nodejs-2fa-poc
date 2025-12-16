import { Twilio } from 'twilio';
import { ISmsService } from './ISmsService';

/**
 * Twilio SMS Service Implementation
 *
 * Sends SMS messages using Twilio API.
 * Requires environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */
export class TwilioSmsService implements ISmsService {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env'
      );
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to,
      });
    } catch (error) {
      console.error('Failed to send SMS via Twilio:', error);
      throw new Error('Failed to send SMS message');
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const message = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.`;
    await this.sendSms(to, message);
  }
}
