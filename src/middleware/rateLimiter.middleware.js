// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const smsSendRateLimiter = rateLimit({
  windowMs: 3 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userPart = req.user && req.user.id ? req.user.id : 'anonymous';
    const devicePart = req.body && req.body.device_id ? req.body.device_id : 'no-device';
    return `${userPart}:${devicePart}:${ipKeyGenerator(req.ip)}`;
  },
  message: {
    message: 'Rate limit exceeded: max 2 SMS in 3 seconds per user/device',
  },
});

module.exports = {
  smsSendRateLimiter,
};
