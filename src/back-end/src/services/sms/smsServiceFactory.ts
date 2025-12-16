import { ISmsService } from './ISmsService';
import { TwilioSmsService } from './TwilioSmsService';

/**
 * SMS Service Factory
 *
 * INTEGRATION NOTE: To use a different SMS provider:
 * 1. Import your provider class (e.g., import { SendGridSmsService } from './SendGridSmsService')
 * 2. Update the return statement below to instantiate your provider
 * 3. That's it! The rest of the application will use your new provider
 *
 * Example for different provider:
 * ```
 * return new SendGridSmsService();
 * ```
 */
export function createSmsService(): ISmsService {
  // Default to Twilio implementation
  return new TwilioSmsService();

  // To switch providers, replace the line above with:
  // return new YourSmsService();
}
