// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a generic email using Resend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @returns {Promise<Object>} - Email send result
 */
async function sendEmail(to, subject, html) {
  try {
    // Get the raw email string from env
    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@mahinai.app';

    // Extract just the email part (e.g., if it's "Mahin AI <noreply@mahinai.app>", extract "noreply@mahinai.app")
    const emailMatch = rawFrom.match(/<(.+)>/);
    const cleanEmail = emailMatch ? emailMatch[1] : rawFrom;

    // Force the exact sender name
    const finalFrom = `SMS Gateway <${cleanEmail}>`;

    const data = await resend.emails.send({
      from: finalFrom,
      to: [to],
      subject: subject,
      html: html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('RESEND_EMAIL_ERROR:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a security alert email for new login detection
 * @param {string} email - User email
 * @param {string} city - City from IP geolocation
 * @param {string} country - Country from IP geolocation
 * @param {string} ip - IP address
 * @returns {Promise<Object>} - Email send result
 */
async function sendLoginSecurityAlert(email, city, country, ip) {
  const location = `${city}, ${country}`;
  const subject = 'New Login Detected - SMS Gateway';

  const html = `
    <div style="font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #22C55E 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SMS GATEWAY</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Security Alert</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">New Login Detected</h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Your SMS Gateway account was just logged in from a new location.
          </p>

          <div style="background: #f3f4f6; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #374151; margin: 8px 0; font-size: 15px;">
              <strong>Location:</strong> ${location}
            </p>
            <p style="color: #374151; margin: 8px 0; font-size: 15px;">
              <strong>IP Address:</strong> ${ip}
            </p>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            If this login was <strong>not you</strong>, please reset your password immediately to secure your account.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sms.mahinai.app/reset-password" style="background: linear-gradient(135deg, #3B82F6 0%, #22C55E 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 15px;">Reset Password Now</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; line-height: 1.6;">
            For your security, never share this information with anyone. If you have any concerns about your account, please contact our support team immediately.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2026 SMS GATEWAY. All rights reserved. | 
            <a href="https://sms.mahinai.app/terms" style="color: #3B82F6; text-decoration: none;">Terms</a> | 
            <a href="https://sms.mahinai.app/privacy" style="color: #3B82F6; text-decoration: none;">Privacy</a> | 
            <a href="https://sms.mahinai.app/contact" style="color: #3B82F6; text-decoration: none;">Contact</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail(email, subject, html);
}

async function sendPasswordResetEmail(email, resetToken) {
  const resetLink = `https://sms.mahinai.app/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request - SMS Gateway';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background: #f9fafb;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p style="color: #4b5563; margin-bottom: 25px;">You requested to reset your SMS Gateway account password. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 25px;">If you didn't request this, please ignore this email. This link will expire in 1 hour.</p>
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
}

async function sendKycApprovalEmail(email, name) {
  const subject = 'KYC Verification Approved - SMS Gateway';
  const html = `
    <div style="font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SMS GATEWAY</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Verification Approved</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">Congratulations, ${name}!</h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Your identity verification was successful. You can now access and use all features of the SMS Gateway.
          </p>

          <div style="background: #f0fdf4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #15803d; margin: 0; font-size: 15px;">
              ✓ Your KYC status is now <strong>Approved</strong>
            </p>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            You can now log in to your dashboard and start sending SMS messages using our platform.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sms.mahinai.app/dashboard" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 15px;">Go to Dashboard</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; line-height: 1.6;">
            If you have any questions, please contact our support team.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2026 SMS GATEWAY. All rights reserved. | 
            <a href="https://sms.mahinai.app/terms" style="color: #10B981; text-decoration: none;">Terms</a> | 
            <a href="https://sms.mahinai.app/privacy" style="color: #10B981; text-decoration: none;">Privacy</a> | 
            <a href="https://sms.mahinai.app/contact" style="color: #10B981; text-decoration: none;">Contact</a>
          </p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
}

async function sendKycRejectionEmail(email, name) {
  const subject = 'KYC Verification Rejected - SMS Gateway';
  const html = `
    <div style="font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SMS GATEWAY</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Verification Status</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 20px 0;">KYC Verification Rejected</h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Dear ${name}, your identity verification was rejected due to unclear or invalid documents.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #991b1b; margin: 0; font-size: 15px;">
              ✗ Your KYC status is <strong>Rejected</strong>
            </p>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Please log in to your dashboard and re-submit your NID (National ID) and Selfie clearly. Ensure all details are visible and the documents are not blurry or expired.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sms.mahinai.app/dashboard/kyc" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 15px;">Resubmit Documents</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; line-height: 1.6;">
            If you need assistance, please contact our support team at support@sms.mahinai.app.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2026 SMS GATEWAY. All rights reserved. | 
            <a href="https://sms.mahinai.app/terms" style="color: #EF4444; text-decoration: none;">Terms</a> | 
            <a href="https://sms.mahinai.app/privacy" style="color: #EF4444; text-decoration: none;">Privacy</a> | 
            <a href="https://sms.mahinai.app/contact" style="color: #EF4444; text-decoration: none;">Contact</a>
          </p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
}

module.exports = {
  sendEmail,
  sendLoginSecurityAlert,
  sendPasswordResetEmail,
  sendKycApprovalEmail,
  sendKycRejectionEmail,
};


