// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const Settings = require('../models/Settings');

async function getPublicSettings(_req, res) {
  try {
    const settings = await Settings.get();

    return res.status(200).json({
      settings: {
        bkashNumber: settings ? settings.bkashNumber : null,
        nagadNumber: settings ? settings.nagadNumber : null,
        rocketNumber: settings ? settings.rocketNumber : null,
        appPrice: settings ? settings.appPrice : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch public settings' });
  }
}

module.exports = {
  getPublicSettings,
};
