const express = require('express');
const router = express.Router();
const axios = require('axios');
const SOSRequest = require('../models/SOSRequest');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/sos/public - Public activity log (no auth required)
router.get('/public', async (req, res, next) => {
  try {
    const logs = await SOSRequest.find({
      status: { $in: ['completed', 'cancelled', 'pending', 'accepted'] }
    })
      .populate('victimId', 'name')
      .populate('assignedVolunteer', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('category status createdAt completedAt victimId assignedVolunteer severity location')

    res.json({ success: true, logs })
  } catch (error) {
    next(error)
  }
})

// POST /api/sos - Create SOS request with dynamic radius expansion
router.post('/', protect, restrictTo('victim'), async (req, res, next) => {
  try {
    const { category, description, latitude, longitude, address } = req.body

    if (!category || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Category and location are required'
      })
    }

    // Check for active SOS
    const existing = await SOSRequest.findOne({
      victimId: req.user._id,
      status: { $in: ['pending', 'accepted', 'responding'] }
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active SOS request',
        sosId: existing._id
      })
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
    })

    sos.addTimelineEvent('SOS Created')
    await sos.save()

    // Update victim location
    req.user.updateLocation(latitude, longitude)
    await req.user.save()

    const io = req.app.get('io')

    // Dynamic radius expansion stages
    // Stage 1: 500m immediately
    // Stage 2: 1km after 2 minutes
    // Stage 3: 5km after 4 minutes
    // Stage 4: 10km after 6 minutes
    const radiusStages = [
      { radius: 0.5, delay: 0 },
      { radius: 1, delay: 2 * 60 * 1000 },
      { radius: 5, delay: 4 * 60 * 1000 },
      { radius: 10, delay: 6 * 60 * 1000 }
    ]

    const notifyVolunteers = async (radius) => {
      try {
        // Check if SOS is still pending
        const currentSOS = await SOSRequest.findById(sos._id)
        if (!currentSOS || currentSOS.status !== 'pending') {
          console.log(`SOS ${sos._id} no longer pending — stopping radius expansion`)
          return
        }

        // Find volunteers in radius that haven't been notified yet
        const volunteers = await User.find({
          role: 'volunteer',
          isAvailable: true,
          _id: { $nin: currentSOS.notifiedVolunteers },
          location: {
            $nearSphere: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
              },
              $maxDistance: radius * 1000
            }
          }
        }).limit(20)

        if (volunteers.length > 0) {
          currentSOS.notifiedVolunteers.push(...volunteers.map(v => v._id))
          currentSOS.addTimelineEvent(`Notified ${volunteers.length} volunteers within ${radius}km`)
          await currentSOS.save()

          volunteers.forEach(volunteer => {
            io.to(`user_${volunteer._id}`).emit('new_sos_request', {
              sosId: sos._id,
              category: sos.category,
              description: sos.description,
              location: {
                lat: parseFloat(latitude),
                lng: parseFloat(longitude),
                address
              },
              victimName: req.user.name,
              radius: `${radius}km`,
              createdAt: sos.createdAt
            })
          })

          console.log(`📡 SOS ${sos._id}: Notified ${volunteers.length} volunteers within ${radius}km`)
        } else {
          console.log(`📡 SOS ${sos._id}: No new volunteers found within ${radius}km`)
        }
      } catch (err) {
        console.error('Error notifying volunteers:', err.message)
      }
    }

    // Fire each radius stage with delay
    radiusStages.forEach(({ radius, delay }) => {
      setTimeout(() => notifyVolunteers(radius), delay)
    })

    // AI Analysis in background
    axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/analyze`,
      {
        category: sos.category,
        description: sos.description || category,
        sos_id: sos._id.toString()
      }
    ).then(async (response) => {
      const analysis = response.data
      sos.severity = analysis.severity || 'medium'
      sos.aiAnalysis = {
        firstAid: analysis.first_aid || [],
        immediateActions: analysis.immediate_actions || [],
        summary: analysis.summary || '',
        analyzedAt: new Date()
      }
      sos.addTimelineEvent('AI Analysis Completed')
      await sos.save()
    }).catch(err => console.log('AI service unavailable:', err.message))

    const populated = await SOSRequest.findById(sos._id)
      .populate('victimId', 'name phone')

    res.status(201).json({
      success: true,
      message: 'SOS triggered! Searching for nearby volunteers...',
      sos: populated,
      nearbyVolunteers: 0,
      radiusExpansion: true
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/sos - Get SOS requests
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {}

    if (req.user.role === 'victim') {
      query = {
        victimId: req.user._id,
        status: { $in: ['pending', 'accepted', 'responding'] }
      }
    } else {
      query = { status: 'pending' }
    }

    const requests = await SOSRequest.find(query)
      .populate('victimId', 'name phone location')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ success: true, count: requests.length, requests })
  } catch (error) {
    next(error)
  }
})

// GET /api/sos/history
router.get('/history', protect, async (req, res, next) => {
  try {
    const query = req.user.role === 'victim'
      ? { victimId: req.user._id }
      : { assignedVolunteer: req.user._id }

    const history = await SOSRequest.find({
      ...query,
      status: { $in: ['completed', 'cancelled'] }
    })
      .populate('victimId', 'name phone')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ success: true, count: history.length, history })
  } catch (error) {
    next(error)
  }
})

// GET /api/sos/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id)
      .populate('victimId', 'name phone location')
      .populate('assignedVolunteer', 'name phone location')

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS request not found' })
    }

    res.json({ success: true, sos })
  } catch (error) {
    next(error)
  }
})

// PUT /api/sos/:id/accept - Volunteer accepts
router.put('/:id/accept', protect, restrictTo('volunteer'), async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id)

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' })
    }

    if (sos.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Already ${sos.status}` })
    }

    sos.status = 'accepted'
    sos.assignedVolunteer = req.user._id
    sos.addTimelineEvent('Accepted by Volunteer')
    await sos.save()

    req.user.isAvailable = false
    await req.user.save()

    const io = req.app.get('io')
    io.to(`user_${sos.victimId}`).emit('sos_accepted', {
      sosId: sos._id,
      volunteer: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone
      }
    })

    const populated = await SOSRequest.findById(sos._id)
      .populate('victimId', 'name phone location')
      .populate('assignedVolunteer', 'name phone')

    res.json({
      success: true,
      message: 'SOS accepted. Navigate to victim.',
      sos: populated
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/sos/:id/complete
router.put('/:id/complete', protect, restrictTo('volunteer'), async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id)

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' })
    }

    sos.status = 'completed'
    sos.completedAt = new Date()
    sos.addTimelineEvent('Rescue Completed')
    await sos.save()

    req.user.isAvailable = true
    req.user.rescueCount += 1
    await req.user.save()

    const io = req.app.get('io')
    io.to(`user_${sos.victimId}`).emit('sos_completed', { sosId: sos._id })

    res.json({ success: true, message: 'Rescue completed. Great work!', sos })
  } catch (error) {
    next(error)
  }
})

// PUT /api/sos/:id/cancel
router.put('/:id/cancel', protect, restrictTo('victim'), async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id)

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' })
    }

    if (!['pending', 'accepted'].includes(sos.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' })
    }

    sos.status = 'cancelled'
    sos.cancelledAt = new Date()
    sos.addTimelineEvent('Cancelled by Victim')
    await sos.save()

    if (sos.assignedVolunteer) {
      await User.findByIdAndUpdate(sos.assignedVolunteer, { isAvailable: true })
      const io = req.app.get('io')
      io.to(`user_${sos.assignedVolunteer}`).emit('sos_cancelled', { sosId: sos._id })
    }

    res.json({ success: true, message: 'SOS cancelled', sos })
  } catch (error) {
    next(error)
  }
})

module.exports = router;