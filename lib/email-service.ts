// lib/email-service.ts (admin panel)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY as string);
const BASE_URL = 'https://salespath.co.za';

function textToHtml(text: string): string {
  // Convert plain text with newlines into HTML paragraphs
  return text
    .split(/\n\n+/)
    .map(block => block.trim())
    .filter(block => block.length > 0)
    .map(block => {
      const lines = block.split(/\n/).join('<br/>');
      return '<p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;color:#374151;line-height:1.9;">' + lines + '</p>';
    })
    .join('');
}

function emailWrapper(content: string): string {
  const htmlBody = textToHtml(content);
  return (
    '<!DOCTYPE html>' +
    '<html lang="en"><head>' +
    '<meta charset="UTF-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0" />' +
    '</head>' +
    '<body style="margin:0;padding:0;background:#f0eff5;-webkit-font-smoothing:antialiased;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff5;padding:36px 16px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">' +

    // Logo row above card
    '<tr><td align="left" style="padding:0 0 20px;">' +
    '<span style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:17px;font-weight:800;color:#111;letter-spacing:-0.4px;">&#x2197;&nbsp; SalesPath</span>' +
    '</td></tr>' +

    // Hero image
    '<tr><td style="padding:0;font-size:0;line-height:0;">' +
    '<img src="https://salespath.co.za/emails/hero-default.jpg" alt="SalesPath" width="600" ' +
    'style="display:block;width:100%;max-width:600px;height:auto;border-radius:20px 20px 0 0;" />' +
    '</td></tr>' +

    // White body
    '<tr><td style="background:#ffffff;padding:56px 52px 60px;">' +
    htmlBody +
    // Divider
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:44px 0 32px;">' +
    '<tr><td style="border-top:1px solid #ebebeb;font-size:0;">&nbsp;</td></tr></table>' +
    // Signature
    '<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:14px;font-weight:400;color:#6b7280;line-height:1.7;">' +
    'The SalesPath Team<br/>' +
    '<a href="mailto:hi@salespath.co.za" style="color:#7c3aed;text-decoration:none;font-size:13px;font-weight:600;">hi@salespath.co.za</a>' +
    '</p>' +
    '</td></tr>' +

    // Black footer
    '<tr><td style="background:#0a0a0f;border-radius:0 0 20px 20px;padding:40px 52px;text-align:center;">' +
    '<p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:13px;color:#6b7280;line-height:1.7;">' +
    'Need help? Reply to this email or reach us at ' +
    '<a href="mailto:hi@salespath.co.za" style="color:#9b79f0;text-decoration:none;font-weight:500;">hi@salespath.co.za</a>' +
    '</p>' +
    '<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:12px;color:#3d3d4a;">' +
    '&copy; ' + new Date().getFullYear() + ' SalesPath &nbsp;&middot;&nbsp;' +
    '<a href="https://salespath.co.za" style="color:#3d3d4a;text-decoration:none;">salespath.co.za</a>' +
    '</p>' +
    '</td></tr>' +

    '</table>' +
    '</td></tr></table>' +
    '</body></html>'
  );
}

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
        from: 'SalesPath <hi@salespath.co.za>',
        subject,
        html: emailWrapper(htmlContent),
      });
      this.log(`Custom email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending custom email to ${to}`, error);
      throw new Error('Failed to send custom email');
    }
  }
}

export const emailService = new EmailService();