// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getDashboardStats } = require('../controllers/stats.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/', getDashboardStats);

module.exports = router;
