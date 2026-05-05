// ©2026 SMS GATEWAY Mahin Ltd develop by (Tanvir)
const prisma = require('../config/prisma');

async function submitKyc(req, res) {
  try {
    const { nidFront, nidBack, selfie } = req.body;

    // Validate that at least one document is provided
    if (!nidFront && !nidBack && !selfie) {
      return res.status(400).json({
        message: 'At least one of nidFront, nidBack, or selfie is required',
      });
    }

    // Update user's KYC information
    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        kycStatus: 'pending',
        ...(nidFront && { nidFront }),
        ...(nidBack && { nidBack }),
        ...(selfie && { selfie }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        nidFront: true,
        nidBack: true,
        selfie: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: 'KYC submission successful. Your documents are pending review.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    return res.status(500).json({
      message: 'Failed to submit KYC information',
      error: error.message,
    });
  }
}

async function getKycStatus(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        nidFront: true,
        nidBack: true,
        selfie: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('KYC status fetch error:', error);
    return res.status(500).json({
      message: 'Failed to fetch KYC status',
    });
  }
}

module.exports = {
  submitKyc,
  getKycStatus,
};
