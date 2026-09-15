import mongoose from 'mongoose';

const masterclassRegSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  college: { type: String, default: "N/A" },
  city: { type: String, default: "N/A" },
  experience: { type: String, default: "Student" },
  timestamp: { type: String }
});

export default mongoose.model('MasterclassReg', masterclassRegSchema);
