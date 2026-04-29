// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');
const { sendProfessionalEmail } = require('../services/emailService');

async function sendAdminEmailToUser(req, res) {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const userId = payload.userId || payload.user_id;
    const email = payload.email ? String(payload.email).trim().toLowerCase() : '';
    const subject = payload.subject ? String(payload.subject).trim() : '';
    const message = payload.message ? String(payload.message).trim() : '';

    if (!subject || !message) {
      return res.status(400).json({ message: 'subject and message are required' });
    }

    if (!userId && !email) {
      return res.status(400).json({ message: 'userId or email is required' });
    }

    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
          },
        })
      : await prisma.user.findFirst({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
          },
        });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Emails can only be sent to non-admin users' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'Target user does not have an email address' });
    }

    const result = await sendProfessionalEmail(user.email, subject, message, {
      recipientName: user.name,
    });

    if (!result.success) {
      return res.status(500).json({ message: result.message || 'Failed to send email' });
    }

    return res.status(200).json({
      message: 'Email sent successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send email' });
  }
}

module.exports = {
  sendAdminEmailToUser,
};