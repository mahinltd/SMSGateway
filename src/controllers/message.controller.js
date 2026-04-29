// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

async function getMessages(req, res) {
  try {
    const data = await prisma.message.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ messages: data });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

async function sendSms(req, res) {
  try {
    const { device_id, phone_number, message_body } = req.body;

    if (!device_id || !phone_number || !message_body) {
      return res.status(400).json({
        message: 'device_id, phone_number, and message_body are required',
      });
    }

    const device = await prisma.device.findFirst({
      where: {
        id: device_id,
        userId: req.user.id,
        status: 'online',
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!device) {
      return res.status(404).json({ message: 'Online device not found for this user' });
    }

    const message = await prisma.message.create({
      data: {
        userId: req.user.id,
        deviceId: device.id,
        phoneNumber: phone_number,
        messageBody: message_body,
        type: 'sent',
        status: 'pending',
      },
      select: {
        id: true,
        deviceId: true,
        phoneNumber: true,
        messageBody: true,
        status: true,
        type: true,
        createdAt: true,
      },
    });

    const io = req.app.get('io');
    const roomName = `room_user_${req.user.id}`;
    io.to(roomName).emit('TRIGGER_SMS_SEND', {
      message_id: message.id,
      device_id: message.deviceId,
      phone_number,
      message_body,
      type: message.type,
      status: message.status,
      created_at: message.createdAt,
    });

    return res.status(201).json({
      message: 'SMS queued and trigger emitted',
      sms: message,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send SMS' });
  }
}

async function updateSmsStatus(req, res) {
  try {
    const { message_id, status } = req.body;

    if (!message_id || !status) {
      return res.status(400).json({ message: 'message_id and status are required' });
    }

    if (!['delivered', 'failed'].includes(status)) {
      return res.status(400).json({ message: "status must be 'delivered' or 'failed'" });
    }

    const existingMessage = await prisma.message.findFirst({
      where: {
        id: message_id,
        userId: req.user.id,
      },
      select: {
        id: true,
        userId: true,
        deviceId: true,
      },
    });

    if (!existingMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: existingMessage.id },
      data: { status },
      select: {
        id: true,
        deviceId: true,
        status: true,
      },
    });

    const io = req.app.get('io');
    const roomName = `room_user_${req.user.id}`;
    io.to(roomName).emit('SMS_STATUS_UPDATED', {
      message_id: updatedMessage.id,
      device_id: updatedMessage.deviceId,
      status: updatedMessage.status,
    });

    return res.status(200).json({
      message: 'SMS status updated',
      sms: updatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update SMS status' });
  }
}

async function receiveSms(req, res) {
  try {
    const { device_id, phone_number, message_body } = req.body;

    if (!device_id || !phone_number || !message_body) {
      return res.status(400).json({
        message: 'device_id, phone_number, and message_body are required',
      });
    }

    const device = await prisma.device.findFirst({
      where: {
        id: device_id,
        userId: req.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const incomingMessage = await prisma.message.create({
      data: {
        userId: req.user.id,
        deviceId: device.id,
        phoneNumber: phone_number,
        messageBody: message_body,
        type: 'received',
        status: 'delivered',
      },
      select: {
        id: true,
        deviceId: true,
        phoneNumber: true,
        messageBody: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    const io = req.app.get('io');
    const roomName = `room_user_${req.user.id}`;
    io.to(roomName).emit('SMS_RECEIVED', {
      message_id: incomingMessage.id,
      device_id: incomingMessage.deviceId,
      phone_number: incomingMessage.phoneNumber,
      message_body: incomingMessage.messageBody,
      type: incomingMessage.type,
      status: incomingMessage.status,
      created_at: incomingMessage.createdAt,
    });

    return res.status(201).json({
      message: 'Incoming SMS received',
      sms: incomingMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process incoming SMS' });
  }
}

async function deleteMessage(req, res) {
  try {
    const { id } = req.params;

    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await prisma.message.delete({
      where: {
        id: existingMessage.id,
      },
    });

    return res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete message' });
  }
}

async function updateMessageStatusById(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'Message id is required' });
    }

    if (!['sent', 'failed'].includes(status)) {
      return res.status(400).json({ message: "status must be 'sent' or 'failed'" });
    }

    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      select: {
        id: true,
        userId: true,
        deviceId: true,
      },
    });

    if (!existingMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: existingMessage.id },
      data: { status },
      select: {
        id: true,
        deviceId: true,
        status: true,
      },
    });

    const io = req.app.get('io');
    const roomName = `room_user_${req.user.id}`;
    io.to(roomName).emit('messageStatusUpdated', {
      message_id: updatedMessage.id,
      device_id: updatedMessage.deviceId,
      status: updatedMessage.status,
    });

    return res.status(200).json({
      message: 'Message status updated',
      sms: updatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update message status' });
  }
}

module.exports = {
  getMessages,
  sendSms,
  updateSmsStatus,
  receiveSms,
  deleteMessage,
  updateMessageStatusById,
};
