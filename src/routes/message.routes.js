// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { smsSendRateLimiter } = require('../middleware/rateLimiter.middleware');
const messageController = require('../controllers/message.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/', authMiddleware, messageController.getMessages);
router.post('/send', smsSendRateLimiter, messageController.sendSms);
router.post('/status', messageController.updateSmsStatus);
router.put('/:id/status', authMiddleware, messageController.updateMessageStatusById);
router.post('/receive', messageController.receiveSms);
router.delete('/:id', authMiddleware, messageController.deleteMessage);

module.exports = router;
