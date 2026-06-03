import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    complaintId: {
      type: String,
      required: true,
      index: true, // Indexed for fast relational matching to complaints
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['status-update', 'assignment', 'completion'],
      required: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
      index: true, // Indexed for fast unread notification queries
    },
    createdAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
