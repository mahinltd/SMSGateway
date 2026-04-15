// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

const PaymentModel = {
  async create(data) {
    return prisma.payment.create({ data });
  },

  async findByTrxId(trxId) {
    return prisma.payment.findUnique({
      where: { trxId },
    });
  },

  async findByUser(userId) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findPending() {
    return prisma.payment.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
  },

  async updateStatus(paymentId, status) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  },
};

module.exports = PaymentModel;
