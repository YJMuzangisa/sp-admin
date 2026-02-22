// lib/email-service.ts (admin panel)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY as string);
const BASE_URL = 'https://salespath.co.za';

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#eeedf4;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eeedf4;padding:48px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

      <!-- LOGO -->
      <tr>
        <td style="padding-bottom:24px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#7c3aed;border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;line-height:40px;">
                <span style="color:#fff;font-weight:900;font-size:22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">S</span>
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;letter-spacing:-0.4px;">SalesPath</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CARD -->
      <tr>
        <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HERO -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <img src="https://salespath.co.za/emails/hero-default.jpg"
                alt="SalesPath"
                width="600"
                style="display:block;width:100%;max-width:600px;height:auto;border-radius:20px 20px 0 0;" />
            </td>
          </tr>

          <!-- BODY -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:44px 52px 52px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;color:#374151;line-height:1.85;">
                ${content}

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 28px;">
                  <tr><td style="border-top:1px solid #f0eff5;">&nbsp;</td></tr>
                </table>

                <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
                  Warm regards,<br/>
                  <strong style="color:#111827;">The SalesPath Team</strong>
                </p>
                <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
                  <a href="mailto:hi@salespath.co.za" style="color:#7c3aed;text-decoration:none;font-weight:500;">hi@salespath.co.za</a>
                  &nbsp;·&nbsp;
                  <a href="${BASE_URL}" style="color:#9ca3af;text-decoration:none;">salespath.co.za</a>
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#0a0a0f;border-radius:0 0 20px 20px;padding:32px 48px;text-align:center;">
          <p style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:13px;color:#6b7280;line-height:1.7;">
            Need help? Reply to this email or reach us at
            <a href="mailto:hi@salespath.co.za" style="color:#9b79f0;text-decoration:none;">hi@salespath.co.za</a>
          </p>
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:12px;color:#3d3d4a;">
            &copy; 2026 SalesPath &nbsp;&middot;&nbsp;
            <a href="https://salespath.co.za" style="color:#3d3d4a;text-decoration:none;">salespath.co.za</a>
          </p>
        </td>
      </tr>

</table>
</body>
</html>`;
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