// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { generateToken, getDevices, revokeDevice } = require('../controllers/device.controller');

const router = express.Router();

router.use(authMiddleware);
router.post('/generate-token', generateToken);
router.get('/', getDevices);
router.delete('/:device_id', revokeDevice);

module.exports = router;
