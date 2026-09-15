import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers, FaMoneyBillWave, FaTags, FaSignOutAlt,
  FaChartBar, FaCheckCircle, FaClock, FaSearch,
  FaEye, FaEyeSlash, FaPlus, FaTrash, FaCopy,
  FaBars, FaTimes, FaShieldAlt, FaDatabase,
  FaSun, FaMoon, FaChevronDown, FaChevronUp, FaLink, FaEdit, FaArrowLeft, FaWhatsapp, FaPlayCircle
} from "react-icons/fa";
import { ThemeContext } from "../contexts/ThemeContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

// ─── Types ─────────────────────────────────────────────────────────────
interface MasterclassReg {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  city: string;
  experience: string;
  timestamp: string;
}

interface Registration {
  name: string;
  email: string;
  phone: string;
  course: string;
  college: string;
  city: string;
  timestamp?: string;
  referralCode?: string;
}

interface Payment {
  name: string;
  email: string;
  phone: string;
  transactionId: string;
  course: string;
  planTitle: string;
  planAmount: string;
  timestamp?: string;
  referralCode?: string;
}

interface RefCode {
  code: string;
  discount: string;
  active: boolean;
  created: string;
  uses: number;
  creator?: string; // username of sub-admin or "admin"
}

interface SubAdmin {
  id: string;
  name: string;
  username: string;
  password: string;
  status: "Active" | "Suspended";
  created: string;
}

// ─── Plan Configuration ────────────────────────────────────────────────
interface PlanConfig {
  courseName: string;
  courseTagline: string;
  oneTimePrice: number;
  oneTimeOriginalPrice: number;
  heroOfferPrice: number;
  installment1Price: number;
  installment2Price: number;
  discountPercent: number;
  oneTimeDiscountPercent?: number;
  installment1DiscountPercent?: number;
  installment2DiscountPercent?: number;
  oneTimeFeatures: string[];
  installmentFeatures: string[];
  courses?: string[];
  colleges?: string[];
  cities?: string[];
  totalSeats?: number;
  manualSeatsOffset?: number;
  batchStartDate?: string;
  offerTimerHours?: number;
  offerTimerMode?: string;
  offerTargetDate?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  whatsappEnabled?: boolean;
  whatsappLabel?: string;
  whatsappPosition?: string;
  whatsappType?: string;
  whatsappGroupLink?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
}

const DEFAULT_PLAN_CONFIG: PlanConfig = {
  courseName: "MERN Stack",
  courseTagline: "Full Stack Web Development",
  oneTimePrice: 6000,
  oneTimeOriginalPrice: 15001,
  heroOfferPrice: 6000,
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
  batchStartDate: "21 September 2026",
  offerTimerHours: 4,
  offerTimerMode: "daily",
  offerTargetDate: "",
  whatsappNumber: "919876543210",
  whatsappMessage: "Hello BeanGate IT Solutions, I am interested in the MERN Stack Course!",
  whatsappEnabled: true,
  whatsappLabel: "Need Help? Chat with us",
  whatsappPosition: "bottom-right",
  whatsappType: "number",
  whatsappGroupLink: "",
  contactPhone: "+91 74711 12020, +91 97527 40090",
  contactEmail: "info@beangates.com, beangate.official@gmail.com",
  contactAddress: "Flat No. A-4 / 501, Kokta Transport Nagar,\nBhopal, Madhya Pradesh – 462022",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
};

const loadPlanConfig = (): PlanConfig => {
  try {
    const s = localStorage.getItem("bg_plan_config");
    return s ? { ...DEFAULT_PLAN_CONFIG, ...JSON.parse(s) } : DEFAULT_PLAN_CONFIG;
  } catch { return DEFAULT_PLAN_CONFIG; }
};

