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
<body style="margin:0;padding:0;background-color:#f4f4f7;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#7c3aed;border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;line-height:40px;">
                    <span style="color:#ffffff;font-weight:800;font-size:22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">S</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:-0.3px;">SalesPath</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.04);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 44px 44px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#374151;line-height:1.7;">
                    ${content}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                      <tr><td style="border-top:1px solid #f3f4f6;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:20px 0 0;font-size:14px;color:#6b7280;">
                      The SalesPath Team<br/>
                      <a href="mailto:hi@salespath.co.za" style="color:#7c3aed;text-decoration:none;font-size:13px;">hi@salespath.co.za</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#9ca3af;">
                © ${new Date().getFullYear()} SalesPath &nbsp;·&nbsp;
                <a href="${BASE_URL}" style="color:#9ca3af;text-decoration:none;">salespath.co.za</a>
              </p>
              <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#b0b5be;">
                Questions? Reply to this email — we read every one.
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
        html: emailWrapper(`
          <div style="font-size:15px;color:#374151;line-height:1.75;">
            ${htmlContent}
          </div>
        `),
      });
      this.log(`Custom email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending custom email to ${to}`, error);
      throw new Error('Failed to send custom email');
    }
  }
}

export const emailService = new EmailService();