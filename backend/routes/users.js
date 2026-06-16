const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role,
      location: req.user.location,
      isAvailable: req.user.isAvailable,
      rescueCount: req.user.rescueCount,
      createdAt: req.user.createdAt
    }
  });
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name) req.user.name = name;
    await req.user.save();
    res.json({ success: true, message: 'Profile updated', user: req.user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/location
router.put('/location', protect, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    req.user.updateLocation(latitude, longitude);
    await req.user.save();

    // If victim has active SOS, broadcast location
    if (req.user.role === 'victim') {
      const SOSRequest = require('../models/SOSRequest');
      const activeSOS = await SOSRequest.findOne({
        victimId: req.user._id,
        status: { $in: ['accepted', 'responding'] }
      });

      if (activeSOS) {
        const io = req.app.get('io');
        io.to(`sos_${activeSOS._id}`).emit('victim_location_update', {
          location: { lat: latitude, lng: longitude },
          timestamp: new Date()
        });
      }
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;