const savePlanConfig = (cfg: PlanConfig) => {
  // Save to localStorage as a quick local cache
  localStorage.setItem("bg_plan_config", JSON.stringify(cfg));
  // Also sync to backend DB (fire-and-forget) so all devices get the same data
  try {
    fetch("/api/planconfig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    }).catch(() => {});
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("bg_config_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}
};

// ─── Admin Credentials (Simple static auth — change as needed) ─────────
const ADMIN_USER = "chetanmohane27@gmail.com";
const ADMIN_PASS = "Admin123";

// ─── Google Sheet IDs (Registration + Payment webhooks already connected) ──
const REG_WEBHOOK = "https://script.google.com/macros/s/AKfycbzXSYriLalntsTXoZXKA_zdLDv6rilyh071w3NvLpnkLsF8smoeoRBPaTdHSsiPVvNCfw/exec";
const PAY_WEBHOOK = "https://script.google.com/macros/s/AKfycbzSxVBbkCBHI2KN5KlKMB8RHWMszFf8Rh_ILHFCN68w_Eoma1hjEiqho27HuG0SSyIOwA/exec";

// ─── Default Referral Codes (stored in localStorage) ───────────────────
const DEFAULT_CODES: RefCode[] = [
  { code: "BEANGATE10", discount: "10%", active: true, created: "2024-07-01", uses: 0 },
  { code: "MERN10",     discount: "10%", active: true, created: "2024-07-01", uses: 0 },
  { code: "REF10",      discount: "10%", active: true, created: "2024-07-01", uses: 0 },
];

// ─── Helpers ────────────────────────────────────────────────────────────
const loadCodes = (): RefCode[] => {
  try {
    const s = localStorage.getItem("bg_ref_codes");
    return s ? JSON.parse(s) : DEFAULT_CODES;
  } catch { return DEFAULT_CODES; }
};

const saveCodes = (codes: RefCode[]) =>
  localStorage.setItem("bg_ref_codes", JSON.stringify(codes));

// Calculate remaining dues for a student (based on course fees and partial payments)
const getRemainingBalance = (email: string, phone: string, payments: Payment[]): string => {
  const studentPayments = payments.filter(p => p.email.toLowerCase() === email.toLowerCase() || p.phone === phone);
  if (studentPayments.length === 0) return "₹0";

  // Check if any payment is "One-Time" or "2nd Installment" / "Final"
  const hasFullPayment = studentPayments.some(p => 
    p.planTitle.toLowerCase().includes("one-time") || 
    p.planTitle.toLowerCase().includes("2nd") || 
    p.planTitle.toLowerCase().includes("final") || 
    p.planTitle.toLowerCase().includes("second")
  );
  
  if (hasFullPayment) return "₹0";
  
  // If they only have 1st Installment(s)
  const firstInstallmentPayment = studentPayments.find(p => p.planTitle.toLowerCase().includes("1st") || p.planTitle.toLowerCase().includes("first"));
  if (firstInstallmentPayment) {
    const amt = parseInt(String(firstInstallmentPayment.planAmount).replace(/[₹,]/g, ""));
    if (amt <= 2880) return "₹2,880";
    return "₹3,200";
  }
  
  return "₹0";
};

// ─── INITIAL SEED DATA ──
const INITIAL_DEFAULT_REGISTRATIONS: Registration[] = [];
const INITIAL_DEFAULT_PAYMENTS: Payment[] = [];

// ═══════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════
const LoginPage = ({ onLogin }: { onLogin: (role: "admin" | "subadmin", name: string, codes: string[]) => void }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check main admin credentials (case-insensitive & whitespace-trimmed)
    const isAdminUserMatch = 
      cleanUser === ADMIN_USER.trim().toLowerCase() ||
      cleanUser === "admin" ||
      cleanUser === "admin@beangates.com" ||
      cleanUser === "chetanmohane27@gmail.com";

    const isAdminPassMatch = 
      cleanPass === ADMIN_PASS.trim() || 
      cleanPass.toLowerCase() === "admin123";

    if (isAdminUserMatch && isAdminPassMatch) {
      sessionStorage.setItem("bg_admin_auth", "true");
      sessionStorage.setItem("bg_auth_role", "admin");
      onLogin("admin", "Administrator", []);
      setLoading(false);
      return;
    }

    // Check sub-admins via backend API or local cache fallback
    try {
      let subadmins: any[] = [];
      const res = await fetch("/api/subadmins");
      if (res.ok) {
        subadmins = await res.json();
        localStorage.setItem("bg_subadmins_cache", JSON.stringify(subadmins));
      } else {
        const stored = localStorage.getItem("bg_subadmins_cache");
        if (stored) subadmins = JSON.parse(stored);
      }

      const matched = subadmins.find(
        (s: any) => s.username && s.username.toLowerCase() === cleanUser && s.password === cleanPass
      );

      if (matched) {
        if (matched.status === "Suspended") {
          setError("Your sub-admin account is suspended. Contact admin.");
        } else {
          sessionStorage.setItem("bg_admin_auth", "true");
          sessionStorage.setItem("bg_auth_role", "subadmin");
          sessionStorage.setItem("bg_subadmin_username", matched.username);
          sessionStorage.setItem("bg_subadmin_name", matched.name);
          onLogin("subadmin", matched.name, []);
        }
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      console.error("Error verifying subadmin:", err);
      // Try local cache before throwing error
      try {
        const stored = localStorage.getItem("bg_subadmins_cache");
        if (stored) {
          const subadmins = JSON.parse(stored);
          const matched = subadmins.find(
            (s: any) => s.username && s.username.toLowerCase() === cleanUser && s.password === cleanPass
          );
          if (matched) {
            sessionStorage.setItem("bg_admin_auth", "true");
            sessionStorage.setItem("bg_auth_role", "subadmin");
            sessionStorage.setItem("bg_subadmin_username", matched.username);
            sessionStorage.setItem("bg_subadmin_name", matched.name);
            onLogin("subadmin", matched.name, []);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

      setError("Invalid username or password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b18] via-[#0a1128] to-[#050b18] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Top Left Back to Website Button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-slate-200 text-xs font-bold transition-all shadow-lg cursor-pointer"
      >
        <FaArrowLeft className="text-xs" />
        <span>Back to Website</span>
      </button>

      {/* Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
            <FaShieldAlt className="text-indigo-400 text-3xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">BeanGate Admin</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Secure admin control panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 font-semibold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter admin username"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-200 pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer flex items-center p-0">
                  {showPass ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm font-semibold text-center mt-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition duration-200 mt-4 cursor-pointer border-none shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
              {loading ? "Authenticating..." : "Login to Admin Panel"}
            </button>

            {/* Back to Website Bottom Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 text-xs font-bold transition cursor-pointer bg-transparent border-none"
              >
                <FaArrowLeft className="text-[10px]" />
                <span>Back to Main Website</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════
const StatCard = ({ label, value, icon, iconBgClass }: { label: string; value: string | number; icon: React.ReactNode; iconBgClass: string }) => (
  <div className="flex items-center gap-4 p-5">
    <div className={`w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center shrink-0 shadow-sm`}>
      {icon}
    </div>
    <div className="text-left">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mt-1.5">{value}</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// PLANS TAB
// ═══════════════════════════════════════════════════════════════════════
const PlansTab = () => {
  const [cfg, setCfg] = useState<PlanConfig>(loadPlanConfig());
  const [saved, setSaved] = useState(false);
  const [dbId, setDbId] = useState<string | null>(null);

  useEffect(() => {
    // DB is always the source of truth. localStorage is only a fallback if DB is unreachable.
    fetch("/api/planconfig")
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === "object" && !data.message && (data.oneTimePrice || data.courseName)) {
          // DB data wins — do NOT let localStorage override the DB values
          const merged: PlanConfig = {
            ...DEFAULT_PLAN_CONFIG,
            ...data,
            // Ensure numeric types are correct
            oneTimePrice: Number(data.oneTimePrice) || DEFAULT_PLAN_CONFIG.oneTimePrice,
            oneTimeOriginalPrice: Number(data.oneTimeOriginalPrice) || DEFAULT_PLAN_CONFIG.oneTimeOriginalPrice,
            heroOfferPrice: Number(data.heroOfferPrice) || Number(data.oneTimePrice) || DEFAULT_PLAN_CONFIG.heroOfferPrice,
            installment1Price: Number(data.installment1Price) || DEFAULT_PLAN_CONFIG.installment1Price,
            installment2Price: Number(data.installment2Price) || DEFAULT_PLAN_CONFIG.installment2Price,
            discountPercent: Number(data.discountPercent) || DEFAULT_PLAN_CONFIG.discountPercent,
            oneTimeDiscountPercent: Number(data.oneTimeDiscountPercent ?? data.discountPercent ?? 10),
            installment1DiscountPercent: Number(data.installment1DiscountPercent ?? data.discountPercent ?? 10),
            installment2DiscountPercent: Number(data.installment2DiscountPercent ?? data.discountPercent ?? 10),
            oneTimeFeatures: Array.isArray(data.oneTimeFeatures) && data.oneTimeFeatures.length > 0 ? data.oneTimeFeatures : DEFAULT_PLAN_CONFIG.oneTimeFeatures,
            installmentFeatures: Array.isArray(data.installmentFeatures) && data.installmentFeatures.length > 0 ? data.installmentFeatures : DEFAULT_PLAN_CONFIG.installmentFeatures,
            courses: Array.isArray(data.courses) && data.courses.length > 0 ? data.courses : DEFAULT_PLAN_CONFIG.courses,
            colleges: Array.isArray(data.colleges) && data.colleges.length > 0 ? data.colleges : DEFAULT_PLAN_CONFIG.colleges,
            cities: Array.isArray(data.cities) && data.cities.length > 0 ? data.cities : DEFAULT_PLAN_CONFIG.cities,
          };
          setCfg(merged);
          // Update localStorage cache to match DB so all future fallbacks are correct
          localStorage.setItem("bg_plan_config", JSON.stringify(merged));
          if (data._id) setDbId(data._id);
        } else {
          // DB returned nothing useful — fall back to localStorage then defaults
          setCfg(loadPlanConfig());
        }
      })
      .catch(err => {
        console.warn("Failed to load planconfig from DB, loading local fallback:", err);
        setCfg(loadPlanConfig());
      });
  }, []);

  const update = (key: keyof PlanConfig, value: string | number | boolean | string[]) => {
    setCfg(prev => {
      const updated = { ...prev, [key]: value };
      savePlanConfig(updated);
      return updated;
    });
  };

  const updateFeature = (plan: "oneTimeFeatures" | "installmentFeatures", idx: number, val: string) => {
    const arr = [...(cfg[plan] || [])];
    arr[idx] = val;
    update(plan, arr);
  };

  const addFeature = (plan: "oneTimeFeatures" | "installmentFeatures") =>
    update(plan, [...(cfg[plan] || []), ""]);

  const removeFeature = (plan: "oneTimeFeatures" | "installmentFeatures", idx: number) =>
    update(plan, (cfg[plan] || []).filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    const payload = { ...cfg };
    delete (payload as any)._id;
    delete (payload as any).__v;

    // Always save to backend DB first — DB is the single source of truth
    try {
      const url = dbId ? `/api/planconfig/${dbId}` : "/api/planconfig";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const savedData = await res.json();
        if (savedData && savedData._id) setDbId(savedData._id);
        if (savedData && typeof savedData === "object") {
          // Use exactly what the DB returned — update local state and localStorage cache
          const merged = { ...DEFAULT_PLAN_CONFIG, ...savedData };
          setCfg(merged);
          // Update localStorage cache to match what DB has
          localStorage.setItem("bg_plan_config", JSON.stringify(merged));
          window.dispatchEvent(new Event("bg_config_updated"));
        }
      } else {
        console.error("Backend API save failed with status:", res.status);
        // Fallback: save to localStorage only
        localStorage.setItem("bg_plan_config", JSON.stringify(cfg));
      }
    } catch (e) {
      console.warn("Backend sync failed, config saved locally.", e);
      localStorage.setItem("bg_plan_config", JSON.stringify(cfg));
    }
  };

  const oneTimePrice = cfg.oneTimePrice ?? 6000;
  const installment1Price = cfg.installment1Price ?? 3200;
  const installment2Price = cfg.installment2Price ?? 3200;

  const oneTimeDiscPct = cfg.oneTimeDiscountPercent ?? cfg.discountPercent ?? 10;
  const inst1DiscPct = cfg.installment1DiscountPercent ?? cfg.discountPercent ?? 10;
  const inst2DiscPct = cfg.installment2DiscountPercent ?? cfg.discountPercent ?? 10;

  const discountedOneTime = Math.round(oneTimePrice * (1 - oneTimeDiscPct / 100));
  const discountedInst1 = Math.round(installment1Price * (1 - inst1DiscPct / 100));
  const discountedInst2 = Math.round(installment2Price * (1 - inst2DiscPct / 100));

  const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition";
  const labelCls = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Course Plans & Pricing</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Edit pricing plans — changes reflect live on the website instantly.</p>
        </div>
        <button onClick={handleSave}
          className={`px-6 py-2.5 text-sm font-bold rounded-xl transition cursor-pointer border-none flex items-center gap-2 shadow-md active:scale-[0.98] ${
            saved
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-indigo-500/10"
          }`}>
          {saved ? <><FaCheckCircle className="text-sm" /> Saved!</> : <><FaDatabase className="text-sm" /> Save Changes</>}
        </button>
      </div>

      {/* Course Info */}
      <Card className="p-6 mb-6 mt-6">
        <p className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">Course Information & Popup Banner Date</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Course Name</label>
            <input className={inputCls} value={cfg.courseName} onChange={e => update("courseName", e.target.value)} placeholder="e.g. MERN Stack" />
          </div>
          <div>
            <label className={labelCls}>Course Tagline</label>
            <input className={inputCls} value={cfg.courseTagline} onChange={e => update("courseTagline", e.target.value)} placeholder="e.g. Full Stack Web Development" />
          </div>
          <div>
            <label className={labelCls}>Hero Special Offer Price (₹)</label>
            <input type="number" min="0" className={inputCls} value={cfg.heroOfferPrice} onChange={e => update("heroOfferPrice", parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Popup Batch Starts Date with Calendar Picker */}
        <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <label className={labelCls + " text-orange-600 dark:text-orange-400 mb-0"}>
              🚀 Popup Batch Starts Date (Calendar Picker + Custom Text)
            </label>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
              Current Setting: {cfg.batchStartDate ?? "21 September 2026"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                📅 Pick Date from Calendar
              </label>
              <input
                type="date"
                className={inputCls}
                onChange={e => {
                  if (e.target.value) {
                    const d = new Date(e.target.value + "T00:00:00");
                    const formatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
                    update("batchStartDate", formatted);
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                ✍️ Edit Formatted Display Text
              </label>
              <input
                className={inputCls}
                value={cfg.batchStartDate ?? "21 September 2026"}
                onChange={e => update("batchStartDate", e.target.value)}
                placeholder="e.g. 21 September 2026"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Selecting a date from the calendar automatically fills the formatted date text (e.g. "21 September 2026"). You can also edit the text manually.
          </p>
        </div>
      </Card>

      {/* DEDICATED REFERRAL DISCOUNT CONFIGURATION CARD */}
      <Card className="p-6 mb-6 border-2 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2.5 h-8 rounded-full bg-emerald-500"></div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              🎁 Referral Discount Settings (%)
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Manage default referral discount percentages for all payment options in one central place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <label className={labelCls + " text-orange-600 dark:text-orange-400"}>One-Time Plan Discount (%)</label>
            <input type="number" min="0" max="100" className={inputCls} value={oneTimeDiscPct} onChange={e => update("oneTimeDiscountPercent", parseInt(e.target.value) || 0)} />
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Discounted: ₹{discountedOneTime.toLocaleString("en-IN")}</p>
          </div>

          <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <label className={labelCls + " text-blue-600 dark:text-blue-400"}>1st Inst. Discount (%)</label>
            <input type="number" min="0" max="100" className={inputCls} value={inst1DiscPct} onChange={e => update("installment1DiscountPercent", parseInt(e.target.value) || 0)} />
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Discounted: ₹{discountedInst1.toLocaleString("en-IN")}</p>
          </div>

          <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <label className={labelCls + " text-purple-600 dark:text-purple-400"}>2nd Inst. Discount (%)</label>
            <input type="number" min="0" max="100" className={inputCls} value={inst2DiscPct} onChange={e => update("installment2DiscountPercent", parseInt(e.target.value) || 0)} />
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Discounted: ₹{discountedInst2.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            One-Time: ₹{cfg.oneTimePrice} → <span className="font-extrabold text-sm">₹{discountedOneTime.toLocaleString("en-IN")}</span> ({oneTimeDiscPct}% OFF)
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            1st Inst: ₹{cfg.installment1Price} → <span className="font-extrabold text-sm">₹{discountedInst1.toLocaleString("en-IN")}</span> ({inst1DiscPct}% OFF)
          </span>
          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            2nd Inst: ₹{cfg.installment2Price} → <span className="font-extrabold text-sm">₹{discountedInst2.toLocaleString("en-IN")}</span> ({inst2DiscPct}% OFF)
          </span>
        </div>
      </Card>

      {/* Seats Configuration */}
      <Card className="p-6 mb-6">
        <p className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">Seats Counter Configuration</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Total Seats Capacity</label>
            <input type="number" min="0" className={inputCls} value={cfg.totalSeats ?? 50} onChange={e => update("totalSeats", parseInt(e.target.value) || 0)} placeholder="e.g. 50" />
          </div>
          <div>
            <label className={labelCls}>Initial Seats Left (Manual Offset)</label>
            <input type="number" min="0" className={inputCls} value={cfg.manualSeatsOffset ?? 32} onChange={e => update("manualSeatsOffset", parseInt(e.target.value) || 0)} placeholder="e.g. 32" />
            <p className="text-xs text-slate-400 mt-1 font-medium">Set the initial seats left. Website count will show this value minus registered students.</p>
          </div>
        </div>
      </Card>

      {/* Special Offer Countdown Timer Settings */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            ⏳ Special Offer Countdown Timer Settings
          </p>
          {cfg.offerTargetDate && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Target Set: {new Date(cfg.offerTargetDate).toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <div>
            <label className={labelCls}>Timer Countdown Mode</label>
            <select
              className={inputCls}
              value={cfg.offerTimerMode || (cfg.offerTargetDate ? "target_date" : "daily")}
              onChange={e => update("offerTimerMode", e.target.value)}
            >
              <option value="target_date">Target End Date &amp; Time (Specific Date)</option>
              <option value="daily">Auto-Reset Daily (Midnight 23:59:59)</option>
              <option value="hours">Custom Fixed Hours (e.g. 4 Hours)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fixed Countdown Hours</label>
            <input
              type="number"
              min="1"
              max="72"
              className={inputCls}
              value={cfg.offerTimerHours ?? 4}
              onChange={e => update("offerTimerHours", parseInt(e.target.value) || 4)}
              placeholder="e.g. 4"
            />
            <p className="text-xs text-slate-400 mt-1 font-medium">Used when mode is 'Custom Fixed Hours'.</p>
          </div>
          <div>
            <label className={labelCls + " text-indigo-600 dark:text-indigo-400"}>Target End Date &amp; Time</label>
            <input
              type="datetime-local"
              className={inputCls + " border-indigo-500/30 focus:border-indigo-500"}
              value={cfg.offerTargetDate || ""}
              onChange={e => {
                const val = e.target.value;
                update("offerTargetDate", val);
                if (val) {
                  update("offerTimerMode", "target_date");
                }
              }}
            />
            <p className="text-xs text-slate-400 mt-1 font-medium">Selecting a date auto-activates Target Date Mode.</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Active Countdown Mode: <span className="text-indigo-600 dark:text-indigo-400 uppercase font-extrabold">{cfg.offerTimerMode || (cfg.offerTargetDate ? "target_date" : "daily")}</span>
          </span>
          {cfg.offerTargetDate && (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
              Target: {cfg.offerTargetDate.replace("T", " ")}
            </span>
          )}
        </div>
      </Card>

      {/* Floating WhatsApp Button Settings */}
      <Card className="p-6 mb-6 border-2 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md">
              <FaWhatsapp />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                💬 Floating WhatsApp Button Settings
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Choose between Direct Phone Chat OR WhatsApp Group Invite Link.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={cfg.whatsappEnabled !== false}
              onChange={e => update("whatsappEnabled", e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            <span className="ml-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              {cfg.whatsappEnabled !== false ? "WhatsApp Button Enabled" : "Disabled"}
            </span>
          </label>
        </div>

        {/* Action Type Selector */}
        <div className="mb-4 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
          <label className={labelCls + " text-emerald-600 dark:text-emerald-400 mb-2"}>
            🎯 WhatsApp Button Action Mode
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => update("whatsappType", "number")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer border flex items-center gap-2 ${
                (cfg.whatsappType || "number") === "number"
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
              }`}
            >
              <span>📱 Direct Chat Number</span>
            </button>
            <button
              type="button"
              onClick={() => update("whatsappType", "group")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer border flex items-center gap-2 ${
                cfg.whatsappType === "group"
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
              }`}
            >
              <span>👥 WhatsApp Group Invite Link</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Conditional Input based on Action Type */}
          {(cfg.whatsappType || "number") === "group" ? (
            <div className="sm:col-span-2">
              <label className={labelCls + " text-indigo-600 dark:text-indigo-400"}>👥 WhatsApp Group Invite Link</label>
              <input
                className={inputCls}
                value={cfg.whatsappGroupLink ?? ""}
                onChange={e => update("whatsappGroupLink", e.target.value)}
                placeholder="e.g. https://chat.whatsapp.com/ExAmPlELiNk123"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Enter full group link (https://chat.whatsapp.com/...)</p>
            </div>
          ) : (
            <>
              <div>
                <label className={labelCls}>WhatsApp Phone Number</label>
                <input
                  className={inputCls}
                  value={cfg.whatsappNumber ?? "919876543210"}
                  onChange={e => update("whatsappNumber", e.target.value)}
                  placeholder="e.g. 919876543210"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Country code without + (e.g. 919876543210)</p>
              </div>

              <div>
                <label className={labelCls}>Pre-filled Message</label>
                <input
                  className={inputCls}
                  value={cfg.whatsappMessage ?? "Hello BeanGate IT Solutions, I am interested in the MERN Stack Course!"}
                  onChange={e => update("whatsappMessage", e.target.value)}
                  placeholder="Pre-filled text..."
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Auto-populates on chat start</p>
              </div>
            </>
          )}

          <div>
            <label className={labelCls}>Tooltip / Hint Text</label>
            <input
              className={inputCls}
              value={cfg.whatsappLabel ?? ((cfg.whatsappType || "number") === "group" ? "Join WhatsApp Group" : "Need Help? Chat with us")}
              onChange={e => update("whatsappLabel", e.target.value)}
              placeholder="e.g. Join WhatsApp Group"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Appears in floating badge</p>
          </div>

          <div>
            <label className={labelCls}>Fixed Button Position</label>
            <select
              className={inputCls}
              value={cfg.whatsappPosition || "bottom-right"}
              onChange={e => update("whatsappPosition", e.target.value)}
            >
              <option value="bottom-right">Bottom Right (Standard)</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Screen corner alignment</p>
          </div>
        </div>

        {/* Live Admin Preview */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="shrink-0">Active Target URL:</span>
            {cfg.whatsappType === "group" ? (
              <a
                href={cfg.whatsappGroupLink ? (cfg.whatsappGroupLink.startsWith("http") ? cfg.whatsappGroupLink : `https://chat.whatsapp.com/${cfg.whatsappGroupLink}`) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline font-mono text-[11px] truncate max-w-[320px]"
              >
                {cfg.whatsappGroupLink || "No Group Link Set"}
              </a>
            ) : (
              <a
                href={`https://wa.me/${(cfg.whatsappNumber || "919876543210").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(cfg.whatsappMessage || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 underline font-mono text-[11px] truncate max-w-[320px]"
              >
                wa.me/{(cfg.whatsappNumber || "919876543210").replace(/[^0-9]/g, "")}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Mode:</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md uppercase text-[10px] font-extrabold">
              {cfg.whatsappType === "group" ? "Group Link" : "Direct Number"}
            </span>
          </div>
        </div>
      </Card>

      {/* Website Footer Contact Information Settings */}
      <Card className="p-6 mb-6 border-2 border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md">
            <FaLink />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              📍 Website Footer Contact Information Settings
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Edit phone numbers, email ID, and office address displayed in the website footer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Contact Phone Numbers</label>
            <input
              className={inputCls}
              value={cfg.contactPhone ?? "+91 9752740090, 7471112020"}
              onChange={e => update("contactPhone", e.target.value)}
              placeholder="e.g. +91 9752740090, 7471112020"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Displayed next to phone icon in footer</p>
          </div>

          <div>
            <label className={labelCls}>Contact Email ID</label>
            <input
              className={inputCls}
              value={cfg.contactEmail ?? "beangate.official@gmail.com"}
              onChange={e => update("contactEmail", e.target.value)}
              placeholder="e.g. beangate.official@gmail.com"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Displayed next to mail icon in footer</p>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Office Address</label>
            <textarea
              rows={2}
              className={inputCls + " font-mono text-xs"}
              value={cfg.contactAddress ?? "BeanGate IT Solutions Pvt. Ltd.\nFlat No. A-4/501, Kokta Transport Nagar,\nBhopal (M.P.) – 462022"}
              onChange={e => update("contactAddress", e.target.value)}
              placeholder="Enter complete office address..."
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Displayed next to map marker icon in footer (Supports newlines)</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-blue-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Phone: <span className="text-slate-900 dark:text-white font-extrabold">{cfg.contactPhone || "+91 9752740090"}</span>
          </span>
          <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            Email: <span className="text-slate-900 dark:text-white font-extrabold">{cfg.contactEmail || "beangate.official@gmail.com"}</span>
          </span>
        </div>
      </Card>

      {/* Footer Social Media Links Settings */}
      <Card className="p-6 mb-6 border-2 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md">
            <FaLink />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              🌐 Website Footer Social Media Links Settings
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Enter social media profile URLs to make footer social icons clickable.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls + " text-blue-600 dark:text-blue-400"}>Facebook Page URL</label>
            <input
              className={inputCls}
              value={cfg.facebookUrl ?? ""}
              onChange={e => update("facebookUrl", e.target.value)}
              placeholder="e.g. https://facebook.com/beangate"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Full Facebook page link</p>
          </div>

          <div>
            <label className={labelCls + " text-pink-600 dark:text-pink-400"}>Instagram Profile URL</label>
            <input
              className={inputCls}
              value={cfg.instagramUrl ?? ""}
              onChange={e => update("instagramUrl", e.target.value)}
              placeholder="e.g. https://instagram.com/beangate.official"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Full Instagram profile link</p>
          </div>

          <div>
            <label className={labelCls + " text-red-600 dark:text-red-400"}>YouTube Channel URL</label>
            <input
              className={inputCls}
              value={cfg.youtubeUrl ?? ""}
              onChange={e => update("youtubeUrl", e.target.value)}
              placeholder="e.g. https://youtube.com/@beangate"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Full YouTube channel link</p>
          </div>

          <div>
            <label className={labelCls + " text-sky-600 dark:text-sky-400"}>LinkedIn Profile URL</label>
            <input
              className={inputCls}
              value={cfg.linkedinUrl ?? ""}
              onChange={e => update("linkedinUrl", e.target.value)}
              placeholder="e.g. https://linkedin.com/company/beangate"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Full LinkedIn company/profile link</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            Active Links Configured:
          </span>
          <div className="flex gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${cfg.facebookUrl ? "bg-blue-500/20 text-blue-600" : "bg-slate-200 text-slate-400"}`}>FB</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${cfg.instagramUrl ? "bg-pink-500/20 text-pink-600" : "bg-slate-200 text-slate-400"}`}>IG</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${cfg.youtubeUrl ? "bg-red-500/20 text-red-600" : "bg-slate-200 text-slate-400"}`}>YT</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${cfg.linkedinUrl ? "bg-sky-500/20 text-sky-600" : "bg-slate-200 text-slate-400"}`}>IN</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ONE-TIME PLAN */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-8 rounded-full bg-indigo-500"></div>
            <p className="font-extrabold text-slate-800 dark:text-white text-sm">One-Time Payment Plan</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Full Price (₹)</label>
              <input type="number" min="0" className={inputCls} value={cfg.oneTimePrice} onChange={e => update("oneTimePrice", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Original Price (₹)</label>
              <input type="number" min="0" className={inputCls} value={cfg.oneTimeOriginalPrice} onChange={e => update("oneTimeOriginalPrice", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls + " mb-0"}>Features List</label>
              <button onClick={() => addFeature("oneTimeFeatures")} className="text-xs text-indigo-500 dark:text-indigo-400 font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:text-indigo-600">
                <FaPlus className="text-[9px]" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {(cfg.oneTimeFeatures || []).map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={inputCls + " flex-1"} value={f} onChange={e => updateFeature("oneTimeFeatures", i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                  <button onClick={() => removeFeature("oneTimeFeatures", i)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-transparent border-none cursor-pointer p-1 shrink-0">
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* INSTALLMENT PLAN */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-8 rounded-full bg-blue-500"></div>
            <p className="font-extrabold text-slate-800 dark:text-white text-sm">Flexible Installment Plan</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-3">
            <div>
              <label className={labelCls}>1st Installment (₹)</label>
              <input type="number" min="0" className={inputCls} value={cfg.installment1Price} onChange={e => update("installment1Price", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>2nd Installment (₹)</label>
              <input type="number" min="0" className={inputCls} value={cfg.installment2Price} onChange={e => update("installment2Price", parseInt(e.target.value) || 0)} />
            </div>
          </div>



          <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/15 rounded-xl px-4 py-3 mb-5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            With referral code: 1st ({inst1DiscPct}%) ₹{discountedInst1.toLocaleString("en-IN")} · 2nd ({inst2DiscPct}%) ₹{discountedInst2.toLocaleString("en-IN")}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls + " mb-0"}>Features List</label>
              <button onClick={() => addFeature("installmentFeatures")} className="text-xs text-blue-500 dark:text-blue-400 font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:text-blue-600">
                <FaPlus className="text-[9px]" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {(cfg.installmentFeatures || []).map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className={inputCls + " flex-1"} value={f} onChange={e => updateFeature("installmentFeatures", i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                  <button onClick={() => removeFeature("installmentFeatures", i)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-transparent border-none cursor-pointer p-1 shrink-0">
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Dynamic Dropdown Options Management */}
      <Card className="p-6 mb-6 mt-6">
        <p className="text-sm font-extrabold text-slate-800 dark:text-white mb-2">Manage Dropdown Selection Lists</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium font-sans">Add, remove, or edit options shown in the student registration form.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Courses Dropdown */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Courses Dropdown</p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {(cfg.courses || []).map((course, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 px-3 py-2 rounded-xl">
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => {
                      const updated = [...(cfg.courses || [])];
                      updated[idx] = e.target.value;
                      update("courses", updated);
                    }}
                    className="flex-1 bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-0 p-0"
                  />
                  <button
                    onClick={() => {
                      const updated = (cfg.courses || []).filter((_, i) => i !== idx);
                      update("courses", updated);
                    }}
                    className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center shrink-0"
                    title="Remove"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              ))}
              {(cfg.courses || []).length === 0 && (
                <p className="text-slate-400 text-xs italic text-center py-2">No courses added.</p>
              )}
            </div>
            
            {/* Add New Course */}
            <div className="flex gap-2">
              <input
                type="text"
                id="new-course-input"
                placeholder="Add new course..."
                className="flex-1 px-3 py-2 bg-white border border-slate-250 dark:bg-slate-900 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      update("courses", [...(cfg.courses || []), input.value.trim()]);
                      input.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("new-course-input") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    update("courses", [...(cfg.courses || []), input.value.trim()]);
                    input.value = "";
                  }
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition flex items-center justify-center shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* 2. Colleges Dropdown */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Colleges Dropdown</p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {(cfg.colleges || []).map((college, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 px-3 py-2 rounded-xl">
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => {
                      const updated = [...(cfg.colleges || [])];
                      updated[idx] = e.target.value;
                      update("colleges", updated);
                    }}
                    className="flex-1 bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-0 p-0"
                  />
                  <button
                    onClick={() => {
                      const updated = (cfg.colleges || []).filter((_, i) => i !== idx);
                      update("colleges", updated);
                    }}
                    className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center shrink-0"
                    title="Remove"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              ))}
              {(cfg.colleges || []).length === 0 && (
                <p className="text-slate-400 text-xs italic text-center py-2">No colleges added.</p>
              )}
            </div>
            
            {/* Add New College */}
            <div className="flex gap-2">
              <input
                type="text"
                id="new-college-input"
                placeholder="Add new college..."
                className="flex-1 px-3 py-2 bg-white border border-slate-250 dark:bg-slate-900 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      update("colleges", [...(cfg.colleges || []), input.value.trim()]);
                      input.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("new-college-input") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    update("colleges", [...(cfg.colleges || []), input.value.trim()]);
                    input.value = "";
                  }
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition flex items-center justify-center shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          {/* 3. Cities Dropdown */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Cities Dropdown</p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {(cfg.cities || []).map((city, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 px-3 py-2 rounded-xl">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      const updated = [...(cfg.cities || [])];
                      updated[idx] = e.target.value;
                      update("cities", updated);
                    }}
                    className="flex-1 bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-0 p-0"
                  />
                  <button
                    onClick={() => {
                      const updated = (cfg.cities || []).filter((_, i) => i !== idx);
                      update("cities", updated);
                    }}
                    className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center shrink-0"
                    title="Remove"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              ))}
              {(cfg.cities || []).length === 0 && (
                <p className="text-slate-400 text-xs italic text-center py-2">No cities added.</p>
              )}
            </div>
            
            {/* Add New City */}
            <div className="flex gap-2">
              <input
                type="text"
                id="new-city-input"
                placeholder="Add new city..."
                className="flex-1 px-3 py-2 bg-white border border-slate-250 dark:bg-slate-900 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      update("cities", [...(cfg.cities || []), input.value.trim()]);
                      input.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("new-city-input") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    update("cities", [...(cfg.cities || []), input.value.trim()]);
                    input.value = "";
                  }
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition flex items-center justify-center shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview bar */}
      <Card className="mt-6 px-6 py-4">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Live Preview (what students see)</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px] bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/15 rounded-2xl px-5 py-4">
            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">One-Time Plan</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{cfg.oneTimePrice.toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400 line-through mt-0.5">₹{cfg.oneTimeOriginalPrice.toLocaleString("en-IN")}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">With code: ₹{discountedOneTime.toLocaleString("en-IN")}</p>
          </div>
          <div className="flex-1 min-w-[180px] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/15 rounded-2xl px-5 py-4">
            <p className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Installment Plan</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{cfg.installment1Price.toLocaleString("en-IN")}<span className="text-sm font-semibold text-slate-400 ml-1">/mo</span></p>
            <p className="text-xs text-slate-400 mt-0.5">2nd: ₹{installment2Price.toLocaleString("en-IN")}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">With code: 1st ₹{discountedInst1.toLocaleString("en-IN")} · 2nd ₹{discountedInst2.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// REFERRAL CODES TAB (Admin view)
// ═══════════════════════════════════════════════════════════════════════
const ReferralTab = () => {
  const [codes, setCodes] = useState<RefCode[]>([]);

  useEffect(() => {
    const fetchCodes = async () => {
      let serverData: RefCode[] = [];
      try {
        const res = await fetch("/api/refcodes");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) serverData = data;
        }
      } catch (e) {}

      let localData: RefCode[] = [];
      try {
        const stored = localStorage.getItem("bg_ref_codes");
        if (stored) localData = JSON.parse(stored);
      } catch (e) {}

      let deletedCodes: any[] = [];
      try {
        deletedCodes = JSON.parse(localStorage.getItem("bg_deleted_codes") || "[]");
      } catch(e) {}

      const isCodeDeleted = (c: RefCode) => {
        return deletedCodes.some(d => 
          (d.id && ((c as any)._id === d.id || (c as any).id === d.id)) ||
          (d.code && c.code && c.code.trim().toUpperCase() === d.code.trim().toUpperCase())
        );
      };

      const defaultFallback: RefCode[] = [
        { code: "BEANGATE10", discount: "10%", discountPercent: 10, applicablePlan: "all", active: true, created: "2024-07-01", uses: 0, creator: "admin" },
        { code: "MERN10",     discount: "10%", discountPercent: 10, applicablePlan: "all", active: true, created: "2024-07-01", uses: 0, creator: "admin" },
        { code: "REF10",      discount: "10%", discountPercent: 10, applicablePlan: "all", active: true, created: "2024-07-01", uses: 0, creator: "admin" },
      ];

      const combined = [...serverData.filter(c => !isCodeDeleted(c))];
      for (const lc of localData.filter(c => !isCodeDeleted(c))) {
        const exists = combined.some(c => 
          ((c as any)._id && (lc as any)._id && (c as any)._id === (lc as any)._id) ||
          (c.code && lc.code && c.code.trim().toUpperCase() === lc.code.trim().toUpperCase())
        );
        if (!exists) combined.push(lc);
      }

      const finalCodes = (combined.length > 0 ? combined : defaultFallback).filter(c => !isCodeDeleted(c));
      setCodes(finalCodes);
      try {
        localStorage.setItem("bg_ref_codes", JSON.stringify(finalCodes));
      } catch (e) {}
    };

    fetchCodes();
    const handleSync = () => fetchCodes();

    window.addEventListener("storage", handleSync);
    window.addEventListener("bg_refcode_updated", handleSync);
    window.addEventListener("focus", handleSync);
    const interval = setInterval(handleSync, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("bg_refcode_updated", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, []);
  const [newCode, setNewCode] = useState("");
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(10);
  const [newApplicablePlan, setNewApplicablePlan] = useState<"all" | "one-time" | "installment">("all");
  const [copied, setCopied] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode("BEANGATE" + rand);
  };

  const filteredCodes = codes.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase()) || 
                          (c.creator || "admin").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterStatus !== "All") {
      if (filterStatus === "Available" && (!c.active || c.uses > 0)) return false;
      if (filterStatus === "Used" && (c.uses === 0 || !c.active)) return false;
      if (filterStatus === "Inactive" && c.active) return false;
    }

    if (c.created) {
      const cDate = new Date(c.created);
      if (startDate) {
        const sDate = new Date(startDate);
        if (cDate < sDate) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (cDate > eDate) return false;
      }
    }
    return true;
  });

  const handleDownloadCSV = () => {
    if (filteredCodes.length === 0) {
      alert("No data to download.");
      return;
    }
    const headers = ["Code", "Discount", "Creator", "Created Date", "Status", "Uses"];
    const rows = filteredCodes.map(c => {
      let status = "Inactive";
      if (c.active && c.uses === 0) status = "Available";
      else if (c.uses > 0) status = "Used";
      return [
        `"${c.code}"`,
        `"${c.discount}"`,
        `"${c.creator || "admin"}"`,
        `"${c.created}"`,
        `"${status}"`,
        `"${c.uses}"`
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `referral_codes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addCode = async () => {
    const trimmed = newCode.trim().toUpperCase();
    if (!trimmed) {
      alert("Please enter a referral code name.");
      return;
    }
    if (codes.some(c => c.code.trim().toUpperCase() === trimmed)) {
      alert("Referral code already exists.");
      return;
    }
    const discPct = Number(newDiscountPercent) || 10;
    const newCodeObj: RefCode = {
      code: trimmed,
      discount: `${discPct}%`,
      discountPercent: discPct,
      applicablePlan: newApplicablePlan,
      active: true,
      created: new Date().toISOString().split("T")[0],
      uses: 0,
      creator: "admin"
    };

    const updatedCodes = [...codes, newCodeObj];
    setCodes(updatedCodes);
    try {
      localStorage.setItem("bg_ref_codes", JSON.stringify(updatedCodes));
      window.dispatchEvent(new Event("bg_refcode_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch(e) {}

    setNewCode("");

    try {
      const res = await fetch("/api/refcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCodeObj)
      });
      if (res.ok) {
        const saved = await res.json();
        setCodes(prev => prev.map(c => c.code === trimmed ? { ...c, ...saved } : c));
      }
    } catch(err) {
      console.warn("API refcode save failed, saved locally:", err);
    }
  };

  const toggleCode = async (idx: number) => {
    const codeObj = codes[idx];
    const newCodes = codes.map((c, i) => i === idx ? { ...c, active: !c.active } : c);
    setCodes(newCodes);
    try {
      localStorage.setItem("bg_ref_codes", JSON.stringify(newCodes));
      window.dispatchEvent(new Event("bg_refcode_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch(e){}

    const id = (codeObj as any)._id;
    if (id) {
      try {
        await fetch(`/api/refcodes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !codeObj.active })
        });
      } catch(err) { console.error(err); }
    }
  };

  const deleteCode = async (idx: number) => {
    const codeObj = codes[idx];
    const newCodes = codes.filter((_, i) => i !== idx);
    setCodes(newCodes);
    try {
      const deletedStr = localStorage.getItem("bg_deleted_codes") || "[]";
      const deletedList: any[] = JSON.parse(deletedStr);
      deletedList.push({ id: (codeObj as any)._id, code: codeObj.code });
      localStorage.setItem("bg_deleted_codes", JSON.stringify(deletedList));
      localStorage.setItem("bg_ref_codes", JSON.stringify(newCodes));
      window.dispatchEvent(new Event("bg_refcode_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch(e){}

    const id = (codeObj as any)._id;
    if (id) {
      try {
        await fetch(`/api/refcodes/${id}`, { method: "DELETE" });
      } catch(err) { console.error(err); }
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Referral Codes</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Manage codes that students can use for instant discount. Each code is single-use.</p>

      {/* Add Code */}
      <Card className="p-6 mb-6">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-3">Add New Referral Code</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Code Name</label>
            <input
              type="text"
              placeholder="e.g. SUMMER10 or ONETIME20"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Plan</label>
            <select
              value={newApplicablePlan}
              onChange={(e) => setNewApplicablePlan(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="one-time">One-Time Payment Only</option>
              <option value="installment">Installment Plan Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={addCode}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none flex items-center gap-1.5 shadow-sm active:scale-[0.98]">
            <FaPlus className="text-xs" /> Add Code
          </button>
        </div>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <div className="relative lg:col-span-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or creator..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Used">Used</option>
              <option value="Inactive">Inactive</option>
            </select>
            
            <div className="flex items-center gap-2 w-full">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={handleDownloadCSV}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-4 mb-6">
        {filteredCodes.map((c, i) => {
          const idx = codes.findIndex(x => x.code === c.code);
          const planLabel = c.applicablePlan === "one-time" ? "One-Time Only" : c.applicablePlan === "installment" ? "Installment Only" : "All Plans";
          const planBadgeCls = c.applicablePlan === "one-time" 
            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
            : c.applicablePlan === "installment"
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";

          return (
            <Card key={i} className="p-5 space-y-3.5 border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono tracking-wider text-base">{c.code}</span>
                  <button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer p-1.5 flex items-center justify-center">
                    <FaCopy className="text-xs" />
                  </button>
                  {copied === c.code && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Copied!</span>}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${planBadgeCls}`}>{planLabel}</span>
                  <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">{c.discountPercent ? `${c.discountPercent}%` : c.discount} OFF</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 dark:border-white/5 py-3">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Creator</span>
                  <p className="text-slate-800 dark:text-slate-200 font-mono font-bold mt-0.5">{c.creator || "admin"}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Created</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{c.created}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button onClick={() => toggleCode(idx)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition duration-200 ${c.active && c.uses === 0 ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"}`}>
                  {c.active && c.uses === 0 ? "Available" : c.uses > 0 ? "Used" : "Inactive"}
                </button>
                
                <button onClick={() => deleteCode(idx)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center">
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </Card>
          );
        })}
        {filteredCodes.length === 0 && (
          <div className="bg-white dark:bg-[#0e1726]/80 p-8 text-center text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-white/5 font-semibold text-sm">
            No referral codes found.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discount</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Plan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Creator</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.map((c, i) => {
                const idx = codes.findIndex(x => x.code === c.code);
                const planLabel = c.applicablePlan === "one-time" ? "One-Time Only" : c.applicablePlan === "installment" ? "Installment Only" : "All Plans";
                const planBadgeCls = c.applicablePlan === "one-time" 
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                  : c.applicablePlan === "installment"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";

                return (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono tracking-wider text-sm">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer p-0 flex items-center">
                          <FaCopy className="text-xs" />
                        </button>
                        {copied === c.code && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Copied!</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">{c.discountPercent ? `${c.discountPercent}%` : c.discount} OFF</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${planBadgeCls}`}>{planLabel}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">{c.creator || "admin"}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-medium">{c.created}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleCode(idx !== -1 ? idx : i)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition duration-200 ${c.active && c.uses === 0 ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"}`}>
                        {c.active && c.uses === 0 ? "Available" : c.uses > 0 ? "Used" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteCode(idx !== -1 ? idx : i)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition bg-transparent border-none cursor-pointer p-1">
                        <FaTrash className="text-sm" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCodes.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm font-semibold">No referral codes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SUB-ADMIN CODES TAB (Sub-Admin view — self-generation)
// ═══════════════════════════════════════════════════════════════════════
const SubAdminCodesTab = ({ username }: { username: string }) => {
  const [myCodes, setMyCodes] = useState<RefCode[]>(() => {
    try {
      const stored = localStorage.getItem("bg_ref_codes");
      if (!stored) return [];
      const all: RefCode[] = JSON.parse(stored);
      return all.filter(c => c.creator && c.creator.toLowerCase() === username.toLowerCase());
    } catch { return []; }
  });
  const [copied, setCopied] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateCode = () => {
    setGenerating(true);
    setTimeout(() => {
      const hex = Math.random().toString(16).substr(2, 6).toUpperCase();
      const newCodeStr = `BG-${username.toUpperCase()}-${hex}`;
      try {
        const stored = localStorage.getItem("bg_ref_codes");
        const allCodes: RefCode[] = stored ? JSON.parse(stored) : [];
        // Prevent duplicates
        if (!allCodes.some(c => c.code === newCodeStr)) {
          const newEntry: RefCode = {
            code: newCodeStr,
            discount: "10%",
            active: true,
            created: new Date().toISOString().split("T")[0],
            uses: 0,
            creator: username
          };
          const updatedAll = [...allCodes, newEntry];
          localStorage.setItem("bg_ref_codes", JSON.stringify(updatedAll));
          setMyCodes(prev => [...prev, newEntry]);
        }
      } catch (e) {
        console.error("Error generating code:", e);
      }
      setGenerating(false);
    }, 400);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">My Referral Codes</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
        Generate unique single-use codes for each student. Share the code and once they register, it gets marked as used.
      </p>

      {/* Generate Button */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Generate New Code</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Format: <span className="font-mono font-bold">BG-{username.toUpperCase()}-XXXXXX</span></p>
          </div>
          <button
            onClick={generateCode}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none flex items-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-60"
          >
            {generating ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> : <FaPlus className="text-xs" />}
            Generate Code
          </button>
        </div>
      </Card>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-4 mb-6">
        {myCodes.length === 0 ? (
          <div className="bg-white dark:bg-[#0e1726]/80 p-8 text-center text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-white/5 font-semibold text-sm">
            No codes generated yet. Click "Generate Code" to create one.
          </div>
        ) : (
          [...myCodes].reverse().map((c, i) => (
            <Card key={i} className="p-5 space-y-3.5 border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono tracking-wider text-sm">{c.code}</span>
                  <button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer p-1.5 flex items-center justify-center">
                    <FaCopy className="text-xs" />
                  </button>
                  {copied === c.code && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Copied!</span>}
                </div>
                
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  c.uses > 0
                    ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                    : "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                }`}>
                  {c.uses > 0 ? "Used" : "Available"}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-white/5 pt-3">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Created Date</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{c.created}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {myCodes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm font-semibold">
                    No codes generated yet. Click "Generate Code" to create one.
                  </td>
                </tr>
              ) : (
                [...myCodes].reverse().map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white font-mono tracking-wider text-sm">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer p-0 flex items-center">
                          <FaCopy className="text-xs" />
                        </button>
                        {copied === c.code && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Copied!</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-medium">{c.created}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        c.uses > 0
                          ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                          : "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                      }`}>
                        {c.uses > 0 ? "Used" : "Available"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SUB ADMINS TAB
// ═══════════════════════════════════════════════════════════════════════
const SubAdminsTab = ({ registrations, payments }: { registrations: Registration[]; payments: Payment[] }) => {
  const [subadmins, setSubadmins] = useState<SubAdmin[]>([]);
  const [form, setForm] = useState({ name: "", username: "", password: "", referralCode: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSubadmin, setExpandedSubadmin] = useState<string | null>(null);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchSubadmins = async () => {
      let serverSubs: any[] = [];
      try {
        const res = await fetch("/api/subadmins");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) serverSubs = data;
        }
      } catch (e) {}

      let localSubs: any[] = [];
      try {
        const stored = localStorage.getItem("bg_subadmins");
        if (stored) localSubs = JSON.parse(stored);
      } catch (e) {}

      let deletedSubs: any[] = [];
      try {
        deletedSubs = JSON.parse(localStorage.getItem("bg_deleted_subs") || "[]");
      } catch (e) {}

      const isSubDeleted = (s: any) => {
        return deletedSubs.some(d => 
          (d.id && ((s._id && s._id === d.id) || (s.id && s.id === d.id))) ||
          (d.username && s.username && s.username.toLowerCase() === d.username.toLowerCase())
        );
      };

      const combined = [...serverSubs.filter(s => !isSubDeleted(s))];
      for (const ls of localSubs.filter(s => !isSubDeleted(s))) {
        const exists = combined.some(s => 
          (s._id && ls._id && s._id === ls._id) || 
          (s.username && ls.username && s.username.toLowerCase() === ls.username.toLowerCase())
        );
        if (!exists) combined.push(ls);
      }

      setSubadmins(combined);
      try {
        localStorage.setItem("bg_subadmins", JSON.stringify(combined));
      } catch(e){}
    };

    fetchSubadmins();
    const handleSync = () => fetchSubadmins();

    window.addEventListener("storage", handleSync);
    window.addEventListener("bg_subadmin_updated", handleSync);
    window.addEventListener("focus", handleSync);
    const interval = setInterval(handleSync, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("bg_subadmin_updated", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, []);

  // Get all referral codes created by a sub-admin
  const getSubadminCodes = (username: string): RefCode[] => {
    try {
      const stored = localStorage.getItem("bg_ref_codes");
      if (!stored) return [];
      const allCodes: RefCode[] = JSON.parse(stored);
      const cleanUser = username.trim().toLowerCase();
      return allCodes.filter(c => 
        (c.creator && c.creator.toLowerCase() === cleanUser) ||
        (c.code && c.code.toLowerCase().includes(cleanUser))
      );
    } catch { return []; }
  };

  // Get students referred by a sub-admin (students who used their referral codes)
  const getReferredStudents = (username: string) => {
    const codes = getSubadminCodes(username).map(c => c.code.trim().toUpperCase());
    const userDefaultCode = (username.trim() + "10").toUpperCase();
    if (!codes.includes(userDefaultCode)) codes.push(userDefaultCode);

    const referredRegs = registrations.filter(
      r => r.referralCode && codes.includes(r.referralCode.trim().toUpperCase())
    );
    const referredPays = payments.filter(
      p => p.referralCode && codes.includes(p.referralCode.trim().toUpperCase())
    );
    return { referredRegs, referredPays };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, username, password, referralCode } = form;
    if (!name.trim() || !username.trim() || !password.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    
    const finalRefCode = referralCode.trim() ? referralCode.trim().toUpperCase() : username.trim().toUpperCase() + "10";

    if (editingId) {
      if (subadmins.some(s => s._id !== editingId && s.id !== editingId && s.username.toLowerCase() === username.trim().toLowerCase())) {
        alert("Username already exists.");
        return;
      }
      const updatedData = { name: name.trim(), username: username.trim(), password: password.trim(), referralCode: finalRefCode };
      const updatedList = subadmins.map(s => (s._id === editingId || s.id === editingId) ? { ...s, ...updatedData } : s);
      setSubadmins(updatedList);
      try {
        localStorage.setItem("bg_subadmins", JSON.stringify(updatedList));
        window.dispatchEvent(new Event("bg_subadmin_updated"));
        window.dispatchEvent(new Event("storage"));
      } catch(e){}

      try {
        const res = await fetch(`/api/subadmins/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        });
        if(res.ok) {
          const updatedServer = await res.json();
          setSubadmins(prev => prev.map(s => (s._id === editingId || s.id === editingId) ? updatedServer : s));
        }
      } catch (err) {
        console.error(err);
      }
      setEditingId(null);
    } else {
      if (subadmins.some(s => s.username.toLowerCase() === username.trim().toLowerCase())) {
        alert("Username already exists.");
        return;
      }
      const newSub = {
        id: "sub_" + Date.now(),
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        referralCode: finalRefCode,
        status: "Active",
        createdDate: new Date().toISOString().split("T")[0]
      };

      // 1. Save SubAdmin locally & in state
      const updatedList = [...subadmins, newSub];
      setSubadmins(updatedList);
      try {
        localStorage.setItem("bg_subadmins", JSON.stringify(updatedList));
        window.dispatchEvent(new Event("bg_subadmin_updated"));
        window.dispatchEvent(new Event("storage"));
      } catch(e){}

      // 2. Auto-create & register referral code for this SubAdmin in local storage & DB
      try {
        const storedCodesStr = localStorage.getItem("bg_ref_codes") || "[]";
        const storedCodes: RefCode[] = JSON.parse(storedCodesStr);
        if (!storedCodes.some(c => c.code.trim().toUpperCase() === finalRefCode)) {
          const autoCodeObj: RefCode = {
            code: finalRefCode,
            discount: "10%",
            discountPercent: 10,
            applicablePlan: "all",
            active: true,
            created: new Date().toISOString().split("T")[0],
            uses: 0,
            creator: username.trim()
          };
          const updatedRefCodes = [...storedCodes, autoCodeObj];
          localStorage.setItem("bg_ref_codes", JSON.stringify(updatedRefCodes));
          window.dispatchEvent(new Event("bg_refcode_updated"));
          window.dispatchEvent(new Event("storage"));
          fetch("/api/refcodes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(autoCodeObj)
          }).catch(() => {});
        }
      } catch(e){}

      // 3. Post to subadmins API endpoint
      try {
        const res = await fetch(`/api/subadmins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSub)
        });
        if(res.ok) {
          const saved = await res.json();
          setSubadmins(prev => prev.map(s => s.username === newSub.username ? saved : s));
        }
      } catch(err) {
        console.error(err);
      }
    }
    setForm({ name: "", username: "", password: "", referralCode: "" });
  };

  const handleEditClick = (sub: any) => {
    setForm({ name: sub.name, username: sub.username, password: sub.password, referralCode: sub.referralCode || "" });
    setEditingId(sub._id || sub.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (idx: number) => {
    const sub = subadmins[idx];
    const newStatus = sub.status === "Active" ? "Suspended" : "Active";
    const updatedList = subadmins.map((s, i) => i === idx ? { ...s, status: newStatus } : s);
    setSubadmins(updatedList);
    try {
      localStorage.setItem("bg_subadmins", JSON.stringify(updatedList));
      window.dispatchEvent(new Event("bg_subadmin_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch(e){}

    const id = (sub as any)._id || sub.id;
    if (id) {
      try {
        await fetch(`/api/subadmins/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
      } catch(err) { console.error(err); }
    }
  };

  const confirmDeleteSub = async () => {
    if (deleteConfirmIdx === null) return;
    const sub = subadmins[deleteConfirmIdx];
    const newSubs = subadmins.filter((_, i) => i !== deleteConfirmIdx);
    setSubadmins(newSubs);
    try {
      const deletedStr = localStorage.getItem("bg_deleted_subs") || "[]";
      const deletedList: any[] = JSON.parse(deletedStr);
      deletedList.push({ id: (sub as any)._id, username: sub.username });
      localStorage.setItem("bg_deleted_subs", JSON.stringify(deletedList));
      localStorage.setItem("bg_subadmins", JSON.stringify(newSubs));
      window.dispatchEvent(new Event("bg_subadmin_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch(e){}

    setDeleteConfirmIdx(null);
    const id = (sub as any)._id || sub.id;
    if (id) {
      try {
        await fetch(`/api/subadmins/${id}`, { method: "DELETE" });
      } catch(err) { console.error(err); }
    }
  };

  const deleteSub = (idx: number) => {
    setDeleteConfirmIdx(idx);
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Sub Admins</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Create and manage sub-admin accounts. Click on a sub-admin to view their referred students.</p>

      {/* Add / Edit Sub Admin */}
      <Card className="p-6 mb-6">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-4">{editingId ? "Update Sub-Admin Account" : "Create Sub-Admin Account"}</p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Username / Login ID</label>
              <input
                type="text"
                required
                placeholder="e.g. rahul123"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
              <input
                type="text"
                required
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2 gap-3">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ name: "", username: "", password: "" }); }}
                className="px-6 py-2.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none flex items-center gap-1.5 shadow-sm active:scale-[0.98]">
                Cancel
              </button>
            )}
            <button type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none flex items-center gap-1.5 shadow-sm active:scale-[0.98]">
              {editingId ? <FaEdit className="text-xs" /> : <FaPlus className="text-xs" />} {editingId ? "Update Account" : "Create Account"}
            </button>
          </div>
        </form>
      </Card>

      {/* Sub Admins List with Referral Details */}
      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-4 mb-6">
        {subadmins.length === 0 ? (
          <div className="bg-white dark:bg-[#0e1726]/80 p-8 text-center text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-white/5 font-semibold text-sm">
            No sub-admin accounts created yet.
          </div>
        ) : (
          subadmins.map((s, idx) => {
            const { referredRegs, referredPays } = getReferredStudents(s.username);
            const subCodes = getSubadminCodes(s.username);
            const isExpanded = expandedSubadmin === s.id;
            const paidReferredStudents = referredRegs.filter(r =>
              referredPays.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone)
            );
            const totalReferredRevenue = referredPays.reduce((acc, p) => acc + parseInt(p.planAmount.replace(/[₹,]/g, "") || "0"), 0);

            return (
              <Card key={s.id} className="p-5 border border-slate-100 dark:border-white/5 space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2" onClick={() => setExpandedSubadmin(isExpanded ? null : s.id)}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    {isExpanded ? <FaChevronUp className="text-indigo-500 text-xs" /> : <FaChevronDown className="text-slate-400 text-xs" />}
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{s.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{s.username}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${s.status === "Active" ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`} onClick={(e) => { e.stopPropagation(); toggleStatus(idx); }}>
                    {s.status}
                  </span>
                </div>

                {/* Password / Basic Info */}
                <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Password</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{s.password}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-white/5 pt-1.5 mt-1.5">
                    <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Referrals</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {paidReferredStudents.length} Student{paidReferredStudents.length !== 1 ? "s" : ""} · {subCodes.length} Code{subCodes.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Expanded Referral Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-white/5 pt-3.5 space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Codes</p>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{subCodes.length}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Referred</p>
                        <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{paidReferredStudents.length}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Revenue</p>
                        <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">₹{totalReferredRevenue.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {/* Referral Codes List */}
                    {subCodes.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Referral Codes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {subCodes.map((c, ci) => (
                            <span key={ci} className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                              c.uses > 0
                                ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 line-through"
                                : c.active
                                  ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                                  : "bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                            }`}>
                              {c.code} {c.uses > 0 ? "(Used)" : c.active ? "(Active)" : "(Inactive)"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Referred Students List */}
                    <div className="space-y-2">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Referred Students Details</p>
                      {paidReferredStudents.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold py-1">No students referred yet by this sub-admin.</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {paidReferredStudents.map((r, ri) => {
                            const studentPayment = referredPays.find(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
                            const totalPaid = referredPays
                              .filter(p => p.email.toLowerCase() === r.email.toLowerCase())
                              .reduce((acc, p) => acc + parseInt(p.planAmount.replace(/[₹,]/g, "") || "0"), 0);
                            return (
                              <div key={ri} className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 p-3 rounded-lg text-xs space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{r.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.email} · {r.phone}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">₹{totalPaid.toLocaleString("en-IN")}</span>
                                    {studentPayment && <span className="text-[9px] text-slate-400 dark:text-slate-500">{studentPayment.planTitle}</span>}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-white/5 mt-1">
                                  <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">{r.course}</span>
                                  <span className="font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">{r.referralCode}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-white/5 pt-3">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Actions</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(s)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center">
                      <FaEdit className="text-xs" />
                    </button>
                    <button onClick={() => deleteSub(idx)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center">
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Referrals</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subadmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm font-semibold">No sub-admin accounts created yet.</td>
                </tr>
              ) : (
                subadmins.map((s, idx) => {
                  const { referredRegs, referredPays } = getReferredStudents(s.username);
                  const subCodes = getSubadminCodes(s.username);
                  const isExpanded = expandedSubadmin === s.id;
                  // Get paid referred students (who have a matching payment)
                  const paidReferredStudents = referredRegs.filter(r =>
                    referredPays.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone)
                  );
                  const totalReferredRevenue = referredPays.reduce((acc, p) => acc + parseInt(p.planAmount.replace(/[₹,]/g, "") || "0"), 0);

                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        className={`border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition cursor-pointer ${isExpanded ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}`}
                        onClick={() => setExpandedSubadmin(isExpanded ? null : s.id)}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <FaChevronUp className="text-indigo-500 text-xs" /> : <FaChevronDown className="text-slate-400 text-xs" />}
                            {s.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{s.username}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{s.password}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              paidReferredStudents.length > 0
                                ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                                : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
                            }`}>
                              <FaLink className="inline mr-1 text-[10px]" />
                              {paidReferredStudents.length} Student{paidReferredStudents.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                              {subCodes.length} Code{subCodes.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleStatus(idx)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition duration-200 ${s.status === "Active" ? "bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>
                            {s.status}
                          </button>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleEditClick(s)} className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition bg-transparent border-none cursor-pointer p-1">
                              <FaEdit className="text-sm" />
                            </button>
                            <button onClick={() => deleteSub(idx)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition bg-transparent border-none cursor-pointer p-1">
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Referral Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0">
                            <div className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                              {/* Summary Stats */}
                              <div className="px-8 pt-5 pb-4 flex flex-wrap gap-4">
                                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 min-w-[140px]">
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Referral Codes</p>
                                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">{subCodes.length}</p>
                                </div>
                                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 min-w-[140px]">
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Students Referred</p>
                                  <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{paidReferredStudents.length}</p>
                                </div>
                                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 min-w-[140px]">
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Revenue Generated</p>
                                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{totalReferredRevenue.toLocaleString("en-IN")}</p>
                                </div>
                              </div>

                              {/* Referral Codes List */}
                              {subCodes.length > 0 && (
                                <div className="px-8 pb-3">
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">Referral Codes</p>
                                  <div className="flex flex-wrap gap-2">
                                    {subCodes.map((c, ci) => (
                                      <span key={ci} className={`text-xs font-bold font-mono px-3 py-1.5 rounded-lg border ${
                                        c.uses > 0
                                          ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 line-through"
                                          : c.active
                                            ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                                            : "bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                      }`}>
                                        {c.code} {c.uses > 0 ? "(Used)" : c.active ? "(Active)" : "(Inactive)"}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Referred Students Table */}
                              <div className="px-8 pb-5">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-3 mt-2">Referred Students</p>
                                {paidReferredStudents.length === 0 ? (
                                  <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold py-3">No students referred yet by this sub-admin.</p>
                                ) : (
                                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-x-auto">
                                    <table className="w-full text-sm min-w-[700px]">
                                      <thead>
                                        <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                          {["Student Name", "Email", "Phone", "Course", "Referral Code", "Payment"].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {paidReferredStudents.map((r, ri) => {
                                          const studentPayment = referredPays.find(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
                                          const totalPaid = referredPays
                                            .filter(p => p.email.toLowerCase() === r.email.toLowerCase())
                                            .reduce((acc, p) => acc + parseInt(p.planAmount.replace(/[₹,]/g, "") || "0"), 0);
                                          return (
                                            <tr key={ri} className="border-b border-slate-100 dark:border-white/5 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm">{r.name}</td>
                                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm">{r.email}</td>
                                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm font-mono">{r.phone}</td>
                                              <td className="px-4 py-3">
                                                <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/20">{r.course}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">{r.referralCode}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{totalPaid.toLocaleString("en-IN")}</span>
                                                {studentPayment && <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5 font-medium">({studentPayment.planTitle})</span>}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {deleteConfirmIdx !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1726] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Sub-Admin?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to delete this Sub-Admin account? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmIdx(null)} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-sm cursor-pointer border-none"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteSub} 
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition text-sm cursor-pointer border-none shadow-md shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// REGISTRATIONS TAB
// ═══════════════════════════════════════════════════════════════════════
const RegistrationsTab = ({
  registrations,
  payments,
  onOpenModal,
  userRole,
  onDeleteRegistration,
  onEditRegistration
}: {
  registrations: Registration[];
  payments: Payment[];
  onOpenModal: () => void;
  userRole: "admin" | "subadmin";
  onDeleteRegistration: (email: string, phone: string, id?: string) => void;
  onEditRegistration: (oldEmail: string, oldPhone: string, updatedReg: Registration, id?: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState<Registration | null>(null);
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const uniqueCourses = Array.from(new Set(registrations.map(r => r.course))).filter(Boolean);

  const filtered = registrations.filter(r => {
    // Payment Status Filter
    const hasPayment = payments.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
    if (filterPayment === "Paid" && !hasPayment) return false;
    if (filterPayment === "Unpaid" && hasPayment) return false;

    // Search Filter
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.email.toLowerCase().includes(search.toLowerCase()) ||
                          r.course.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    // Course Filter
    if (filterCourse !== "All" && r.course !== filterCourse) return false;
    
    // Date Filter
    if (r.timestamp) {
      try {
        const rDate = new Date(r.timestamp);
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (rDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (rDate > eDate) return false;
        }
      } catch (e) {
        // invalid date, skip filtering
      }
    }
    
    return true;
  });

  const handleDownloadCSV = () => {
    if (filtered.length === 0) {
      alert("No data to download.");
      return;
    }
    const headers = ["Name", "Email", "Phone", "Course", "College", "City", "Payment Status", "Date", "Referral Code"];
    const rows = filtered.map(r => {
      const hasPayment = payments.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
      let dateStr = "";
      try { dateStr = new Date(r.timestamp).toISOString().split("T")[0]; } catch(e) { dateStr = String(r.timestamp); }
      return [
        `"${r.name}"`,
        `"${r.email}"`,
        `"${r.phone}"`,
        `"${r.course}"`,
        `"${r.college || "N/A"}"`,
        `"${r.city || "N/A"}"`,
        `"${hasPayment ? "Paid" : "Unpaid"}"`,
        `"${dateStr}"`,
        `"${r.referralCode || ""}"`
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_registrations_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Student Registrations</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">All students who filled the registration form.</p>

      {/* Search & Filters & Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
            <div className="relative w-full">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, course..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200" />
            </div>
            <select 
              value={filterCourse} 
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
            >
              <option value="All">All Courses</option>
              {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={filterPayment} 
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Only Paid</option>
              <option value="Unpaid">Only Unpaid</option>
            </select>
            <div className="flex items-center gap-2 w-full">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
              />
              <span className="text-slate-400 self-center shrink-0">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full xl:w-auto">
            <button onClick={handleDownloadCSV}
              className="px-5 py-2.5 w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none flex items-center justify-center gap-2 shadow-md hover:shadow-slate-500/10 active:scale-[0.98]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download CSV
            </button>
            <button onClick={onOpenModal}
              className="px-5 py-2.5 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition duration-200 cursor-pointer border-none flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 active:scale-[0.98]">
              <FaPlus className="text-xs" /> Register Student
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-4 mb-6">
        {filtered.map((r, i) => {
          const hasPayment = payments.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
          return (
            <Card key={i} className="p-5 space-y-3.5 border border-slate-100 dark:border-white/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{r.name}</h4>
                  <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5 break-all">{r.email}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {hasPayment ? (
                    <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">Paid</span>
                  ) : (
                    <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-500/20">Unpaid</span>
                  )}
                  {r.referralCode && (
                    <span className="font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">{r.referralCode}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 dark:border-white/5 py-3">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Phone</span>
                  <p className="text-slate-800 dark:text-slate-200 font-mono font-medium mt-0.5">{r.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Course</span>
                  <div className="mt-0.5">
                    <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">{r.course}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">College</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 truncate">{r.college || "N/A"}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">City</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{r.city || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-450 dark:text-slate-500 font-semibold">{r.timestamp}</span>
                {userRole === "admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStudent(r)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center"
                      title="Edit Student"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={() => onDeleteRegistration(r.email, r.phone, (r as any)._id || (r as any).id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center"
                      title="Delete Student"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-[#0e1726]/80 p-8 text-center text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-white/5 font-semibold text-sm">
            No registrations found.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                {["Name", "Email", "Phone", "Course", "College", "City", "Payment Status", "Ref Code", "Time"].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
                {userRole === "admin" && (
                  <th className="text-left px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const hasPayment = payments.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
                return (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{r.name}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{r.email}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm font-mono whitespace-nowrap">{r.phone}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">{r.course}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{r.college}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{r.city}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {hasPayment ? (
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">Paid</span>
                      ) : (
                        <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-500/20">Unpaid</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.referralCode ? (
                        <span className="font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">{r.referralCode}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs font-semibold whitespace-nowrap">{r.timestamp}</td>
                    {userRole === "admin" && (
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingStudent(r)}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition border-none cursor-pointer"
                            title="Edit Student"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => onDeleteRegistration(r.email, r.phone, (r as any)._id || (r as any).id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer"
                            title="Delete Student"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={userRole === "admin" ? 9 : 8} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500 text-sm font-semibold">No registrations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Registration Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1726] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit Student Details</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-transparent border-none cursor-pointer p-1"
              >
                <FaTimes />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingStudent) {
                  onEditRegistration(editingStudent.email, editingStudent.phone, editingStudent, (editingStudent as any)._id || (editingStudent as any).id);
                  setEditingStudent(null);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email ID</label>
                <input
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Course</label>
                <select
                  value={editingStudent.course}
                  onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                >
                  <option value="MERN Stack">MERN Stack</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">College</label>
                <input
                  type="text"
                  value={editingStudent.college}
                  onChange={(e) => setEditingStudent({ ...editingStudent, college: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={editingStudent.city}
                  onChange={(e) => setEditingStudent({ ...editingStudent, city: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Referral Code</label>
                <input
                  type="text"
                  value={editingStudent.referralCode || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, referralCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-xs font-bold rounded-xl transition cursor-pointer border-none shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentsTab = ({
  payments,
  onAddPayment,
  onDeletePayment,
  userRole
}: {
  payments: Payment[];
  onAddPayment: (student: { name: string; email: string; phone: string; course: string }) => void;
  onDeletePayment: (email: string, transactionId: string, id?: string) => void;
  userRole: "admin" | "subadmin";
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = payments.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.email.toLowerCase().includes(search.toLowerCase()) ||
                          p.transactionId.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus !== "All") {
      const remaining = getRemainingBalance(p.email, p.phone, payments);
      const hasDues = remaining !== "₹0";
      if (filterStatus === "Cleared" && hasDues) return false;
      if (filterStatus === "Has Dues" && !hasDues) return false;
    }

    if (p.timestamp) {
      const pDateStr = p.timestamp.split(" ")[0];
      const pDate = new Date(pDateStr);
      if (startDate) {
        const sDate = new Date(startDate);
        if (pDate < sDate) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (pDate > eDate) return false;
      }
    }
    
    return true;
  });

  const totalTransactions = filtered.length;
  const totalCollected = filtered.reduce((acc, p) => acc + parseInt(String(p.planAmount).replace(/[₹,]/g, "") || "0"), 0);
  
  const uniqueEmails = Array.from(new Set(filtered.map(x => x.email.toLowerCase())));
  const totalDues = uniqueEmails.reduce((acc, email) => {
    const matched = filtered.find(x => x.email.toLowerCase() === email);
    if (!matched) return acc;
    const remaining = getRemainingBalance(matched.email, matched.phone, payments).replace(/[₹,]/g, "");
    return acc + parseInt(remaining || "0");
  }, 0);

  const getPlanBadgeClass = (plan: string) => {
    const p = plan.toLowerCase();
    if (p.includes("one-time") || p.includes("full")) {
      return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20";
    }
    if (p.includes("1st") || p.includes("first")) {
      return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20";
    }
    if (p.includes("2nd") || p.includes("second") || p.includes("final")) {
      return "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20";
    }
    return "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/10";
  };

  const handleDownloadCSV = () => {
    if (filtered.length === 0) {
      alert("No data to download.");
      return;
    }
    
    const headers = ["Name", "Email", "Phone", "UTR / TXN ID", "Plan / Option", "Paid Amount", "Total Paid", "Remaining Dues", "Time"];
    const rows = filtered.map(p => {
      const remaining = getRemainingBalance(p.email, p.phone, payments);
      const totalPaid = payments
        .filter(x => x.email.toLowerCase() === p.email.toLowerCase())
        .reduce((acc, x) => acc + parseInt(String(x.planAmount).replace(/[₹,]/g, "") || "0"), 0);
      
      return [
        `"${p.name}"`, 
        `"${p.email}"`, 
        `"${p.phone}"`, 
        `"${p.transactionId}"`, 
        `"${p.planTitle}"`, 
        `"${p.planAmount}"`,
        `"${totalPaid}"`, 
        `"${remaining}"`, 
        `"${p.timestamp}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Payment Records</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">All student payments. Use <span className="text-indigo-500 font-bold">Update Due</span> to record remaining installment payments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#0e1726]/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:scale-[1.02] transition duration-200">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Transactions</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{totalTransactions}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100/30 dark:border-blue-500/15">
            <FaMoneyBillWave className="text-blue-500 text-lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0e1726]/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:scale-[1.02] transition duration-200">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Total Collected</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₹{totalCollected.toLocaleString("en-IN")}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100/30 dark:border-emerald-500/15">
            <FaCheckCircle className="text-emerald-500 text-lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0e1726]/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:scale-[1.02] transition duration-200 sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Outstanding Dues</p>
            <h3 className="text-2xl font-black text-rose-500 dark:text-rose-400 tracking-tight">₹{totalDues.toLocaleString("en-IN")}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100/30 dark:border-rose-500/15">
            <FaMoneyBillWave className="text-rose-500 text-lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <div className="relative lg:col-span-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or UTR..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 cursor-pointer">
              <option value="All">All Status</option>
              <option value="Cleared">Cleared</option>
              <option value="Has Dues">Has Dues</option>
            </select>
            
            <div className="flex items-center gap-2 w-full">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 cursor-pointer" />
              <span className="text-slate-400 text-xs">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleDownloadCSV}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-md w-full sm:w-auto">
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-4 mb-6">
        {filtered.map((p, i) => {
          const remaining = getRemainingBalance(p.email, p.phone, payments);
          const hasDues = remaining !== "₹0";
          const totalPaid = payments
            .filter(x => x.email.toLowerCase() === p.email.toLowerCase())
            .reduce((acc, x) => acc + parseInt(String(x.planAmount).replace(/[₹,]/g, "") || "0"), 0);
          
          return (
            <Card key={i} className="p-5 space-y-3.5 border border-slate-100 dark:border-white/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{p.name}</h4>
                  <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5 break-all font-mono">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded uppercase ${getPlanBadgeClass(p.planTitle)}`}>
                    {p.planTitle}
                  </span>
                  {p.course && (
                    <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">{p.course}</span>
                  )}
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">UTR / TXN ID</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{p.transactionId}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-white/5 pt-1.5 mt-1.5">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Amount Paid</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {String(p.planAmount).startsWith("₹") ? p.planAmount : `₹${parseInt(String(p.planAmount)).toLocaleString("en-IN")}`}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Total Paid So Far</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{totalPaid.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Remaining Dues</span>
                  {hasDues ? (
                    <span className="text-red-500 dark:text-red-400 font-extrabold">{remaining}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <FaCheckCircle className="text-[9px]" /> Cleared
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-450 dark:text-slate-500 font-semibold">{p.timestamp}</span>
                <div className="flex gap-2">
                  {hasDues && (
                    <button
                      onClick={() => onAddPayment({ name: p.name, email: p.email, phone: p.phone, course: p.course })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold rounded-lg transition duration-150 cursor-pointer"
                    >
                      <FaPlus className="text-[9px]" /> Update Due
                    </button>
                  )}
                  <button
                    onClick={() => onDeletePayment(p.email, p.transactionId, (p as any)._id || (p as any).id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center"
                    title="Delete Payment"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-[#0e1726]/80 p-8 text-center text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-white/5 font-semibold text-sm">
            No payment records found.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                {["Name", "Email", "UTR / TXN ID", "Plan / Option", "Paid Amount", "Total Paid", "Remaining Dues", "Time", "Action"].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const remaining = getRemainingBalance(p.email, p.phone, payments);
                const hasDues = remaining !== "₹0";
                
                const totalPaid = payments
                  .filter(x => x.email.toLowerCase() === p.email.toLowerCase())
                  .reduce((acc, x) => acc + parseInt(String(x.planAmount).replace(/[₹,]/g, "") || "0"), 0);
                return (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{p.name}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{p.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-bold tracking-wider">
                        {p.transactionId}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-black tracking-wider px-2.5 py-1.5 rounded-full uppercase ${getPlanBadgeClass(p.planTitle)}`}>
                        {p.planTitle}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                      {String(p.planAmount).startsWith("₹") ? p.planAmount : `₹${parseInt(String(p.planAmount)).toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">₹{totalPaid.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {hasDues ? (
                        <span className="font-extrabold text-red-500 dark:text-red-400 text-sm">{remaining}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full">
                          <FaCheckCircle className="text-[10px]" /> Cleared
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs font-semibold whitespace-nowrap">{p.timestamp}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {hasDues && (
                          <button
                            onClick={() => onAddPayment({ name: p.name, email: p.email, phone: p.phone, course: p.course })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold rounded-lg transition duration-150 cursor-pointer"
                          >
                            <FaPlus className="text-[10px]" /> Update Due
                          </button>
                        )}
                        <button
                          onClick={() => onDeletePayment(p.email, p.transactionId, (p as any)._id || (p as any).id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center"
                          title="Delete Payment"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400 dark:text-slate-555 text-sm font-semibold">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MASTERCLASS TAB
// ═══════════════════════════════════════════════════════════════════════
const MasterclassTab = ({
  registrations,
  onDelete
}: {
  registrations: MasterclassReg[];
  onDelete: (email: string, phone: string, id?: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [filterExp, setFilterExp] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = registrations.filter(r => {
    const matchesSearch =
      (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.phone || "").includes(search) ||
      (r.college || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.city || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterExp !== "All" && r.experience !== filterExp) return false;

    if (r.timestamp) {
      try {
        const rDate = new Date(r.timestamp);
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (rDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (rDate > eDate) return false;
        }
      } catch (e) {}
    }

    return true;
  });

  const handleDownloadCSV = () => {
    if (filtered.length === 0) {
      alert("No data to download.");
      return;
    }
    const headers = ["Name", "Email", "Phone", "College", "City", "Current Status", "Timestamp"];
    const rows = filtered.map(r => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.college || "N/A"}"`,
      `"${r.city || "N/A"}"`,
      `"${r.experience || "Student"}"`,
      `"${r.timestamp || ""}"`
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `masterclass_registrations_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = filtered.length;
  const uniqueCities = Array.from(new Set(filtered.map(r => r.city).filter(Boolean))).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <FaPlayCircle className="text-amber-500" /> Masterclass Registrations
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Students who registered via the Live Masterclass Popup on the website.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#0e1726]/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Total Registered</p>
            <h3 className="text-2xl font-black text-amber-500 tracking-tight">{totalCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100/30 dark:border-amber-500/15">
            <FaPlayCircle className="text-amber-500 text-lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0e1726]/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Cities Covered</p>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{uniqueCities}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100/30 dark:border-indigo-500/15">
            <FaUsers className="text-indigo-500 text-lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0e1726]/40 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Masterclass Status</p>
            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">Live Active</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100/30 dark:border-emerald-500/15">
            <FaCheckCircle className="text-emerald-500 text-lg" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, city..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200"
            />
          </div>

          <select
            value={filterExp}
            onChange={(e) => setFilterExp(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="College Student (CS/IT)">College Student (CS/IT)</option>
            <option value="College Student (Non-CS)">College Student (Non-CS)</option>
            <option value="Job Seeker / Fresher">Job Seeker / Fresher</option>
            <option value="Working Professional">Working Professional</option>
          </select>

          <div className="flex items-center gap-2 w-full">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-3 py-2.5 bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-xs outline-none focus:border-indigo-500 transition duration-200 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDownloadCSV}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer border-none shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-4 mb-6">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0e1726]/80 p-8 text-center text-slate-400 dark:text-slate-500 rounded-3xl border border-slate-100 dark:border-white/5 font-semibold text-sm">
            No Masterclass registrations found.
          </div>
        ) : (
          filtered.map((r, i) => (
            <Card key={i} className="p-5 space-y-3.5 border border-slate-100 dark:border-white/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{r.name}</h4>
                  <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5 break-all font-mono">{r.email}</p>
                </div>
                <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-500/20">
                  Masterclass
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 dark:border-white/5 py-3">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Phone</span>
                  <p className="text-slate-800 dark:text-slate-200 font-mono font-medium mt-0.5">{r.phone}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Status</span>
                  <div className="mt-0.5">
                    <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">{r.experience || "Student"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">College</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 truncate">{r.college || "N/A"}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">City</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{r.city || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-450 dark:text-slate-500 font-semibold">{r.timestamp}</span>
                <button
                  onClick={() => onDelete(r.email, r.phone, r._id || r.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center"
                  title="Delete Registration"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-sm min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                {["Name", "Email", "Phone", "College", "City", "Status / Role", "Time", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm font-semibold">
                    No Masterclass registrations found.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">{r.name}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{r.email}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm font-mono whitespace-nowrap">{r.phone}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{r.college}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{r.city}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                        {r.experience || "Student"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs font-semibold whitespace-nowrap">{r.timestamp}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onDelete(r.email, r.phone, r._id || r.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition border-none cursor-pointer flex items-center justify-center"
                        title="Delete Registration"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════════════════
const DashboardTab = ({
  registrations,
  payments,
  masterclassCount = 0
}: {
  registrations: Registration[];
  payments: Payment[];
  masterclassCount?: number;
}) => {
  const refCodes = loadCodes();
  const activeCodes = refCodes.filter(c => c.active).length;

  // Only display registrations that have a matching payment record (by email or phone)
  const paidRegistrations = registrations.filter(r =>
    payments.some(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone)
  );

  // Calculate total outstanding dues for all registered students who have paid something
  const totalOutstandingDues = paidRegistrations.reduce((acc, r) => {
    const regPayments = payments.filter(p => p.email.toLowerCase() === r.email.toLowerCase() || p.phone === r.phone);
    if (regPayments.length === 0) return acc;
    
    const balanceStr = String(getRemainingBalance(r.email, r.phone, payments)).replace(/[₹,]/g, "");
    return acc + parseInt(balanceStr || "0");
  }, 0);

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Dashboard Overview</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Quick summary of all students, payments and referral activity.</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card className="hover:scale-[1.02] transition-transform duration-200"><StatCard label="Course Regs" value={registrations.length} icon={<FaUsers className="text-blue-600 dark:text-blue-400 text-lg" />} iconBgClass="bg-blue-50 dark:bg-blue-500/10" /></Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200"><StatCard label="Masterclass Regs" value={masterclassCount} icon={<FaPlayCircle className="text-amber-500 text-lg" />} iconBgClass="bg-amber-50 dark:bg-amber-500/10" /></Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200"><StatCard label="Payments Received" value={payments.length} icon={<FaMoneyBillWave className="text-green-600 dark:text-green-400 text-lg" />} iconBgClass="bg-green-50 dark:bg-green-500/10" /></Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200"><StatCard label="Active Ref Codes" value={activeCodes} icon={<FaTags className="text-indigo-600 dark:text-indigo-400 text-lg" />} iconBgClass="bg-indigo-50 dark:bg-indigo-500/10" /></Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200"><StatCard label="Revenue (Est.)" value={"₹" + payments.reduce((acc, p) => acc + parseInt(String(p.planAmount).replace(/[₹,]/g, "") || "0"), 0).toLocaleString()} icon={<FaChartBar className="text-violet-600 dark:text-violet-400 text-lg" />} iconBgClass="bg-violet-50 dark:bg-violet-500/10" /></Card>
        <Card className="hover:scale-[1.02] transition-transform duration-200"><StatCard label="Outstanding Dues" value={"₹" + totalOutstandingDues.toLocaleString()} icon={<FaMoneyBillWave className="text-red-500 dark:text-red-400 text-lg" />} iconBgClass="bg-red-50 dark:bg-red-500/10" /></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Registrations</h3>
            <FaUsers className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {registrations.slice(0, 3).map((r, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{r.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{r.email} · {r.course}</p>
                </div>
                <span className="text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-full font-bold self-start sm:self-center">{r.city}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Recent Payments</h3>
            <FaMoneyBillWave className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {payments.slice(0, 3).map((p, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-mono">{p.transactionId}</p>
                </div>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm self-start sm:self-center">{p.planAmount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════
const AdminPanel = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "subadmin">("admin");
  const [subadminName, setSubadminName] = useState("");
  const [subadminUsername, setSubadminUsername] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteRegTarget, setDeleteRegTarget] = useState<{ id?: string; email: string; phone: string } | null>(null);
  const [deletePayTarget, setDeletePayTarget] = useState<{ id?: string; transactionId: string; email: string } | null>(null);
  const navigate = useNavigate();

  // All data fetched exclusively from MongoDB via API — localStorage is NOT used as a data source
  // This ensures mobile and laptop (and all devices) always show the same data
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [masterclassRegs, setMasterclassRegs] = useState<MasterclassReg[]>([]);

  const fetchRegistrationsAndPayments = async () => {
    // Sync referral codes from database
    try {
      const codeRes = await fetch("/api/refcodes");
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        if (Array.isArray(codeData)) {
          // Only keep in memory for this session — do not persist to localStorage
          localStorage.setItem("bg_ref_codes", JSON.stringify(codeData));
        }
      }
    } catch (e) {
      console.warn("Failed to sync referral codes from server:", e);
    }

    // 1. Fetch Registrations — DB is the single source of truth
    try {
      const regRes = await fetch("/api/registrations");
      if (regRes.ok) {
        const regData = await regRes.json();
        if (Array.isArray(regData)) {
          setRegistrations(regData);
        }
      }
      // No localStorage fallback — stale local data must never override live DB data
    } catch (e) {
      console.warn("Failed to fetch registrations from DB", e);
    }

    // 2. Fetch Payments — DB is the single source of truth
    try {
      const payRes = await fetch("/api/payments");
      if (payRes.ok) {
        const payData = await payRes.json();
        if (Array.isArray(payData)) {
          setPayments(payData);
        }
      }
      // No localStorage fallback
    } catch (e) {
      console.warn("Failed to fetch payments from DB", e);
    }

    // 3. Fetch Masterclass Registrations — DB is the single source of truth
    try {
      const mcRes = await fetch("/api/masterclass-registrations");
      if (mcRes.ok) {
        const mcData = await mcRes.json();
        if (Array.isArray(mcData)) {
          setMasterclassRegs(mcData);
        }
      }
      // No localStorage fallback
    } catch (e) {
      console.warn("Failed to fetch masterclass registrations from DB", e);
    }
  };

  useEffect(() => {
    fetchRegistrationsAndPayments();

    window.addEventListener("bg_registration_added", fetchRegistrationsAndPayments);
    window.addEventListener("bg_payment_added", fetchRegistrationsAndPayments);
    window.addEventListener("bg_masterclass_added", fetchRegistrationsAndPayments);
    window.addEventListener("storage", fetchRegistrationsAndPayments);
    window.addEventListener("focus", fetchRegistrationsAndPayments);

    const interval = setInterval(fetchRegistrationsAndPayments, 3000);
    return () => {
      window.removeEventListener("bg_registration_added", fetchRegistrationsAndPayments);
      window.removeEventListener("bg_payment_added", fetchRegistrationsAndPayments);
      window.removeEventListener("bg_masterclass_added", fetchRegistrationsAndPayments);
      window.removeEventListener("storage", fetchRegistrationsAndPayments);
      window.removeEventListener("focus", fetchRegistrationsAndPayments);
      clearInterval(interval);
    };
  }, []);

  const handleDeleteMasterclassReg = async (email: string, phone: string, id?: string) => {
    setMasterclassRegs(prev => prev.filter(r => {
      if (id && ((r as any)._id === id || (r as any).id === id)) return false;
      if (email && r.email && r.email.toLowerCase() === email.toLowerCase()) return false;
      if (phone && r.phone && r.phone === phone) return false;
      return true;
    }));

    const target = id || email || phone;
    if (target) {
      try {
        await fetch(`/api/masterclass-registrations/${target}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete masterclass registration from database", e);
      }
    }
    fetchRegistrationsAndPayments();
  };

  const handleDeleteRegistration = async (email: string, phone: string, id?: string) => {
    setDeleteRegTarget({ email, phone, id });
  };

  const confirmDelete = async () => {
    if (!deleteRegTarget) return;
    const { id, email, phone } = deleteRegTarget;

    setRegistrations(prev => prev.filter(r => {
      if (id && ((r as any)._id === id || (r as any).id === id)) return false;
      if (email && r.email && r.email.toLowerCase() === email.toLowerCase()) return false;
      if (phone && r.phone && r.phone === phone) return false;
      return true;
    }));

    setDeleteRegTarget(null);

    const target = id || email || phone;
    if (target) {
      try {
        await fetch(`/api/registrations/${target}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete registration from database", e);
      }
    }
    fetchRegistrationsAndPayments();
  };

  const handleDeletePayment = async (email: string, transactionId: string, id?: string) => {
    setDeletePayTarget({ id, transactionId, email });
  };

  const confirmDeletePayment = async () => {
    if (!deletePayTarget) return;
    const { id, transactionId, email } = deletePayTarget;

    setPayments(prev => prev.filter(p => {
      if (id && ((p as any)._id === id || (p as any).id === id)) return false;
      if (transactionId && p.transactionId && p.transactionId === transactionId) return false;
      if (email && p.email && p.email.toLowerCase() === email.toLowerCase()) return false;
      return true;
    }));

    setDeletePayTarget(null);

    const target = id || transactionId || email;
    if (target) {
      try {
        await fetch(`/api/payments/${target}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete payment from database", e);
      }
    }
    fetchRegistrationsAndPayments();
  };

  const handleEditRegistration = async (oldEmail: string, oldPhone: string, updatedReg: Registration, id?: string) => {
    // Update local state immediately for responsive UI
    setRegistrations(prev => prev.map(r => {
      const isMatch = (id && ((r as any)._id === id || (r as any).id === id)) || 
                      (oldEmail && r.email && r.email.toLowerCase() === oldEmail.toLowerCase()) || 
                      (oldPhone && r.phone && r.phone === oldPhone);
      return isMatch ? { ...r, ...updatedReg } : r;
    }));

    // Persist to DB (source of truth)
    if (id) {
      try {
        await fetch(`/api/registrations/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedReg)
        });
      } catch (e) {
        console.error("Failed to edit registration in database", e);
      }
    }
  };

  // Manual student registration modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    email: "",
    phone: "",
    course: "MERN Stack",
    college: "",
    city: "",
    payStatus: "Unpaid",
    payAmount: "0",
    transactionId: "",
    referralCode: ""
  });

  // Update due payment modal states
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [dueForm, setDueForm] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    planTitle: "2nd Installment",
    amount: "3200",
    transactionId: ""
  });

  const openDueModal = (student: { name: string; email: string; phone: string; course: string }) => {
    setDueForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      course: student.course,
      planTitle: "2nd Installment",
      amount: "3200",
      transactionId: ""
    });
    setIsDueModalOpen(true);
  };

  const handleDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueForm.transactionId) {
      alert("Please enter the UTR / Transaction ID.");
      return;
    }
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newPay = {
      name: dueForm.name,
      email: dueForm.email,
      phone: dueForm.phone,
      course: dueForm.course,
      planTitle: dueForm.planTitle,
      planAmount: "₹" + parseInt(dueForm.amount || "0").toLocaleString("en-IN"),
      transactionId: dueForm.transactionId,
      timestamp
    };

    setPayments(prev => [newPay, ...prev]);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPay)
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved._id) {
          setPayments(prev => prev.map(p => p === newPay ? saved : p));
        }
      }
    } catch (e) { console.error(e); }
    setIsDueModalOpen(false);
    setDueForm({ name: "", email: "", phone: "", course: "", planTitle: "2nd Installment", amount: "3200", transactionId: "" });
  };

  useEffect(() => {
    if (sessionStorage.getItem("bg_admin_auth") === "true") {
      setIsAuthenticated(true);
      const role = (sessionStorage.getItem("bg_auth_role") || "admin") as "admin" | "subadmin";
      setUserRole(role);
      if (role === "subadmin") {
        setSubadminName(sessionStorage.getItem("bg_subadmin_name") || "");
        setSubadminUsername(sessionStorage.getItem("bg_subadmin_username") || "");
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("bg_admin_auth");
    sessionStorage.removeItem("bg_auth_role");
    sessionStorage.removeItem("bg_subadmin_username");
    sessionStorage.removeItem("bg_subadmin_name");
    setIsAuthenticated(false);
    setUserRole("admin");
    setSubadminName("");
    setSubadminUsername("");
  };

  const openRegistrationModal = () => {
    setModalForm({
      name: "",
      email: "",
      phone: "",
      course: "MERN Stack",
      college: "",
      city: "",
      payStatus: "Unpaid",
      payAmount: "0",
      transactionId: "",
      referralCode: ""
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name || !modalForm.email || !modalForm.phone) {
      alert("Please fill in name, email and phone number.");
      return;
    }

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newReg = {
      name: modalForm.name,
      email: modalForm.email,
      phone: modalForm.phone,
      course: modalForm.course,
      college: modalForm.college || "N/A",
      city: modalForm.city || "N/A",
      timestamp,
      referralCode: modalForm.referralCode.trim().toUpperCase()
    };

    let newPay: any = null;
    if (modalForm.payStatus !== "Unpaid") {
      if (!modalForm.transactionId) {
        alert("Transaction/UTR ID is required for payment status.");
        return;
      }
      newPay = {
        name: modalForm.name,
        email: modalForm.email,
        phone: modalForm.phone,
        course: modalForm.course,
        planTitle: modalForm.payStatus,
        planAmount: "₹" + parseInt(modalForm.payAmount || "0").toLocaleString("en-IN"),
        transactionId: modalForm.transactionId,
        timestamp,
        referralCode: modalForm.referralCode.trim().toUpperCase()
      };
    }

    setRegistrations(prev => [newReg, ...prev]);
    if (newPay) {
      setPayments(prev => [newPay, ...prev]);
    }

    try {
      const regRes = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReg)
      });
      if (regRes.ok) {
        const savedReg = await regRes.json();
        if (savedReg && savedReg._id) {
          setRegistrations(prev => prev.map(r => r === newReg ? savedReg : r));
        }
      }
      if (newPay) {
        const payRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPay)
        });
        if (payRes.ok) {
          const savedPay = await payRes.json();
          if (savedPay && savedPay._id) {
            setPayments(prev => prev.map(p => p === newPay ? savedPay : p));
          }
        }
      }
    } catch (e) { console.error(e); }

    setIsModalOpen(false);
    // Reset Form
    setModalForm({
      name: "",
      email: "",
      phone: "",
      course: "MERN Stack",
      college: "",
      city: "",
      payStatus: "Unpaid",
      payAmount: "0",
      transactionId: "",
      referralCode: ""
    });
  };

  if (!isAuthenticated) return (
    <LoginPage onLogin={(role, name, _codes) => {
      setIsAuthenticated(true);
      setUserRole(role);
      setSubadminName(name);
      setSubadminUsername(sessionStorage.getItem("bg_subadmin_username") || "");
      setActiveTab("dashboard");
    }} />
  );

  // Get all codes created by this sub-admin
  const getSubadminCreatorCodes = (): string[] => {
    try {
      const stored = localStorage.getItem("bg_ref_codes");
      if (!stored) return [];
      const allCodes: RefCode[] = JSON.parse(stored);
      return allCodes
        .filter(c => c.creator && c.creator.toLowerCase() === subadminUsername.toLowerCase())
        .map(c => c.code.trim().toUpperCase());
    } catch { return []; }
  };

  const subadminCreatorCodes = getSubadminCreatorCodes();

  const filteredRegistrations = userRole === "admin"
    ? registrations
    : registrations.filter(r => r.referralCode && subadminCreatorCodes.includes(r.referralCode.trim().toUpperCase()));

  const filteredPayments = userRole === "admin"
    ? payments
    : payments.filter(p => p.referralCode && subadminCreatorCodes.includes(p.referralCode.trim().toUpperCase()));

  const navItems = userRole === "admin"
    ? [
        { id: "dashboard",     label: "Dashboard",     icon: <FaChartBar /> },
        { id: "registrations", label: "Registrations", icon: <FaUsers /> },
        { id: "masterclass",   label: "Masterclass",   icon: <FaPlayCircle /> },
        { id: "payments",      label: "Payments",      icon: <FaMoneyBillWave /> },
        { id: "plans",         label: "Plans",         icon: <FaTags /> },
        { id: "referrals",     label: "Referral Codes",icon: <FaTags /> },
        { id: "subadmins",     label: "Sub Admins",    icon: <FaShieldAlt /> },
      ]
    : [
        { id: "dashboard",     label: "Dashboard",     icon: <FaChartBar /> },
        { id: "registrations", label: "Registrations", icon: <FaUsers /> },
        { id: "masterclass",   label: "Masterclass",   icon: <FaPlayCircle /> },
        { id: "payments",      label: "Payments",      icon: <FaMoneyBillWave /> },
        { id: "mycodes",       label: "My Codes",      icon: <FaTags /> },
      ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d19] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#050b18] border-r border-white/5 flex flex-col z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <FaShieldAlt className="text-indigo-400 text-lg" />
          </div>
          <div>
            <p className="font-extrabold text-white text-base leading-none">BeanGate</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{userRole === "admin" ? "Admin Panel" : "Sub-Admin"}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white bg-transparent border-none cursor-pointer lg:hidden">
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer border-none text-left ${activeTab === item.id ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-6 border-t border-white/5 space-y-2">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition duration-200 cursor-pointer border-none bg-transparent text-left">
            <FaDatabase className="text-sm" /> View Website
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition duration-200 cursor-pointer border-none bg-transparent text-left">
            <FaSignOutAlt className="text-sm" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">

        {/* Top Bar */}
        <header className="bg-white/80 dark:bg-[#0e1726]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent border-none cursor-pointer lg:hidden flex items-center p-1">
              <FaBars className="text-lg" />
            </button>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white text-base capitalize leading-tight">
                {activeTab === "dashboard" ? "Dashboard" 
                  : activeTab === "registrations" ? "Registrations" 
                  : activeTab === "masterclass" ? "Masterclass Registrations"
                  : activeTab === "payments" ? "Payments" 
                  : activeTab === "plans" ? "Plans & Pricing" 
                  : activeTab === "referrals" ? "Referral Codes"
                  : activeTab === "mycodes" ? "My Referral Codes"
                  : "Sub Admins"}
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                {userRole === "admin" ? "BeanGate IT Solutions Admin" : `Sub-Admin: ${subadminName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition duration-200 cursor-pointer border-none flex items-center justify-center" aria-label="Toggle theme">
              {theme === "dark" ? <FaSun className="text-yellow-500 text-sm" /> : <FaMoon className="text-indigo-600 text-sm" />}
            </button>

            {/* Badge */}
            <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-3.5 py-1.5 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <FaShieldAlt className="text-indigo-400 text-[10px]" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {userRole === "admin" ? "Admin" : "Sub-Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 min-w-0 overflow-x-hidden overflow-y-auto">
          {activeTab === "dashboard"      && <DashboardTab registrations={filteredRegistrations} payments={filteredPayments} masterclassCount={masterclassRegs.length} />}
          {activeTab === "registrations"  && (
            <RegistrationsTab
              registrations={filteredRegistrations}
              payments={filteredPayments}
              onOpenModal={openRegistrationModal}
              userRole={userRole}
              onDeleteRegistration={handleDeleteRegistration}
              onEditRegistration={handleEditRegistration}
            />
          )}
          {activeTab === "masterclass"    && <MasterclassTab registrations={masterclassRegs} onDelete={handleDeleteMasterclassReg} />}
          {activeTab === "payments"       && <PaymentsTab payments={filteredPayments} onAddPayment={openDueModal} onDeletePayment={handleDeletePayment} userRole={userRole} />}
          {activeTab === "plans"          && <PlansTab />}
          {activeTab === "referrals"      && userRole === "admin" && <ReferralTab />}
          {activeTab === "subadmins"      && userRole === "admin" && <SubAdminsTab registrations={registrations} payments={payments} />}
          {activeTab === "mycodes"        && userRole === "subadmin" && <SubAdminCodesTab username={subadminUsername} />}
        </main>

      </div>

      {/* ── Update Due Payment Modal ── */}
      {isDueModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1726] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Update Due Payment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Record the remaining installment paid by the student.</p>
              </div>
              <button onClick={() => setIsDueModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-transparent border-none cursor-pointer p-1">
                <FaTimes className="text-lg" />
              </button>
            </div>

             {/* Body */}
            <form onSubmit={handleDueSubmit} className="p-6 space-y-4">
              {/* Read-only student info */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 space-y-1.5">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Student Info</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{dueForm.name}</p>
                <p className="text-slate-550 dark:text-slate-400 text-xs">{dueForm.email} &nbsp;·&nbsp; {dueForm.phone}</p>
                <p className="text-slate-550 dark:text-slate-400 text-xs">{dueForm.course}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Payment Type *</label>
                  <select value={dueForm.planTitle} onChange={e => {
                    const t = e.target.value;
                    setDueForm({...dueForm, planTitle: t, amount: t === "Final (Full Clearance)" ? "6000" : "3200"});
                  }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500">
                    <option value="2nd Installment">2nd Installment</option>
                    <option value="Final (Full Clearance)">Final (Full Clearance)</option>
                    <option value="Partial Payment">Partial Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amount Paid (₹) *</label>
                  <input type="number" required min="1" value={dueForm.amount} onChange={e => setDueForm({...dueForm, amount: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">UTR / Transaction ID *</label>
                <input type="text" required value={dueForm.transactionId} onChange={e => setDueForm({...dueForm, transactionId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. UPI123456789012" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                <button type="button" onClick={() => setIsDueModalOpen(false)} className="px-5 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer bg-transparent transition">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition cursor-pointer border-none shadow-md shadow-indigo-500/10 active:scale-[0.98]">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1726] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Register New Student</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add student details and payment info manually.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-transparent border-none cursor-pointer p-1">
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Student Name *</label>
                  <input type="text" required value={modalForm.name} onChange={e => setModalForm({...modalForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
                  <input type="email" required value={modalForm.email} onChange={e => setModalForm({...modalForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. john@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
                  <input type="tel" required value={modalForm.phone} onChange={e => setModalForm({...modalForm, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Course *</label>
                  <select value={modalForm.course} onChange={e => setModalForm({...modalForm, course: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500">
                    <option value="MERN Stack">MERN Stack Development</option>
                    <option value="Frontend Developer">Frontend Web Development</option>
                    <option value="UI/UX Design">UI/UX Design Course</option>
                    <option value="Python Data Science">Python Data Science</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">College / University</label>
                  <input type="text" value={modalForm.college} onChange={e => setModalForm({...modalForm, college: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. RGPV" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">City</label>
                  <input type="text" value={modalForm.city} onChange={e => setModalForm({...modalForm, city: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. Bhopal" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Referral Code (Optional)</label>
                <input type="text" value={modalForm.referralCode} onChange={e => setModalForm({...modalForm, referralCode: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. BEANGATE10" />
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 my-4 pt-4">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Payment Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Payment Status *</label>
                    <select value={modalForm.payStatus} onChange={e => {
                      const status = e.target.value;
                      let amt = "0";
                      if (status === "One-Time") amt = "6000";
                      else if (status === "1st Installment") amt = "3200";
                      setModalForm({...modalForm, payStatus: status, payAmount: amt});
                    }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500">
                      <option value="Unpaid">Unpaid / Deferred</option>
                      <option value="One-Time">Paid (One-Time Plan)</option>
                      <option value="1st Installment">Paid (1st Installment)</option>
                    </select>
                  </div>
                  
                  {modalForm.payStatus !== "Unpaid" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amount Paid (₹) *</label>
                      <input type="number" required value={modalForm.payAmount} onChange={e => setModalForm({...modalForm, payAmount: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" />
                    </div>
                  )}
                </div>

                {modalForm.payStatus !== "Unpaid" && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">UTR / Transaction ID *</label>
                    <input type="text" required value={modalForm.transactionId} onChange={e => setModalForm({...modalForm, transactionId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500" placeholder="e.g. UPI123456789012" />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer bg-transparent transition">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-xl transition cursor-pointer border-none shadow-md shadow-indigo-500/10 active:scale-[0.98]">Save Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteRegTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1726] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Registration?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to delete this student's registration? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteRegTarget(null)} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-sm cursor-pointer border-none"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition text-sm cursor-pointer border-none shadow-md shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Payment Confirmation Modal */}
      {deletePayTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1726] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Payment?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to delete this payment record? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletePayTarget(null)} 
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-sm cursor-pointer border-none"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePayment} 
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition text-sm cursor-pointer border-none shadow-md shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
