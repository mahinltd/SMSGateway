// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function generateConnectionToken(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let index = 0; index < length; index += 1) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
}

async function createUniqueConnectionToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const tokenLength = Math.random() > 0.5 ? 6 : 8;
    const token = generateConnectionToken(tokenLength);

    const exists = await prisma.device.findUnique({
      where: { connectionToken: token },
      select: { id: true },
    });

    if (!exists) {
      return token;
    }
  }

  throw new Error('Failed to generate unique connection token');
}

async function ensurePairingTokenIndexes() {
  await prisma.$runCommandRaw({
    createIndexes: 'PairingTokens',
    indexes: [
      {
        key: { token: 1 },
        name: 'token_unique',
        unique: true,
      },
      {
        key: { expiresAt: 1 },
        name: 'expiresAt_ttl',
        expireAfterSeconds: 0,
      },
    ],
  });
}

async function savePairingToken(document) {
  await prisma.$runCommandRaw({
    insert: 'PairingTokens',
    documents: [document],
    ordered: true,
  });
}

async function generateToken(req, res) {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const { device_name, deviceName, selected_sim, selectedSim } = payload;
    const resolvedDeviceName = (device_name || deviceName || '').trim();
    const resolvedSelectedSim = selected_sim ?? selectedSim;
    const userId = req.user && req.user.id ? req.user.id : req.user && req.user.user_id ? req.user.user_id : null;

    if (!userId || !isMongoObjectId(userId)) {
      return res.status(401).json({ message: 'Unauthorized: invalid user context' });
    }

    if (resolvedSelectedSim && ![1, 2].includes(Number(resolvedSelectedSim))) {
      return res.status(400).json({ message: 'selected_sim must be 1 or 2' });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(401).json({ message: 'Unauthorized: user no longer exists' });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
    let connectionToken = null;

    await ensurePairingTokenIndexes();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      connectionToken = await createUniqueConnectionToken();

      try {
        await savePairingToken({
          token: connectionToken,
          userId,
          deviceName: resolvedDeviceName || 'Pending Connection',
          selectedSim: resolvedSelectedSim ? Number(resolvedSelectedSim) : 1,
          createdAt,
          expiresAt,
        });
        break;
      } catch (saveError) {
        const duplicateToken =
          (saveError && saveError.code === 'P2002') ||
          (saveError && typeof saveError.message === 'string' && saveError.message.includes('E11000'));

        if (duplicateToken && attempt < 2) {
          continue;
        }
        throw saveError;
      }
    }

    if (!connectionToken) {
      return res.status(500).json({ message: 'Failed to generate device token' });
    }

    return res.status(201).json({
      message: 'Device token generated successfully',
      connection_token: connectionToken,
      expires_at: expiresAt,
    });
  } catch (error) {
    if (error && error.code === 'P2002') {
      return res.status(409).json({ message: 'Token collision detected, please retry' });
    }
    if (error && error.code === 'P2023') {
      return res.status(400).json({ message: 'Invalid identifier format in request context' });
    }
    console.error('generateToken error:', error);
    return res.status(500).json({ message: 'Failed to generate device token' });
  }
}

async function getDevices(req, res) {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        connectionToken: true,
        socketId: true,
        status: true,
        selectedSim: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ devices });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch devices' });
  }
}

async function revokeDevice(req, res) {
  try {
    const { device_id } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        id: device_id,
        userId: req.user.id,
      },
      select: {
        id: true,
        socketId: true,
      },
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const io = req.app.get('io');
    if (io && device.socketId) {
      const socket = io.sockets.sockets.get(device.socketId);
      if (socket) {
        socket.disconnect(true);
      }
    }

    await prisma.device.delete({
      where: { id: device.id },
    });

    return res.status(200).json({ message: 'Device revoked successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to revoke device' });
  }
}

module.exports = {
  generateToken,
  getDevices,
  revokeDevice,
};
