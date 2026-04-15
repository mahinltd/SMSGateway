// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

const UserModel = {
  async findById(userId, select) {
    return prisma.user.findUnique({
      where: { id: userId },
      select,
    });
  },

  async updateById(userId, data, select) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select,
    });
  },

  async setRole(userId, role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  },

  async setPaid(userId, isPaid) {
    return prisma.user.update({
      where: { id: userId },
      data: { isPaid },
    });
  },

  async setBanned(userId, isBanned) {
    return prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    });
  },
};

module.exports = UserModel;
