import mongoose, { Schema } from 'mongoose';

const CitizenSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true, // Highly optimized index for extremely fast login checks
    },
    password: {
      type: String,
      required: true,
    },
    registeredAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.models.Citizen || mongoose.model('Citizen', CitizenSchema);
