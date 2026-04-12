// ©2026 Application or Website Name Mahin Ltd develop by (Tanvir)
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

async function pairDeviceSocket(socket, connectionToken, io) {
  if (!connectionToken) {
    socket.emit('device:paired', { success: false, message: 'Missing connection_token' });
    return;
  }

  const device = await prisma.device.findUnique({
    where: { connectionToken: connectionToken.trim() },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!device) {
    socket.emit('device:paired', { success: false, message: 'Invalid connection_token' });
    return;
  }

  const roomName = `room_user_${device.userId}`;
  socket.data.userId = device.userId;
  socket.data.deviceId = device.id;
  socket.join(roomName);

  await prisma.device.update({
    where: { id: device.id },
    data: {
      socketId: socket.id,
      status: 'online',
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

    if (handshakeConnectionToken) {
      pairDeviceSocket(socket, handshakeConnectionToken, io).catch(() => {
        socket.emit('device:paired', { success: false, message: 'Device pairing failed' });
        socket.disconnect(true);
      });
    }

    socket.on('device:pair', async (payload = {}) => {
      try {
        await pairDeviceSocket(socket, payload.connection_token, io);
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
