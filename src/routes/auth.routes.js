// ©2026 SMS GATEWAY Name Mahin Ltd develop by (Tanvir)
const express = require('express');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const passwordController = require('../controllers/password.controller');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Public password recovery endpoints
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password', passwordController.resetPassword);

module.exports = router;
