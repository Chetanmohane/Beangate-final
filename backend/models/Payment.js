import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  transactionId: { type: String, required: true },
  course: { type: String, required: true },
  planTitle: { type: String, required: true },
  planAmount: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  referralCode: { type: String }
});

export default mongoose.model('Payment', paymentSchema);
