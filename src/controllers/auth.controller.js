// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { sendLoginSecurityAlert } = require('../utils/email.util');

async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        planType: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user' });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        planType: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.id, email: user.email, plan_type: user.planType, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Send security alert asynchronously (non-blocking)
    (async () => {
      try {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
        const cleanIp = typeof ip === 'string' ? ip.split(',')[0].trim() : ip;

        const geoResponse = await fetch(`http://ip-api.com/json/${cleanIp}`);
        const geoData = await geoResponse.json();

        const city = geoData.city || 'Unknown City';
        const country = geoData.country || 'Unknown Country';

        await sendLoginSecurityAlert(user.email, city, country, cleanIp);
      } catch (error) {
        console.error('SECURITY_ALERT_EMAIL_ERROR:', error);
        // Silently fail - do not interrupt login response
      }
    })();

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        planType: user.planType,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login user' });
  }
}

module.exports = {
  registerUser,
  loginUser,
};
