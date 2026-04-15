// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

const SETTINGS_SINGLETON_KEY = 'SYSTEM';

const SettingsModel = {
  async get() {
    return prisma.settings.findUnique({
      where: { singletonKey: SETTINGS_SINGLETON_KEY },
    });
  },

  async upsert(data) {
    return prisma.settings.upsert({
      where: { singletonKey: SETTINGS_SINGLETON_KEY },
      update: data,
      create: {
        singletonKey: SETTINGS_SINGLETON_KEY,
        ...data,
      },
    });
  },
};

module.exports = SettingsModel;
