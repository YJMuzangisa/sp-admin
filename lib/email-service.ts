// lib/email-service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY as string);

class EmailService {
  private log(message: string, error?: unknown) {
    if (error instanceof Error) {
      console.error(`[EmailService] ${message}`, error.message);
    } else {
      console.log(`[EmailService] ${message}`);
    }
  }

  async sendCustomEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    this.log(`Sending custom email to ${to}`);
    try {
      await resend.emails.send({
        to,
        from: '"Siyanda from SalesPath" <hi@salespath.co.za>',
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; color: #374151; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${htmlContent}
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #374151;">The SalesPath Team</strong>
              </p>
            </div>
          </div>
        `,
      });
      this.log(`Custom email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending custom email to ${to}`, error);
      throw new Error('Failed to send custom email');
    }
  }
}

export const emailService = new EmailService();