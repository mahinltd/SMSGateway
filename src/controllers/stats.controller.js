// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

async function getDashboardStats(req, res) {
  try {
    const userId = req.user.id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [activeDevices, smsSentToday, queuedMessages] = await Promise.all([
      prisma.device.count({
        where: {
          userId,
          status: 'online',
        },
      }),
      prisma.message.count({
        where: {
          userId,
          type: 'sent',
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      prisma.message.count({
        where: {
          userId,
          status: 'pending',
        },
      }),
    ]);

    return res.status(200).json({ activeDevices, smsSentToday, queuedMessages });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
}

module.exports = {
  getDashboardStats,
};
