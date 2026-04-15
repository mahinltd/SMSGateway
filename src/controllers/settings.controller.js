// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

const SETTINGS_SINGLETON_KEY = 'SYSTEM';

async function getPublicSettings(_req, res) {
  try {
    let settings = await prisma.settings.findUnique({
      where: { singletonKey: SETTINGS_SINGLETON_KEY },
      select: {
        bkashNumber: true,
        nagadNumber: true,
        rocketNumber: true,
        appPrice: true,
      },
    });

    if (!settings) {
      settings = await prisma.settings.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: {
          bkashNumber: true,
          nagadNumber: true,
          rocketNumber: true,
          appPrice: true,
        },
      });
    }

    const payload = {
      bkashNumber: settings ? settings.bkashNumber : null,
      nagadNumber: settings ? settings.nagadNumber : null,
      rocketNumber: settings ? settings.rocketNumber : null,
      appPrice: settings ? settings.appPrice : null,
    };

    return res.status(200).json({
      ...payload,
      settings: payload,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch public settings' });
  }
}

module.exports = {
  getPublicSettings,
};
