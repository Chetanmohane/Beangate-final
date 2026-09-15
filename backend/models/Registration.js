import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  course: { type: String, required: true },
  college: { type: String, required: true },
  city: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  referralCode: { type: String }
});

export default mongoose.model('Registration', registrationSchema);
