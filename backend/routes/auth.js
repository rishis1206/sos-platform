const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone, role } = req.body;
    console.log(`[AUTH] Login / OTP request received for phone: "${phone}" (role: ${role || 'any'})`);

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required' });
    }

    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    let user = await User.findOne({ phone: cleanPhone });

    // IF user exists and is fully registered (has real name, not 'temp'), DIRECT LOGIN!
    if (user && user.name && user.name !== 'temp' && user.isVerified) {
      if (role && user.role !== role) {
        user.role = role;
        await user.save();
      }

      const token = generateToken(user._id);
      console.log(`[AUTH] ⚡ Direct login granted for registered user: ${user.name} (${cleanPhone})`);

      return res.json({
        success: true,
        isExistingUser: true,
        message: `Welcome back, ${user.name}!`,
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role
        }
      });
    }

    // 1ST TIME REGISTRATION -> Require OTP Flow
    if (!user) {
      user = new User({ phone: cleanPhone, name: 'temp', role: role || 'victim' });
    } else if (role && user.role !== role) {
      user.role = role;
    }

    const otp = user.generateOTP();
    await user.save();

    console.log(`[AUTH] 🔑 OTP generated for 1st-time registration (${cleanPhone}): ${otp}`);

    // Attempt Twilio SMS delivery if credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('paste') &&
        process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_AUTH_TOKEN.includes('paste') &&
        process.env.TWILIO_PHONE_NUMBER && !process.env.TWILIO_PHONE_NUMBER.includes('paste')) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const toPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
        await client.messages.create({
          body: `[GeoSOS] Your emergency platform verification code is: ${otp}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: toPhone
        });
        console.log(`[AUTH] 📱 Twilio SMS dispatched successfully to ${toPhone}`);
      } catch (twErr) {
        console.warn(`[AUTH] ⚠️ Twilio SMS delivery notice: ${twErr.message}`);
      }
    }

    res.json({
      success: true,
      isExistingUser: false,
      message: `OTP sent successfully (${otp})`,
      otp: otp
    });
  } catch (error) {
    console.error('[AUTH] ❌ Error in send-otp:', error);
    next(error);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp, name, role } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Request OTP first.' });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.isVerified = true;

    const isNewUser = user.name === 'temp';

    if (isNewUser) {
      if (!name || !role) {
        return res.status(400).json({
          success: false,
          message: 'Name and role are required for new users',
          isNewUser: true
        });
      }
      user.name = name;
      user.role = role;
    }

    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isNewUser
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role,
      location: req.user.location,
      isAvailable: req.user.isAvailable,
      rescueCount: req.user.rescueCount
    }
  });
});

module.exports = router;