// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function getUserIdFromJwt(socket) {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.user_id || !isMongoObjectId(payload.user_id)) {
      return null;
    }
    return payload.user_id;
  } catch (error) {
    return null;
  }
}

async function pairDeviceSocket(socket, connectionToken, io, pairingContext = {}) {
  if (!connectionToken) {
    socket.emit('device:paired', { success: false, message: 'Missing connection_token' });
    return;
  }

  const normalizedToken = connectionToken.trim();
  const payloadDeviceName =
    (pairingContext.device_name || pairingContext.deviceName || pairingContext.device_model || pairingContext.deviceModel || '')
      .toString()
      .trim();
  let pendingToken = null;
  let device = await prisma.device.findUnique({
    where: { connectionToken: normalizedToken },
    select: {
      id: true,
      userId: true,
      deviceName: true,
    },
  });

  if (!device) {
    const pendingTokenResult = await prisma.$runCommandRaw({
      find: 'PairingTokens',
      filter: { token: normalizedToken },
      limit: 1,
    });

    pendingToken =
      pendingTokenResult &&
      pendingTokenResult.cursor &&
      Array.isArray(pendingTokenResult.cursor.firstBatch) &&
      pendingTokenResult.cursor.firstBatch.length > 0
        ? pendingTokenResult.cursor.firstBatch[0]
        : null;

    if (!pendingToken) {
      socket.emit('device:paired', { success: false, message: 'Invalid connection_token' });
      return;
    }

    if (!pendingToken.userId || !pendingToken.deviceName) {
      socket.emit('device:paired', { success: false, message: 'Invalid pairing token payload' });
      return;
    }

    if (pendingToken.expiresAt && new Date(pendingToken.expiresAt).getTime() < Date.now()) {
      await prisma.$runCommandRaw({
        delete: 'PairingTokens',
        deletes: [{ q: { token: normalizedToken }, limit: 1 }],
      });
      socket.emit('device:paired', { success: false, message: 'Pairing token expired' });
      return;
    }

    try {
      device = await prisma.device.create({
        data: {
          userId: pendingToken.userId,
          deviceName: pendingToken.deviceName,
          connectionToken: normalizedToken,
          selectedSim: [1, 2].includes(Number(pendingToken.selectedSim)) ? Number(pendingToken.selectedSim) : 1,
          status: 'offline',
        },
        select: {
          id: true,
          userId: true,
          deviceName: true,
        },
      });
    } catch (createError) {
      if (createError && createError.code === 'P2002') {
        device = await prisma.device.findUnique({
          where: { connectionToken: normalizedToken },
          select: {
            id: true,
            userId: true,
            deviceName: true,
          },
        });
      } else {
        throw createError;
      }
    }

    await prisma.$runCommandRaw({
      delete: 'PairingTokens',
      deletes: [{ q: { token: normalizedToken }, limit: 1 }],
    });
  }

  if (!device) {
    socket.emit('device:paired', { success: false, message: 'Invalid connection_token' });
    return;
  }

  const finalDeviceName =
    payloadDeviceName ||
    (device.deviceName && device.deviceName !== 'Pending Connection' ? device.deviceName : null) ||
    (pendingToken && pendingToken.deviceName ? pendingToken.deviceName : null) ||
    'Pending Connection';

  const roomName = `room_user_${device.userId}`;
  socket.data.userId = device.userId;
  socket.data.deviceId = device.id;
  socket.join(roomName);

  await prisma.device.update({
    where: { id: device.id },
    data: {
      socketId: socket.id,
      status: 'online',
      deviceName: finalDeviceName,
    },
  });

  socket.emit('device:paired', {
    success: true,
    room: roomName,
    device_id: device.id,
  });

  io.to(roomName).emit('device:status', {
    device_id: device.id,
    status: 'online',
  });
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const userIdFromJwt = getUserIdFromJwt(socket);
    if (userIdFromJwt) {
      const roomName = `room_user_${userIdFromJwt}`;
      socket.data.userId = userIdFromJwt;
      socket.join(roomName);
      socket.emit('socket:connected', {
        message: 'Web client connected to room',
        room: roomName,
      });
    }

    const handshakeConnectionToken =
      socket.handshake.auth && socket.handshake.auth.connection_token
        ? socket.handshake.auth.connection_token
        : null;
    const handshakePairingContext = {
      device_name: socket.handshake.auth && socket.handshake.auth.device_name ? socket.handshake.auth.device_name : null,
      deviceName: socket.handshake.auth && socket.handshake.auth.deviceName ? socket.handshake.auth.deviceName : null,
      device_model: socket.handshake.auth && socket.handshake.auth.device_model ? socket.handshake.auth.device_model : null,
      deviceModel: socket.handshake.auth && socket.handshake.auth.deviceModel ? socket.handshake.auth.deviceModel : null,
    };

    if (handshakeConnectionToken) {
      pairDeviceSocket(socket, handshakeConnectionToken, io, handshakePairingContext).catch(() => {
        socket.emit('device:paired', { success: false, message: 'Device pairing failed' });
        socket.disconnect(true);
      });
    }

    socket.on('device:pair', async (payload = {}) => {
      try {
        await pairDeviceSocket(socket, payload.connection_token, io, payload);
      } catch (error) {
        socket.emit('device:paired', { success: false, message: 'Device pairing failed' });
      }
    });

    socket.on('disconnect', async () => {
      try {
        const device = await prisma.device.findFirst({
          where: { socketId: socket.id },
          select: {
            id: true,
            userId: true,
          },
        });

        if (!device) {
          return;
        }

        await prisma.device.update({
          where: { id: device.id },
          data: {
            status: 'offline',
            socketId: null,
          },
        });

        io.to(`room_user_${device.userId}`).emit('device:status', {
          device_id: device.id,
          status: 'offline',
        });
      } catch (error) {
        // no-op on disconnect failure
      }
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
