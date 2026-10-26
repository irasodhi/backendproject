const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect, optionalAuth } = require('../middleware/auth');

// Helper: generate a report ID like REP-XXXX
const genReportId = () => 'REP-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

// ─── GET /api/reports ───────────────────────────────────────────────
// @desc  Fetch all reports with optional filters
// @access Public
router.get('/', async (req, res) => {
  try {
    const { type, category, zone, status, search, page = 1, limit = 50 } = req.query;

    let filter = {};
    if (type && (type === 'lost' || type === 'found')) filter.type = type;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { zone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter).lean().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Report.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), reports });
  } catch (err) {
    console.error('[GET REPORTS ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching reports.' });
  }
});

// ─── GET /api/reports/stats ─────────────────────────────────────────
// @desc  Get dashboard stats (total lost, found, returned, active)
// @access Public
router.get('/stats', async (req, res) => {
  try {
    const [totalLost, totalFound, totalReturned, activeSearching] = await Promise.all([
      Report.countDocuments({ type: 'lost' }),
      Report.countDocuments({ type: 'found' }),
      Report.countDocuments({ status: 'Returned' }),
      Report.countDocuments({ status: 'Searching' }),
    ]);
    res.json({ success: true, stats: { totalLost, totalFound, totalReturned, activeSearching } });
  } catch (err) {
    console.error('[STATS ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
});

// ─── GET /api/reports/my ────────────────────────────────────────────
// @desc  Get reports by current logged-in user
// @access Private
router.get('/my', protect, async (req, res) => {
  try {
    const reports = await Report.find({ postedByEmail: req.user.useremail }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    console.error('[MY REPORTS ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/reports/:id ───────────────────────────────────────────
// @desc  Get a single report by ID (Mongo _id or custom REP- id)
// @access Public
router.get('/:id', async (req, res) => {
  try {
    let report;
    // Try custom id field first, then fallback to _id
    report = await Report.findOne({ _id: req.params.id }).catch(() => null);
    if (!report) {
      report = await Report.findOne({ id: req.params.id });
    }
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/reports ──────────────────────────────────────────────
// @desc  Submit a new lost or found report
// @access Private
router.post('/', optionalAuth, async (req, res) => {
  console.log('[POST /api/reports] Received body:', JSON.stringify({type: req.body.type, itemName: req.body.itemName, id: req.body.id}));
  try {
    const {
      type, itemName, category, color, zone, date, description,
      hiddenDetails, image, contactPhone, postedBy, postedByEmail,
    } = req.body;

    if (!type || !itemName || !date) {
      return res.status(400).json({ success: false, message: 'type, itemName and date are required.' });
    }

    const email = (postedByEmail || (req.user ? req.user.useremail : 'student@campus.edu')).toLowerCase().trim();
    const name  = postedBy || (req.user ? req.user.username : 'Student');

    const report = await Report.create({
      id: req.body.id || genReportId(),
      type,
      itemName: itemName.trim(),
      category: category || 'Other',
      electronicType: req.body.electronicType || req.body.subcategory || '',
      subcategory: req.body.subcategory || req.body.electronicType || '',
      color: color || '',
      zone: zone || '',
      date,
      description: description || '',
      hiddenDetails: hiddenDetails || '',
      image: image || '',
      postedBy: name,
      postedByEmail: email,
      contactPhone: contactPhone || (req.user ? req.user.contactPhone : '') || '',
      status: 'Searching',
      userId: req.user ? req.user._id : null,
    });

    res.status(201).json({ success: true, message: 'Report submitted successfully!', report });
  } catch (err) {
    console.error('[CREATE REPORT ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error creating report.' });
  }
});

// ─── PUT /api/reports/:id ───────────────────────────────────────────
// @desc  Update report (status or details) — only the owner or admin
// @access Private
router.put('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Only the poster or admin can edit
    if (
      report.postedByEmail !== req.user.useremail &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorised to update this report.' });
    }

    const allowedFields = ['itemName', 'category', 'color', 'zone', 'date', 'description',
      'hiddenDetails', 'image', 'contactPhone', 'status'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) report[field] = req.body[field];
    });

    await report.save();
    res.json({ success: true, message: 'Report updated.', report });
  } catch (err) {
    console.error('[UPDATE REPORT ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/reports/:id ────────────────────────────────────────
// @desc  Delete a report — only owner or admin
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    if (
      report.postedByEmail !== req.user.useremail &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this report.' });
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('[DELETE REPORT ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
