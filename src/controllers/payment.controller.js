// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');
const { sendPaymentNotification } = require('../services/emailService');

async function submitPayment(req, res) {
  try {
    const { senderNumber, trxId, paymentMethod, amount } = req.body;

    if (!senderNumber || !trxId || !paymentMethod || amount === undefined || amount === null) {
      return res.status(400).json({
        message: 'senderNumber, trxId, paymentMethod, and amount are required',
      });
    }

    const normalizedPaymentMethod = String(paymentMethod).toLowerCase();
    if (!['bkash', 'nagad', 'rocket'].includes(normalizedPaymentMethod)) {
      return res.status(400).json({ message: "paymentMethod must be 'bkash', 'nagad', or 'rocket'" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'amount must be a valid positive number' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        isBanned: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account is banned' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        senderNumber: String(senderNumber).trim(),
        trxId: String(trxId).trim(),
        paymentMethod: normalizedPaymentMethod,
        amount: numericAmount,
        status: 'pending',
      },
      select: {
        id: true,
        userId: true,
        senderNumber: true,
        trxId: true,
        paymentMethod: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    if (user.email) {
      await sendPaymentNotification(
        user.email,
        'Payment Request Received',
        `<p>Thank you. We received your payment request (${payment.trxId}).</p><p>We are reviewing it in our Admin Panel. Confirmation will arrive in 5-10 minutes.</p>`
      );
    }

    if (process.env.ADMIN_EMAIL) {
      await sendPaymentNotification(
        process.env.ADMIN_EMAIL,
        'New Payment Request Received',
        `<p>New payment request from user ${user.email || user.id}.</p><p>Please check the Admin Dashboard to verify.</p><p>TrxID: ${payment.trxId}</p>`
      );
    }

    return res.status(201).json({
      message: 'Payment submitted successfully',
      payment,
    });
  } catch (error) {
    if (error && error.code === 'P2002') {
      return res.status(409).json({ message: 'trxId already exists' });
    }

    return res.status(500).json({ message: 'Failed to submit payment' });
  }
}

module.exports = {
  submitPayment,
};
