// ©2026 Application or Website Name Mahin Ltd develop by (Tanvir)
const jwt = require('jsonwebtoken');

function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: missing token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || !payload.user_id || !isMongoObjectId(payload.user_id)) {
      return res.status(401).json({ message: 'Unauthorized: invalid token payload' });
    }

    req.user = { id: payload.user_id, user_id: payload.user_id };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
}

module.exports = authMiddleware;
