// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const kycController = require('../controllers/kyc.controller');

const router = express.Router();

// POST /api/kyc/submit - Submit KYC documents
router.post('/submit', authMiddleware, kycController.submitKyc);

// GET /api/kyc/status - Get KYC status
router.get('/status', authMiddleware, kycController.getKycStatus);

module.exports = router;
