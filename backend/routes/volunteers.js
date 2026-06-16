const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/volunteers/nearby
router.get('/nearby', protect, async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    const volunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000
        }
      }
    }).select('name location isAvailable lastSeen rescueCount').limit(20);

    res.json({ success: true, count: volunteers.length, volunteers });
  } catch (error) {
    next(error);
  }
});

// PUT /api/volunteers/location
router.put('/location', protect, restrictTo('volunteer'), async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location required' });
    }

    req.user.updateLocation(latitude, longitude);
    await req.user.save();

    // Broadcast to active SOS room
    const SOSRequest = require('../models/SOSRequest');
    const activeSOS = await SOSRequest.findOne({
      assignedVolunteer: req.user._id,
      status: { $in: ['accepted', 'responding'] }
    });

    if (activeSOS) {
      const io = req.app.get('io');
      io.to(`sos_${activeSOS._id}`).emit('volunteer_location_update', {
        location: { lat: latitude, lng: longitude },
        timestamp: new Date()
      });
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/volunteers/availability
router.put('/availability', protect, restrictTo('volunteer'), async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    req.user.isAvailable = isAvailable;
    await req.user.save();
    res.json({ success: true, isAvailable: req.user.isAvailable });
  } catch (error) {
    next(error);
  }
});

module.exports = router;