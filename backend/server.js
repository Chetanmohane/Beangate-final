import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import Registration from './models/Registration.js';
import Payment from './models/Payment.js';
import RefCode from './models/RefCode.js';
import PlanConfig from './models/PlanConfig.js';
import SubAdmin from './models/SubAdmin.js';
import MasterclassReg from './models/MasterclassReg.js';
import Subscriber from './models/Subscriber.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env only in local development (Vercel sets env vars itself)
if (!process.env.VERCEL) {
  try {
    const require = createRequire(import.meta.url);
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(__dirname, '.env') });
  } catch (e) {}
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let dbInitialized = false;

const initializeDBData = async () => {
  if (dbInitialized) return;
  try {
    // Create default plan config if not exists
    const configCount = await PlanConfig.countDocuments();
    if (configCount === 0) {
      console.log('Creating default plan configuration...');
      await PlanConfig.create({
        courseName: "MERN Stack",
        courseTagline: "Full Stack Web Development",
        oneTimePrice: 6000,
        oneTimeOriginalPrice: 15000,
        installment1Price: 3200,
        installment2Price: 3200,
        discountPercent: 10,
        oneTimeDiscountPercent: 10,
        installment1DiscountPercent: 10,
        installment2DiscountPercent: 10,
        oneTimeFeatures: [
          "Full MERN Stack Course Access",
          "Practical Hands-on Training",
          "100% Placement Assistance",
          "Course Completion Certificate",
          "Save 10% Extra using Referral Codes",
        ],
        installmentFeatures: [
          "Full MERN Stack Course Access",
          "Practical Hands-on Training",
          "100% Placement Assistance",
          "Course Completion Certificate",
        ],
        courses: ["Frontend Developer", "Backend Developer", "MERN Stack"],
        colleges: ["PDPS College", "BUIT", "Other"],
        cities: ["Bhopal", "Indore", "Jabalpur", "Other"],
        totalSeats: 50,
        manualSeatsOffset: 32,
        whatsappNumber: "919876543210",
        whatsappMessage: "Hello BeanGate IT Solutions, I am interested in the MERN Stack Course!",
        whatsappEnabled: true,
        whatsappLabel: "Need Help? Chat with us",
        whatsappPosition: "bottom-right"
      });
    } else {
      const existing = await PlanConfig.findOne();
      if (existing) {
        let updated = false;
        if (!existing.courses || existing.courses.length === 0) { existing.courses = ["Frontend Developer", "Backend Developer", "MERN Stack"]; updated = true; }
        if (!existing.colleges || existing.colleges.length === 0) { existing.colleges = ["PDPS College", "BUIT", "Other"]; updated = true; }
        if (!existing.cities || existing.cities.length === 0) { existing.cities = ["Bhopal", "Indore", "Jabalpur", "Other"]; updated = true; }
        if (existing.totalSeats === undefined) { existing.totalSeats = 50; updated = true; }
        if (existing.manualSeatsOffset === undefined) { existing.manualSeatsOffset = 32; updated = true; }
        if (!existing.seatsOffsetUpdatedAt) { existing.seatsOffsetUpdatedAt = new Date(); updated = true; }
        if (existing.manualSeatsOffsetRegistrationsCount === undefined) { existing.manualSeatsOffsetRegistrationsCount = await Registration.countDocuments(); updated = true; }
        if (existing.oneTimeDiscountPercent === undefined) { existing.oneTimeDiscountPercent = existing.discountPercent ?? 10; updated = true; }
        if (existing.installment1DiscountPercent === undefined) { existing.installment1DiscountPercent = existing.discountPercent ?? 10; updated = true; }
        if (existing.installment2DiscountPercent === undefined) { existing.installment2DiscountPercent = existing.discountPercent ?? 10; updated = true; }
        if (!existing.batchStartDate) { existing.batchStartDate = "22 September 2026"; updated = true; }
        if (existing.offerTimerHours === undefined) { existing.offerTimerHours = 4; updated = true; }
        if (!existing.offerTimerMode) { existing.offerTimerMode = "daily"; updated = true; }
        if (!existing.whatsappNumber) { existing.whatsappNumber = "919876543210"; updated = true; }
        if (!existing.whatsappMessage) { existing.whatsappMessage = "Hello BeanGate IT Solutions, I am interested in the MERN Stack Course!"; updated = true; }
        if (existing.whatsappEnabled === undefined) { existing.whatsappEnabled = true; updated = true; }
        if (!existing.whatsappLabel) { existing.whatsappLabel = "Need Help? Chat with us"; updated = true; }
        if (!existing.whatsappPosition) { existing.whatsappPosition = "bottom-right"; updated = true; }
        if (!existing.whatsappType) { existing.whatsappType = "number"; updated = true; }
        if (existing.whatsappGroupLink === undefined) { existing.whatsappGroupLink = ""; updated = true; }
        if (!existing.contactPhone) { existing.contactPhone = "+91 74711 12020, +91 97527 40090"; updated = true; }
        if (!existing.contactEmail) { existing.contactEmail = "info@beangates.com"; updated = true; }
        if (!existing.contactAddress) { existing.contactAddress = "Flat No. A-4 / 501, Kokta Transport Nagar,\nBhopal, Madhya Pradesh – 462022"; updated = true; }
        if (existing.facebookUrl === undefined) { existing.facebookUrl = ""; updated = true; }
        if (existing.instagramUrl === undefined) { existing.instagramUrl = ""; updated = true; }
        if (existing.youtubeUrl === undefined) { existing.youtubeUrl = ""; updated = true; }
        if (existing.linkedinUrl === undefined) { existing.linkedinUrl = ""; updated = true; }
        if (updated) { await existing.save(); console.log('Successfully migrated and seeded missing fields on existing DB config.'); }
      }
    }

    // Create default ref codes if not exists
    const refCodeCount = await RefCode.countDocuments();
    if (refCodeCount === 0) {
      console.log('Creating default referral codes...');
      await RefCode.create([
        { code: "BEANGATE10", discount: "10%", discountPercent: 10, applicablePlan: "all", active: true, created: "2024-07-01", uses: 0, creator: "admin" },
        { code: "MERN10", discount: "10%", discountPercent: 10, applicablePlan: "all", active: true, created: "2024-07-01", uses: 0, creator: "admin" },
        { code: "REF10", discount: "10%", discountPercent: 10, applicablePlan: "all", active: true, created: "2024-07-01", uses: 0, creator: "admin" }
      ]);
    } else {
      await RefCode.updateMany({ applicablePlan: { $exists: false } }, { $set: { applicablePlan: "all", discountPercent: 10 } });
    }

    // Clean up legacy dummy seed data
    await Registration.deleteMany({ email: { $in: ["rahul.sharma@gmail.com", "priya.verma@gmail.com", "aman.gupta@gmail.com"] } });
    await Payment.deleteMany({ email: { $in: ["rahul.sharma@gmail.com", "priya.verma@gmail.com", "aman.gupta@gmail.com"] } });
    dbInitialized = true;
  } catch (err) {
    console.error('Error initializing database data:', err.message);
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    if (!dbInitialized) await initializeDBData();
    return;
  }
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://bhumigarg2727_db_user:DwEKJWovWB214zsH@cluster0.vh71iko.mongodb.net/?appName=Cluster0', {
    serverSelectionTimeoutMS: 5000
  });
  await initializeDBData();
};

