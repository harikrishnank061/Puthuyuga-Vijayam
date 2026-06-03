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
      required: false,
    },
    registeredAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    strict: false, // Allow fields not in schema to pass through (safety net)
  }
);

// Delete cached model to ensure schema changes are always picked up
if (mongoose.models.Citizen) {
  delete mongoose.models.Citizen;
}

export default mongoose.model('Citizen', CitizenSchema);
