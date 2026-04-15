// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

async function adminAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        isBanned: true,
      },
    });

    if (!user || user.role !== 'admin' || user.isBanned) {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

    req.user.role = user.role;
    req.user.isBanned = user.isBanned;
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to validate admin access' });
  }
}

module.exports = adminAuth;
