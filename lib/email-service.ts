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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0eff5;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#7c3aed;border-radius:12px;width:42px;height:42px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:900;font-size:22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:42px;">S</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:19px;font-weight:800;color:#1a1a2e;letter-spacing:-0.5px;">SalesPath</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);border-radius:20px 20px 0 0;padding:44px 48px 40px;text-align:center;">
              <div style="font-size:52px;line-height:1;margin-bottom:0;">📣</div>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:44px 48px 48px;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;color:#374151;line-height:1.8;">
                    ${content}
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;">
                <tr><td style="border-top:1px solid #f0eff5;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td>
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#6b7280;line-height:1.6;">
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
            <td style="padding-top:32px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#a0a0b0;">
                © ${new Date().getFullYear()} SalesPath &nbsp;·&nbsp;
                <a href="${BASE_URL}" style="color:#a0a0b0;text-decoration:none;">salespath.co.za</a>
              </p>
              <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#b8b8c8;">
                Questions? Just reply — we read every email.
              </p>
            </td>
          </tr>

        </table>
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