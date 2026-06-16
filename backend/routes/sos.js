const express = require('express');
const router = express.Router();
const axios = require('axios');
const SOSRequest = require('../models/SOSRequest');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// POST /api/sos - Create SOS request
router.post('/', protect, restrictTo('victim'), async (req, res, next) => {
  try {
    const { category, description, latitude, longitude, address } = req.body;

    if (!category || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Category and location are required' });
    }

    // Check if victim already has active SOS
    const existing = await SOSRequest.findOne({
      victimId: req.user._id,
      status: { $in: ['pending', 'accepted', 'responding'] }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active SOS request',
        sosId: existing._id
      });
    }

    // Create SOS
    const sos = new SOSRequest({
      victimId: req.user._id,
      category,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address
      }
    });

    sos.addTimelineEvent('SOS Created');
    await sos.save();

    // Update victim location
    req.user.updateLocation(latitude, longitude);
    await req.user.save();

    // Find nearby volunteers
    const radius = parseInt(process.env.DEFAULT_SEARCH_RADIUS || 10);
    const nearbyVolunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000
        }
      }
    }).limit(20);

    // Notify volunteers via socket
    const io = req.app.get('io');
    nearbyVolunteers.forEach(volunteer => {
      io.to(`user_${volunteer._id}`).emit('new_sos_request', {
        sosId: sos._id,
        category: sos.category,
        description: sos.description,
        location: { lat: parseFloat(latitude), lng: parseFloat(longitude), address },
        victimName: req.user.name,
        createdAt: sos.createdAt
      });
    });

    // Get AI analysis in background
    axios.post(`${process.env.AI_SERVICE_URL}/api/analyze`, {
      category: sos.category,
      description: sos.description || category,
      sos_id: sos._id.toString()
    }).then(async (response) => {
      const analysis = response.data;
      sos.severity = analysis.severity || 'medium';
      sos.aiAnalysis = {
        firstAid: analysis.first_aid || [],
        immediateActions: analysis.immediate_actions || [],
        summary: analysis.summary || '',
        analyzedAt: new Date()
      };
      sos.addTimelineEvent('AI Analysis Completed');
      await sos.save();
    }).catch(err => console.log('AI service unavailable:', err.message));

    const populated = await SOSRequest.findById(sos._id)
      .populate('victimId', 'name phone');

    res.status(201).json({
      success: true,
      message: 'SOS triggered. Help is on the way!',
      sos: populated,
      nearbyVolunteers: nearbyVolunteers.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sos - Get SOS requests
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'victim') {
      query = {
        victimId: req.user._id,
        status: { $in: ['pending', 'accepted', 'responding'] }
      };
    } else {
      query = { status: 'pending' };
    }

    const requests = await SOSRequest.find(query)
      .populate('victimId', 'name phone')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    next(error);
  }
});

// GET /api/sos/history
router.get('/history', protect, async (req, res, next) => {
  try {
    const query = req.user.role === 'victim'
      ? { victimId: req.user._id }
      : { assignedVolunteer: req.user._id };

    const history = await SOSRequest.find({
      ...query,
      status: { $in: ['completed', 'cancelled'] }
    })
      .populate('victimId', 'name phone')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, count: history.length, history });
  } catch (error) {
    next(error);
  }
});

// GET /api/sos/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id)
      .populate('victimId', 'name phone location')
      .populate('assignedVolunteer', 'name phone location');

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS request not found' });
    }

    res.json({ success: true, sos });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sos/:id/accept - Volunteer accepts
router.put('/:id/accept', protect, restrictTo('volunteer'), async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    if (sos.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Already ${sos.status}` });
    }

    sos.status = 'accepted';
    sos.assignedVolunteer = req.user._id;
    sos.addTimelineEvent('Accepted by Volunteer');
    await sos.save();

    req.user.isAvailable = false;
    await req.user.save();

    const io = req.app.get('io');
    io.to(`user_${sos.victimId}`).emit('sos_accepted', {
      sosId: sos._id,
      volunteer: { id: req.user._id, name: req.user.name, phone: req.user.phone }
    });

    res.json({ success: true, message: 'SOS accepted. Navigate to victim.', sos });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sos/:id/complete
router.put('/:id/complete', protect, restrictTo('volunteer'), async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    sos.status = 'completed';
    sos.completedAt = new Date();
    sos.addTimelineEvent('Rescue Completed');
    await sos.save();

    req.user.isAvailable = true;
    req.user.rescueCount += 1;
    await req.user.save();

    const io = req.app.get('io');
    io.to(`user_${sos.victimId}`).emit('sos_completed', { sosId: sos._id });

    res.json({ success: true, message: 'Rescue completed. Great work!', sos });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sos/:id/cancel
router.put('/:id/cancel', protect, restrictTo('victim'), async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    if (!['pending', 'accepted'].includes(sos.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    }

    sos.status = 'cancelled';
    sos.cancelledAt = new Date();
    sos.addTimelineEvent('Cancelled by Victim');
    await sos.save();

    if (sos.assignedVolunteer) {
      await User.findByIdAndUpdate(sos.assignedVolunteer, { isAvailable: true });
      const io = req.app.get('io');
      io.to(`user_${sos.assignedVolunteer}`).emit('sos_cancelled', { sosId: sos._id });
    }

    res.json({ success: true, message: 'SOS cancelled', sos });
  } catch (error) {
    next(error);
  }
});

module.exports = router;