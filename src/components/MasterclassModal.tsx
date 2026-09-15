import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaCalendarAlt,
  FaLaptop,
  FaBullhorn,
  FaArrowRight,
  FaPlayCircle,
  FaCheckCircle,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaGraduationCap,
  FaCity,
  FaBriefcase,
} from "react-icons/fa";
import { SiMongodb, SiExpress, SiReact, SiNodedotjs } from "react-icons/si";
import logo from "../assets/logo-beangate.png";

interface MasterclassModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const MasterclassModal: React.FC<MasterclassModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [batchStartDate, setBatchStartDate] = useState<string>("22 September 2026");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    city: "",
    experience: "College Student (CS/IT)",
  });
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    // Auto show modal after 700ms when page opens
    const timer = setTimeout(() => {
      setInternalIsOpen(true);
    }, 700);

    // Fetch batchStartDate from planconfig API / localStorage
    try {
      const s = localStorage.getItem("bg_plan_config");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.batchStartDate) setBatchStartDate(parsed.batchStartDate);
      }
    } catch (e) {}

    fetch("/api/planconfig")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.batchStartDate) {
          setBatchStartDate(data.batchStartDate);
        }
      })
      .catch(() => {});

    return () => clearTimeout(timer);
  }, []);

  const showModal = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    setInternalIsOpen(false);
    setShowForm(false);
    setSubmitted(false);
    setErrorMsg("");
    if (externalOnClose) externalOnClose();
  };

  const handleJoinClick = () => {
    setShowForm(true);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMsg("Please fill in your Name, Email, and Mobile number.");
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newReg = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: cleanPhone,
      college: formData.college.trim() || "N/A",
      city: formData.city.trim() || "N/A",
      experience: formData.experience,
      timestamp,
    };

    // 1. Store in localStorage
    try {
      const storedStr = localStorage.getItem("bg_masterclass_regs") || "[]";
      const stored: any[] = JSON.parse(storedStr);
      const updated = [newReg, ...stored];
      localStorage.setItem("bg_masterclass_regs", JSON.stringify(updated));
      window.dispatchEvent(new Event("bg_masterclass_added"));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Local storage error:", err);
    }

    // 2. Post to API backend
    try {
      await fetch("/api/masterclass-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReg),
      });
    } catch (err) {
      console.warn("API Masterclass registration save failed, saved locally:", err);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative max-w-[720px] w-full max-h-[90vh] flex flex-col bg-gradient-to-b from-[#061838] via-[#040e24] to-[#020713] border border-blue-500/40 rounded-3xl shadow-[0_0_90px_rgba(0,0,0,0.9)] text-white my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow Orbs */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* FIXED PINNED CLOSE BUTTON (X) */}
            <button
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 z-[100] flex h-9 w-9 items-center justify-center rounded-full bg-[#091b38] text-gray-200 border border-white/25 hover:bg-red-500 hover:text-white transition duration-200 cursor-pointer shadow-xl"
              title="Close Banner"
            >
              <FaTimes size={15} />
            </button>

            {/* Scrollable Container */}
            <div className="overflow-y-auto p-4 sm:p-7 space-y-4">
              
              {/* Header Logo */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="Bean Gate Logo" className="h-9 sm:h-11 w-auto object-contain" />
                  <div>
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-sky-400 block uppercase">
                      Bean Gate IT Solutions
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold block">Working To make it different</span>
                  </div>
                </div>
                <div className="text-right pr-9 sm:pr-10">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Learn • Build • Succeed</span>
                </div>
              </div>

              {!showForm ? (
                /* ── BANNER VIEW ── */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-8 text-left space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        <span className="text-[10px] sm:text-xs font-black text-sky-300 uppercase tracking-wider">
                          MERN STACK DEVELOPMENT COURSE
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                        BATCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300">STARTS SOON!</span>
                      </h2>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-200">
                        <span>Your MERN journey begins with our</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[11px] font-black uppercase shadow-md border border-blue-400/40">
                          <FaPlayCircle className="text-orange-400 text-xs animate-pulse" /> LIVE MASTERCLASS
                        </span>
                      </div>

                      <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed font-medium">
                        Join our first session to get a complete overview of the course, learning process, real-world projects and career opportunities.
                      </p>
                    </div>

                    <div className="sm:col-span-4 flex justify-center">
                      <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                        <div className="absolute bottom-2 w-32 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-40 rounded-full blur-xl animate-pulse" />
                        <div className="absolute bottom-3 w-32 h-8 bg-gradient-to-b from-[#0b2854] to-[#041026] border border-sky-400/50 rounded-[100%] shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center justify-center">
                          <span className="text-[9px] font-black tracking-[0.3em] text-sky-300 uppercase">
                            M E R N
                          </span>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-2 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0c2847] to-[#061426] border border-emerald-500/50 shadow-lg flex items-center justify-center text-emerald-400 text-xl hover:scale-110 transition duration-300">
                            <SiMongodb title="MongoDB" />
                          </div>
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0c2847] to-[#061426] border border-gray-400/50 shadow-lg flex items-center justify-center text-gray-200 text-base font-black hover:scale-110 transition duration-300">
                            <SiExpress title="Express.js" />
                          </div>
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0c2847] to-[#061426] border border-sky-400/50 shadow-lg flex items-center justify-center text-sky-400 text-xl animate-spin-slow hover:scale-110 transition duration-300">
                            <SiReact title="React.js" />
                          </div>
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0c2847] to-[#061426] border border-green-500/50 shadow-lg flex items-center justify-center text-green-400 text-xl hover:scale-110 transition duration-300">
                            <SiNodedotjs title="Node.js" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white text-gray-900 rounded-2xl p-3 sm:p-4 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-3 border border-blue-200/60 mb-3.5">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-sm">
                        <FaCalendarAlt className="text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                          Batch Starts
                        </p>
                        <h4 className="text-sm sm:text-base font-black text-gray-900 leading-tight">
                          {batchStartDate}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50 border border-sky-200/80">
                      <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 border border-sky-400 shadow-md">
                        <FaLaptop className="text-xl" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                          Mode
                        </p>
                        <h4 className="text-sm sm:text-base font-black text-sky-950 leading-tight">
                          Online (Live Interactive)
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a2347]/90 border border-sky-400/30 rounded-xl p-3 text-left flex items-start gap-3 shadow-inner mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 text-orange-400 mt-0.5">
                      <FaBullhorn className="text-sm" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                        This is NOT the regular class.
                      </h4>
                      <p className="text-[11px] text-sky-200 leading-relaxed font-medium mt-0.5">
                        The first session will be a complete Masterclass where we'll explain the entire course, roadmap, projects, and career guidance in detail.
                      </p>
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <button
                      onClick={handleJoinClick}
                      className="w-full max-w-lg mx-auto py-3 px-5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_25px_rgba(255,85,0,0.4)] transition-all duration-300 transform hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
                    >
                      <span>Join the Masterclass & Know What You'll Build!</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2.5 text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 pt-1.5 border-t border-white/10">
                    <span className="w-5 h-[1px] bg-gradient-to-r from-transparent to-sky-400" />
                    <span>INNOVATE • DEVELOP • DELIVER</span>
                    <span className="w-5 h-[1px] bg-gradient-to-l from-transparent to-sky-400" />
                  </div>
                </>
              ) : submitted ? (
                /* ── SUCCESS CONFIRMATION VIEW ── */
                <div className="py-8 px-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400 text-3xl animate-bounce">
                    <FaCheckCircle />
                  </div>
                  <h3 className="text-2xl font-black text-white">Seat Successfully Reserved! 🎉</h3>
                  <p className="text-sm text-sky-200 max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-bold text-amber-400">{formData.name}</span>! You are successfully registered for our Live MERN Masterclass on <span className="font-bold text-white">{batchStartDate}</span>.
                  </p>
                  <div className="bg-[#0c234a] border border-sky-400/30 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-gray-400 font-bold uppercase">Name</span>
                      <span className="text-white font-bold">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-gray-400 font-bold uppercase">Email</span>
                      <span className="text-white font-bold">{formData.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-gray-400 font-bold uppercase">Mobile</span>
                      <span className="text-white font-bold">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold uppercase">Session Date</span>
                      <span className="text-amber-400 font-bold">{batchStartDate}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleClose}
                      className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg transition duration-200 cursor-pointer border-none"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : (
                /* ── MASTERCLASS REGISTRATION FORM ── */
                <div className="text-left space-y-4 pt-1">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <FaPlayCircle className="text-amber-400" />
                        Masterclass Registration
                      </h3>
                      <p className="text-xs text-sky-200 mt-1 font-medium">
                        Fill in your details below to reserve your seat for the <span className="text-amber-400 font-bold">Live MERN Masterclass ({batchStartDate})</span>.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-xs text-sky-300 hover:text-white underline cursor-pointer bg-transparent border-none"
                    >
                      ← Back
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FaUser className="text-sky-400 text-xs" /> Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#091f42] border border-sky-400/30 rounded-xl text-white text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FaEnvelope className="text-sky-400 text-xs" /> Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. rahul@gmail.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#091f42] border border-sky-400/30 rounded-xl text-white text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FaPhoneAlt className="text-sky-400 text-xs" /> Mobile / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10 digit mobile number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#091f42] border border-sky-400/30 rounded-xl text-white text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FaGraduationCap className="text-sky-400 text-xs" /> College / Institution
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BUIT / LNCT Bhopal"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#091f42] border border-sky-400/30 rounded-xl text-white text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FaCity className="text-sky-400 text-xs" /> City
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Bhopal / Indore"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#091f42] border border-sky-400/30 rounded-xl text-white text-xs sm:text-sm placeholder-gray-400 outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FaBriefcase className="text-sky-400 text-xs" /> Current Status
                        </label>
                        <select
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          className="w-full px-3 py-2.5 bg-[#091f42] border border-sky-400/30 rounded-xl text-white text-xs sm:text-sm outline-none focus:border-amber-400 transition cursor-pointer"
                        >
                          <option value="College Student (CS/IT)" className="bg-[#091f42] text-white">College Student (CS/IT)</option>
                          <option value="College Student (Non-CS)" className="bg-[#091f42] text-white">College Student (Non-CS)</option>
                          <option value="Job Seeker / Fresher" className="bg-[#091f42] text-white">Job Seeker / Fresher</option>
                          <option value="Working Professional" className="bg-[#091f42] text-white">Working Professional</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 text-center">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition duration-200 cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submitting ? (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                        ) : (
                          <>
                            <span>Register for Live Masterclass</span>
                            <FaArrowRight className="text-xs" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MasterclassModal;
