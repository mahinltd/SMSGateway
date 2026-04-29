// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const { Resend } = require('resend');

let resendClient = null;

function getAppName() {
  return process.env.WEBSITE_NAME || process.env.APP_NAME || 'SMS Gateway';
}

function getWebsiteUrl() {
  return 'https://sms.mahinai.app';
}

function getEmailLinks() {
  return {
    termsUrl: 'https://sms.mahinai.app/terms',
    privacyUrl: 'https://sms.mahinai.app/privacy',
    contactUrl: 'https://sms.mahinai.app/contact',
  };
}

function buildProfessionalEmailHtml({ subject, message, recipientName } = {}) {
  const appName = getAppName();
  const links = getEmailLinks();
  const safeRecipient = recipientName ? `<p style="margin:0 0 16px;color:#334155;font-size:15px;">Hi ${recipientName},</p>` : '';

  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:24px 32px;">
                  <div style="text-align: center; padding: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="80" height="80" style="display: block; margin: 0 auto;">
                      <defs>
                        <linearGradient id="bg" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="#3B82F6" />
                          <stop offset="100%" stop-color="#22C55E" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="108" height="108" rx="24" fill="url(#bg)" />
                      <path fill="#FFFFFF" d="M34 36h40c3.3 0 6 2.7 6 6v24c0 3.3-2.7 6-6 6H46l-8 8v-8h-4c-3.3 0-6-2.7-6-6V42c0-3.3 2.7-6 6-6z" />
                      <path fill="#E2E8F0" d="M40 46h28v3H40zM40 54h18v3H40z" />
                      <circle cx="78" cy="66" r="10" fill="#22C55E" />
                      <path fill="#FFFFFF" d="M73 66l3 3 5-5 1.4 1.4-6.4 6.4-4.4-4.4z" />
                    </svg>
                    <h2 style="color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 10px 0 0;">SMS GATEWAY Mahin Ltd</h2>
                    <div style="font-size:13px;color:#dbeafe;margin-top:4px;">${subject || 'Important update'}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  ${safeRecipient}
                  <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#0f172a;">${subject || 'Update from our team'}</h1>
                  <div style="font-size:15px;line-height:1.8;color:#334155;">${message || ''}</div>
                  <div style="margin-top:28px;padding:16px 18px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;font-size:14px;line-height:1.7;color:#1e3a8a;">
                    Need help? Visit our support pages below.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 28px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:8px 0;">
                        <a href="${links.termsUrl}" style="color:#1d4ed8;text-decoration:none;font-size:13px;margin-right:16px;">Terms & Conditions</a>
                        <a href="${links.privacyUrl}" style="color:#1d4ed8;text-decoration:none;font-size:13px;margin-right:16px;">Privacy Policy</a>
                        <a href="${links.contactUrl}" style="color:#1d4ed8;text-decoration:none;font-size:13px;">Contact Us</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <div style="max-width:640px;margin:12px auto 0;font-size:12px;line-height:1.7;color:#64748b;text-align:center;">
              Sent by ${appName}. This email was generated automatically.
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

async function sendPaymentNotification(to, subject, html) {
  try {
    if (!to || !subject || !html) {
      return {
        success: false,
        message: 'Missing required email fields',
      };
    }

    const client = getResendClient();
    if (!client) {
      return {
        success: false,
        skipped: true,
        message: 'RESEND_API_KEY is not configured',
      };
    }

    const from = process.env.RESEND_FROM_EMAIL || 'SMS Gateway <no-reply@mahinai.app>';
    const result = await client.emails.send({
      from,
      to,
      subject,
      html,
    });

    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: error && error.message ? error.message : 'Failed to send email',
    };
  }
}

async function sendProfessionalEmail(to, subject, message, options = {}) {
  try {
    if (!to || !subject || !message) {
      return {
        success: false,
        message: 'Missing required email fields',
      };
    }

    const client = getResendClient();
    if (!client) {
      return {
        success: false,
        skipped: true,
        message: 'RESEND_API_KEY is not configured',
      };
    }

    const from = process.env.RESEND_FROM_EMAIL || 'SMS Gateway <no-reply@mahinai.app>';
    const html = buildProfessionalEmailHtml({
      subject,
      message,
      recipientName: options.recipientName,
    });

    const result = await client.emails.send({
      from,
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.CONTACT_EMAIL,
    });

    return {
      success: true,
      result,
      html,
    };
  } catch (error) {
    return {
      success: false,
      message: error && error.message ? error.message : 'Failed to send email',
    };
  }
}

module.exports = {
  buildProfessionalEmailHtml,
  sendProfessionalEmail,
  sendPaymentNotification,
};
