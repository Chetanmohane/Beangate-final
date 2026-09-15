import mongoose from 'mongoose';

const subAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  referralCode: { type: String, required: true, unique: true },
  status: { type: String, default: 'Active' },
  createdDate: { type: String, required: true }
});

export default mongoose.model('SubAdmin', subAdminSchema);
