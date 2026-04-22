// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');
const Settings = require('../models/Settings');
const { sendPaymentNotification } = require('../services/emailService');

function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

async function getUsers(_req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPaid: true,
        isBanned: true,
        planType: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
}

async function toggleUserBan(req, res) {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isBanned: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: !existingUser.isBanned,
      },
      select: {
        id: true,
        isBanned: true,
      },
    });

    return res.status(200).json({
      message: 'User ban status updated',
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user ban status' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ message: 'User deleted permanently' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}

async function getSettings(_req, res) {
  try {
    const settings = await Settings.upsert({});
    return res.status(200).json({ settings });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch settings' });
  }
}

async function upsertSettings(req, res) {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const bkashNumber =
      payload.bkashNumber !== undefined
        ? payload.bkashNumber
        : payload.bKashNumber !== undefined
          ? payload.bKashNumber
          : payload.bkash_number;
    const nagadNumber = payload.nagadNumber !== undefined ? payload.nagadNumber : payload.nagad_number;
    const rocketNumber = payload.rocketNumber !== undefined ? payload.rocketNumber : payload.rocket_number;
    const appPrice = payload.appPrice !== undefined ? payload.appPrice : payload.app_price;
    const updateData = {};

    if (bkashNumber !== undefined) {
      updateData.bkashNumber = bkashNumber ? String(bkashNumber).trim() : null;
    }

    if (nagadNumber !== undefined) {
      updateData.nagadNumber = nagadNumber ? String(nagadNumber).trim() : null;
    }

    if (rocketNumber !== undefined) {
      updateData.rocketNumber = rocketNumber ? String(rocketNumber).trim() : null;
    }

    if (appPrice !== undefined) {
      const numericPrice = Number(appPrice);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: 'appPrice must be a valid non-negative number' });
      }
      updateData.appPrice = numericPrice;
    }

    const settings = await Settings.upsert(updateData);

    return res.status(200).json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update settings' });
  }
}

async function getPayments(_req, res) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(payments.map((payment) => payment.userId).filter(Boolean))];

    const users = userIds.length
      ? await prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isPaid: true,
            isBanned: true,
          },
        })
      : [];

    const userMap = users.reduce((accumulator, user) => {
      accumulator[user.id] = user;
      return accumulator;
    }, {});

    const normalizedPayments = payments.map((payment) => ({
      id: payment.id,
      userId: payment.userId,
      senderNumber: payment.senderNumber,
      trxId: payment.trxId,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      user: userMap[payment.userId] || {
        name: 'Deleted User',
        email: 'N/A',
      },
    }));

    return res.status(200).json({ data: normalizedPayments });
  } catch (error) {
    console.error('PAYMENT_FETCH_ERROR:', error);
    return res.status(500).json({ message: 'Failed to fetch payments' });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isMongoObjectId(id)) {
      return res.status(400).json({ message: 'Invalid payment id' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isPaid: true,
          },
        },
      },
    });

    if (status === 'approved') {
      await prisma.user.update({
        where: { id: updatedPayment.userId },
        data: { isPaid: true },
      });

      if (updatedPayment.user && updatedPayment.user.email) {
        await sendPaymentNotification(
          updatedPayment.user.email,
          'Payment Approved',
          '<p>Your payment is approved!</p><p>The Download Application tab in your dashboard is now unlocked.</p>'
        );
      }
    }

    return res.status(200).json({
      message: 'Payment status updated successfully',
      payment: updatedPayment,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update payment status' });
  }
}

async function sendBroadcastEmail(req, res) {
  try {
    const { subject, message, target } = req.body || {};

    const normalizedSubject = typeof subject === 'string' ? subject.trim() : '';
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedSubject || !normalizedMessage) {
      return res.status(400).json({ message: 'subject and message are required' });
    }

    if (!['all', 'paid'].includes(target)) {
      return res.status(400).json({ message: "target must be either 'all' or 'paid'" });
    }

    const where = {
      role: {
        not: 'admin',
      },
      email: {
        not: '',
      },
    };

    if (target === 'paid') {
      where.isPaid = true;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        email: true,
      },
    });

    const emails = [...new Set(users.map((user) => user.email).filter(Boolean))];

    if (!emails.length) {
      return res.status(200).json({
        message: 'No users found for the selected target',
        target,
        recipients: 0,
        sent: 0,
        failed: 0,
      });
    }

    const batchSize = 50;
    let sent = 0;
    let failed = 0;

    for (let index = 0; index < emails.length; index += batchSize) {
      const batch = emails.slice(index, index + batchSize);

      const batchResult = await Promise.allSettled(
        batch.map((email) => sendPaymentNotification(email, normalizedSubject, normalizedMessage))
      );

      batchResult.forEach((result) => {
        if (result.status === 'fulfilled' && result.value && result.value.success) {
          sent += 1;
          return;
        }

        failed += 1;
      });
    }

    return res.status(200).json({
      message: 'Broadcast email process completed',
      target,
      recipients: emails.length,
      sent,
      failed,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send broadcast email' });
  }
}

module.exports = {
  getUsers,
  toggleUserBan,
  deleteUser,
  getSettings,
  upsertSettings,
  getPayments,
  updatePaymentStatus,
  sendBroadcastEmail,
};
