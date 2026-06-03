import mongoose, { Schema } from 'mongoose';

const TimelineEntrySchema = new Schema({
  timestamp: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
  },
  status: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  adminName: {
    type: String,
  },
});

const ComplaintSchema = new Schema(
  {
    citizenId: {
      type: String,
      required: true,
      index: true, // Index for fast filtering by citizen
    },
    citizenName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true, // Index for fast category filtering
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      required: true,
      index: true, // Index for dashboard tab loading
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
      index: true, // Index for dashboard priority filters
    },
    photoUrls: {
      type: [String],
      default: [],
    },
    voiceNoteUrl: {
      type: String,
    },
    createdAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
      index: true, // Index for chronologically sorting reports
    },
    updatedAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
    timeline: {
      type: [TimelineEntrySchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    assignee: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for optimized admin dashboard filters
ComplaintSchema.index({ status: 1, priority: 1, createdAt: -1 });

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
