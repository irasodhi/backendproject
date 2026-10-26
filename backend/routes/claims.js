const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const { protect, optionalAuth } = require('../middleware/auth');

const genClaimId = () => 'CLM-' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100);

// ─── GET /api/claims ────────────────────────────────────────────────
// @desc  Get claims for current user or by email query param
// @access Public / Private
router.get('/', optionalAuth, async (req, res) => {
  try {
    const email = req.query.email || (req.user ? req.user.useremail : '');
    let filter = {};
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      filter = {
        $or: [
          { claimantEmail: cleanEmail },
          { claimedByEmail: cleanEmail },
          { ownerEmail: cleanEmail },
          { reporterEmail: cleanEmail },
        ],
      };
    }

    const claims = await Claim.find(filter).lean().sort({ createdAt: -1 });
    res.json({ success: true, claims });
  } catch (err) {
    console.error('[GET CLAIMS ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/claims/all ────────────────────────────────────────────
// @desc  Admin: get all claims
// @access Public / Private
router.get('/all', async (req, res) => {
  try {
    const claims = await Claim.find({}).lean().sort({ createdAt: -1 });
    res.json({ success: true, claims });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/claims/:claimId ───────────────────────────────────────
// @desc  Get a specific claim with messages
// @access Public / Private
router.get('/:claimId', optionalAuth, async (req, res) => {
  try {
    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/claims ───────────────────────────────────────────────
// @desc  Submit a claim on a report
// @access Public / Private
router.post('/', optionalAuth, async (req, res) => {
  console.log('[POST /api/claims] Received body:', JSON.stringify({reportId: req.body.reportId, itemName: req.body.itemName, claimantEmail: req.body.claimantEmail, claimantName: req.body.claimantName}));
  try {
    const {
      reportId, itemId, proofDetails, providedProof, ownerName, reporter,
      ownerEmail, reporterEmail, itemName, reportType, claimantName, claimedBy,
      claimantEmail, claimedByEmail, claimantPhone, status, date, claimId
    } = req.body;

    const rId = reportId || itemId || ('REP-' + Date.now());
    const cEmail = (claimantEmail || claimedByEmail || (req.user ? req.user.useremail : 'student@campus.edu')).toLowerCase().trim();
    const cName  = claimantName || claimedBy || (req.user ? req.user.username : 'Student');
    const oEmail = (ownerEmail || reporterEmail || '').toLowerCase().trim();
    const oName  = ownerName || reporter || 'Founder';
    const proof  = proofDetails || providedProof || '';
    const st     = status || 'Pending Founder Approval';
    const cId    = claimId || genClaimId();

    const claim = await Claim.create({
      claimId: cId,
      reportId: rId,
      itemId: rId,
      itemName: itemName || '',
      reportType: reportType || 'lost',
      claimantName: cName,
      claimedBy: cName,
      claimantEmail: cEmail,
      claimedByEmail: cEmail,
      claimantPhone: claimantPhone || (req.user ? req.user.contactPhone : '') || '',
      ownerName: oName,
      reporter: oName,
      ownerEmail: oEmail,
      reporterEmail: oEmail,
      proofDetails: proof,
      providedProof: proof,
      status: st,
      date: date || new Date().toLocaleDateString(),
      messages: [],
    });



    res.status(201).json({ success: true, message: 'Claim submitted!', claim });
  } catch (err) {
    console.error('[CREATE CLAIM ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error creating claim.' });
  }
});

// ─── PUT /api/claims/:claimId/status ────────────────────────────────
// @desc  Update claim status (Approved / Rejected / MoreInfoRequested)
// @access Public / Private
router.put('/:claimId/status', optionalAuth, async (req, res) => {
  try {
    const { status, rejectionReason, meetingDetails, founderFeedback } = req.body;
    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

    claim.status = status || claim.status;
    if (rejectionReason !== undefined) claim.rejectionReason = rejectionReason;
    if (meetingDetails !== undefined) claim.meetingDetails = meetingDetails;
    if (founderFeedback !== undefined) claim.founderFeedback = founderFeedback;

    await claim.save();



    res.json({ success: true, message: `Claim status updated to ${status}.`, claim });
  } catch (err) {
    console.error('[UPDATE CLAIM STATUS ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/claims/:claimId/messages ─────────────────────────────
// @desc  Add a chat message to a claim
// @access Private
router.post('/:claimId/messages', optionalAuth, async (req, res) => {
  try {
    const { text, type, sender, senderEmail } = req.body;
    const claim = await Claim.findOne({ claimId: req.params.claimId });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const sName = sender || (req.user ? req.user.username : 'User');
    const sEmail = (senderEmail || (req.user ? req.user.useremail : '')).toLowerCase().trim();

    const newMsg = {
      sender: sName,
      senderEmail: sEmail,
      text: text.trim(),
      type: type || 'text',
    };
    claim.messages.push(newMsg);
    await claim.save();



    const savedMsg = claim.messages[claim.messages.length - 1];
    res.status(201).json({ success: true, message: savedMsg });
  } catch (err) {
    console.error('[ADD MESSAGE ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
