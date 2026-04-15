// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const express = require('express');
const { getPublicSettings } = require('../controllers/settings.controller');

const router = express.Router();

router.get('/public', getPublicSettings);

module.exports = router;
