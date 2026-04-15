// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const { Resend } = require('resend');

let resendClient = null;

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

module.exports = {
  sendPaymentNotification,
};
