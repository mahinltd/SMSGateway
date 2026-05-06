// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email.util');

const RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 60; // default 60 minutes

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal whether the email exists
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const frontend = process.env.FRONTEND_URL || 'https://sms.mahinai.app';
    const resetLink = `${frontend.replace(/\/$/, '')}/reset-password?token=${token}`;

    const subject = 'Password Reset Request - SMS Gateway';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your account. Click the button below to reset it. This link will expire in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
        <p style="text-align:center; margin: 30px 0;"><a href="${resetLink}" style="background:#3B82F6;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    // send email asynchronously, do not block
    sendEmail(user.email, subject, html).catch((e) => console.error('RESET_EMAIL_ERROR:', e));

    return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('FORGOT_PASSWORD_ERROR:', error);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and newPassword are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('RESET_PASSWORD_ERROR:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

module.exports = {
  forgotPassword,
  resetPassword,
};
