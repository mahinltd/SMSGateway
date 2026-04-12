// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authRoutes = require('./auth.routes');
const deviceRoutes = require('./device.routes');
const messageRoutes = require('./message.routes');
const statsRoutes = require('./stats.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/messages', messageRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
