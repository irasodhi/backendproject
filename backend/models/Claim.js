const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, trim: true },
    senderEmail: { type: String, lowercase: true, trim: true },
    text: { type: String, trim: true },
    type: { type: String, default: 'text' },
  },
  { timestamps: true }
);

const claimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      unique: true,
      required: true,
    },
    reportId: {
      type: String,
      default: '',
    },
    itemId: {
      type: String,
      default: '',
    },
    itemName: { type: String, trim: true, default: '' },
    reportType: { type: String, default: 'lost' },
    claimantName: { type: String, trim: true, default: '' },
    claimedBy: { type: String, trim: true, default: '' },
    claimantEmail: { type: String, lowercase: true, trim: true, default: '' },
    claimedByEmail: { type: String, lowercase: true, trim: true, default: '' },
    claimantPhone: { type: String, default: '' },
    ownerName: { type: String, trim: true, default: '' },
    reporter: { type: String, trim: true, default: '' },
    ownerEmail: { type: String, lowercase: true, trim: true, default: '' },
    reporterEmail: { type: String, lowercase: true, trim: true, default: '' },
    proofDetails: { type: String, trim: true, default: '' },
    providedProof: { type: String, default: '' },
    status: {
      type: String,
      default: 'Pending Founder Approval',
    },
    date: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    founderFeedback: { type: String, default: '' },
    meetingDetails: {
      type: Object,
      default: null,
    },
    meetingConfirmedBy: { type: String, default: '' },
    messages: [messageSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.claimId;
        ret.itemId = ret.itemId || ret.reportId;
        ret.reportId = ret.reportId || ret.itemId;
        ret.claimedBy = ret.claimedBy || ret.claimantName;
        ret.claimantName = ret.claimantName || ret.claimedBy;
        ret.claimedByEmail = ret.claimedByEmail || ret.claimantEmail;
        ret.claimantEmail = ret.claimantEmail || ret.claimedByEmail;
        ret.reporter = ret.reporter || ret.ownerName;
        ret.ownerName = ret.ownerName || ret.reporter;
        ret.reporterEmail = ret.reporterEmail || ret.ownerEmail;
        ret.ownerEmail = ret.ownerEmail || ret.reporterEmail;
        ret.providedProof = ret.providedProof || ret.proofDetails;
        ret.proofDetails = ret.proofDetails || ret.providedProof;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Claim', claimSchema);
