// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/adminAuth');
const {
  getUsers,
  toggleUserBan,
  deleteUser,
  getSettings,
  upsertSettings,
  getPayments,
  updatePaymentStatus,
  sendBroadcastEmail,
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(authMiddleware, adminAuth);

router.get('/users', getUsers);
router.put('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

router.get('/settings', getSettings);
router.put('/settings', upsertSettings);

router.get('/payments', getPayments);
router.put('/payments/:id/status', updatePaymentStatus);
router.post('/broadcast', sendBroadcastEmail);

module.exports = router;
