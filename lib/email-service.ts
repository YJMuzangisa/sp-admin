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
<body style="margin:0;padding:0;background-color:#f0eff5;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff5;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

      <!-- HERO -->
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:48px 48px 44px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr>
              <td style="background:rgba(255,255,255,0.15);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;line-height:44px;">
                <span style="color:#fff;font-weight:900;font-size:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">S</span>
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">SalesPath</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;">A message from SalesPath.</h1>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="background:#ffffff;padding:44px 48px 48px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;color:#374151;line-height:1.8;">
                ${content}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 28px;">
                  <tr><td style="border-top:1px solid #f0eff5;font-size:0;">&nbsp;</td></tr>
                </table>
                <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
                  The SalesPath Team<br/>
                  <a href="mailto:hi@salespath.co.za" style="color:#7c3aed;text-decoration:none;font-size:13px;font-weight:500;">hi@salespath.co.za</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8f7ff;padding:20px 48px;text-align:center;border-top:1px solid #ede9fe;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#a0a0b0;">
            © ${new Date().getFullYear()} SalesPath &nbsp;·&nbsp;
            <a href="${BASE_URL}" style="color:#7c3aed;text-decoration:none;">salespath.co.za</a>
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#b8b8c8;">Questions? Just reply — we read every email.</p>
        </td>
      </tr>

    </table>
  </td></tr>
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