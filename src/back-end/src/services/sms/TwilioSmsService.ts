import { Twilio } from 'twilio';
import { ISmsService } from './ISmsService';

/**
 * Twilio SMS Service Implementation
 *
 * Sends SMS messages using Twilio API.
 * Requires environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (or TWILIO_MESSAGING_SERVICE_SID for trial accounts)
 */
export class TwilioSmsService implements ISmsService {
  private client: Twilio;
  private fromNumber?: string;
  private messagingServiceSid?: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken) {
      throw new Error(
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env'
      );
    }

    if (!fromNumber && !messagingServiceSid) {
      throw new Error(
        'Twilio sender not configured. Set either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID in .env'
      );
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
    this.messagingServiceSid = messagingServiceSid;
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      const messageOptions: any = {
        body: message,
        to,
      };

      // Use Messaging Service SID if available, otherwise use phone number
      if (this.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.messagingServiceSid;
      } else {
        messageOptions.from = this.fromNumber;
      }

      await this.client.messages.create(messageOptions);
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
