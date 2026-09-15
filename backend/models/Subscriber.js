import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Subscriber', subscriberSchema);
