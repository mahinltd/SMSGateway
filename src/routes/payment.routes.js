// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getPaymentStatus, submitPayment } = require('../controllers/payment.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/status', getPaymentStatus);
router.post('/submit', submitPayment);

module.exports = router;