// Database Connection Middleware
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api') return next();
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in request:', error.message);
    res.status(500).json({ message: 'Database connection failed: ' + error.message });
  }
});

// --- API Endpoints ---

// 1. Registrations
app.get('/api/registrations', async (req, res) => {
  try { const data = await Registration.find().sort({ timestamp: -1 }); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/registrations', async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (phone) {
      const cleanPhone = String(phone).replace(/[^0-9]/g, "").slice(-10);
      if (cleanPhone.length === 10) {
        const existingPhone = await Registration.findOne({ phone: { $regex: cleanPhone + "$" } });
        if (existingPhone) return res.status(400).json({ message: "This mobile number is already registered!" });
      }
    }
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail) {
        const existingEmail = await Registration.findOne({ email: { $regex: "^" + cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", $options: "i" } });
        if (existingEmail) return res.status(400).json({ message: "This email address is already registered!" });
      }
    }
    const newReg = new Registration(req.body);
    const saved = await newReg.save();
    res.status(201).json(saved);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) await Registration.findByIdAndDelete(id);
    else await Registration.deleteMany({ $or: [{ email: id }, { phone: id }] });
    res.json({ message: 'Registration deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.put('/api/registrations/:id', async (req, res) => {
  try { const updated = await Registration.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

// 2. Payments
app.get('/api/payments', async (req, res) => {
  try { const data = await Payment.find().sort({ timestamp: -1 }); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/payments', async (req, res) => {
  try { const saved = await new Payment(req.body).save(); res.status(201).json(saved); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) await Payment.findByIdAndDelete(id);
    else await Payment.deleteMany({ $or: [{ transactionId: id }, { email: id }] });
    res.json({ message: 'Payment deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// 3. Referral Codes
app.get('/api/refcodes', async (req, res) => {
  try { const data = await RefCode.find(); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/refcodes', async (req, res) => {
  try { const saved = await new RefCode(req.body).save(); res.status(201).json(saved); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

app.put('/api/refcodes/:id', async (req, res) => {
  try { const updated = await RefCode.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/refcodes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) await RefCode.findByIdAndDelete(id);
    else await RefCode.deleteMany({ code: id });
    res.json({ message: 'RefCode deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// 4. Plan Config
const saveOrUpdatePlanConfig = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    let targetId = req.params.id;
    let existing = null;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) existing = await PlanConfig.findById(targetId);
    if (!existing) existing = await PlanConfig.findOne();
    if (existing) {
      const bodyOffset = updateData.manualSeatsOffset !== undefined ? Number(updateData.manualSeatsOffset) : undefined;
      const bodyCapacity = updateData.totalSeats !== undefined ? Number(updateData.totalSeats) : undefined;
      const offsetChanged = bodyOffset !== undefined && bodyOffset !== existing.manualSeatsOffset;
      const capacityChanged = bodyCapacity !== undefined && bodyCapacity !== existing.totalSeats;
      if (offsetChanged || capacityChanged || existing.manualSeatsOffsetRegistrationsCount === undefined) {
        updateData.seatsOffsetUpdatedAt = new Date();
        updateData.manualSeatsOffsetRegistrationsCount = await Registration.countDocuments();
      }
      const updated = await PlanConfig.findByIdAndUpdate(existing._id, updateData, { new: true, runValidators: true });
      return res.json(updated);
    }
    const saved = await PlanConfig.create(updateData);
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error saving plan config:", error);
    return res.status(400).json({ message: error.message });
  }
};

app.get('/api/planconfig', async (req, res) => {
  try { const data = await PlanConfig.findOne(); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/planconfig', saveOrUpdatePlanConfig);
app.post('/api/planconfig/:id', saveOrUpdatePlanConfig);
app.put('/api/planconfig', saveOrUpdatePlanConfig);
app.put('/api/planconfig/:id', saveOrUpdatePlanConfig);

// 5. Sub-Admins
app.get('/api/subadmins', async (req, res) => {
  try { const data = await SubAdmin.find(); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/subadmins', async (req, res) => {
  try { const saved = await new SubAdmin(req.body).save(); res.status(201).json(saved); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

app.put('/api/subadmins/:id', async (req, res) => {
  try { const updated = await SubAdmin.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/subadmins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) await SubAdmin.findByIdAndDelete(id);
    else await SubAdmin.deleteMany({ username: id });
    res.json({ message: 'SubAdmin deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// 6. Masterclass Registrations
app.get('/api/masterclass-registrations', async (req, res) => {
  try { const data = await MasterclassReg.find().sort({ _id: -1 }); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/masterclass-registrations', async (req, res) => {
  try { const saved = await new MasterclassReg(req.body).save(); res.status(201).json(saved); }
  catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/masterclass-registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) await MasterclassReg.findByIdAndDelete(id);
    else await MasterclassReg.deleteMany({ $or: [{ email: id }, { phone: id }] });
    res.json({ message: 'Masterclass Registration deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// 7. Newsletter Subscribers
app.get('/api/subscribers', async (req, res) => {
  try { const data = await Subscriber.find().sort({ timestamp: -1 }); res.json(data); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required!" });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await Subscriber.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(200).json({ message: "You are already subscribed!", subscriber: existing, alreadySubscribed: true });
    }
    const newSubscriber = new Subscriber({ email: cleanEmail });
    const saved = await newSubscriber.save();
    res.status(201).json({ message: "Subscribed successfully!", subscriber: saved });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/subscribers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) await Subscriber.findByIdAndDelete(id);
    else await Subscriber.deleteMany({ email: id.toLowerCase().trim() });
    res.json({ message: 'Subscriber deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Serve frontend static build files (SPA)
const isMainModule = Boolean(process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server')));

if (isMainModule && !process.env.VERCEL) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  app.get('/(.*)', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) res.send('API is running...');
    });
  });
}

// Start Server (local standalone execution only)
if (isMainModule && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
