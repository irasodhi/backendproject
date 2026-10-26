const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
      default: () => 'REP-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100),
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Report type (lost/found) is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Other',
    },
    electronicType: {
      type: String,
      trim: true,
      default: '',
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    zone: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    hiddenDetails: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    postedBy: {
      type: String,
      trim: true,
      default: 'Anonymous',
    },
    postedByEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Searching', 'Claimed', 'Returned', 'Closed'],
      default: 'Searching',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (!ret.id && ret._id) ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        if (!ret.id && ret._id) ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Full-text search index on itemName and description
reportSchema.index({ itemName: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Report', reportSchema);
