import React, { useState, useEffect } from "react";
import { FaLock, FaShieldAlt, FaTimes, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface OfferProps {
  selectedPlanId: string;
  setSelectedPlanId: (val: string) => void;
  appliedDiscount: boolean;
  setAppliedDiscount: (val: boolean) => void;
}

const Offer = ({
  selectedPlanId,
  setSelectedPlanId,
  appliedDiscount,
  setAppliedDiscount
}: OfferProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    course: "",
    college: "",
    city: "",
    plan: selectedPlanId,
  });

  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();

  const [courses, setCourses] = useState<string[]>(["Frontend Developer", "Backend Developer", "MERN Stack"]);
  const [colleges, setColleges] = useState<string[]>(["PDPS College", "BUIT", "Other"]);
  const [cities, setCities] = useState<string[]>(["Bhopal", "Indore", "Jabalpur", "Other"]);

  const [referralCode, setReferralCode] = useState(appliedDiscount ? "BEANGATE10" : "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(appliedDiscount ? "Referral code applied! 10% Discount saved." : "");

  const [cfg, setCfg] = useState<any>(() => {
    try {
      const s = localStorage.getItem("bg_plan_config");
      return s ? JSON.parse(s) : {
        courseName: "MERN Stack",
        oneTimePrice: 6000,
        oneTimeOriginalPrice: 15000,
        installment1Price: 3200,
        installment2Price: 3200,
        discountPercent: 10,
        totalSeats: 50,
        manualSeatsOffset: 32,
      };
    } catch {
      return {
        courseName: "MERN Stack",
        oneTimePrice: 6000,
        oneTimeOriginalPrice: 15000,
        installment1Price: 3200,
        installment2Price: 3200,
        discountPercent: 10,
        totalSeats: 50,
        manualSeatsOffset: 32,
      };
    }
  });

  useEffect(() => {
    const loadLocalConfig = () => {
      try {
        const s = localStorage.getItem("bg_plan_config");
        if (s) {
          const parsed = JSON.parse(s);
          setCfg(prev => ({ ...prev, ...parsed }));
          if (Array.isArray(parsed.courses) && parsed.courses.length > 0) setCourses(parsed.courses);
          if (Array.isArray(parsed.colleges) && parsed.colleges.length > 0) setColleges(parsed.colleges);
          if (Array.isArray(parsed.cities) && parsed.cities.length > 0) setCities(parsed.cities);
        }
      } catch (e) {}
    };

    const fetchConfig = () => {
      loadLocalConfig();
      fetch("/api/planconfig")
        .then((res) => {
          if (!res.ok) throw new Error("API failed");
          return res.json();
        })
        .then((data) => {
          if (data && data.oneTimePrice) {
            setCfg(prev => ({ ...prev, ...data }));
            try {
              const current = localStorage.getItem("bg_plan_config");
              const existing = current ? JSON.parse(current) : {};
              localStorage.setItem("bg_plan_config", JSON.stringify({ ...existing, ...data }));
            } catch (e) {}
            if (Array.isArray(data.courses) && data.courses.length > 0) setCourses(data.courses);
            if (Array.isArray(data.colleges) && data.colleges.length > 0) setColleges(data.colleges);
            if (Array.isArray(data.cities) && data.cities.length > 0) setCities(data.cities);
          }
        })
        .catch(() => {
          loadLocalConfig();
        });
    };

    fetchConfig();
    const handleStorage = () => fetchConfig();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("bg_config_updated", handleStorage);
    window.addEventListener("focus", handleStorage);

    const interval = setInterval(fetchConfig, 3000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("bg_config_updated", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
  }, []);

  // Sync selectedPlanId prop with formData state
  useEffect(() => {
    setFormData((prev) => ({ ...prev, plan: selectedPlanId }));
  }, [selectedPlanId]);

  const [appliedRefCodeObj, setAppliedRefCodeObj] = useState<any>(null);

  // Sync appliedDiscount prop with state messages
  useEffect(() => {
    if (appliedDiscount) {
      if (!referralCode) {
        setReferralCode("BEANGATE10");
      }
      const discVal = appliedRefCodeObj?.discountPercent || cfg.discountPercent || 10;
      setPromoSuccess(`Referral code applied! ${discVal}% Discount saved.`);
      setPromoError("");
    } else {
      setReferralCode("");
      setPromoSuccess("");
    }
  }, [appliedDiscount, cfg.discountPercent, appliedRefCodeObj]);

  const handleApplyReferral = async () => {
    let allRefCodes: any[] = [];
    try {
      const res = await fetch("/api/refcodes");
      if (res.ok) allRefCodes = await res.json();
    } catch {}

    if (!allRefCodes.length) {
      try {
        const stored = localStorage.getItem("bg_ref_codes");
        if (stored) allRefCodes = JSON.parse(stored);
      } catch {}
    }

    const inputCode = referralCode.trim().toUpperCase();
    const matched = allRefCodes.find((c: any) => c.code.trim().toUpperCase() === inputCode);

    if (matched) {
      if (!matched.active || (matched.uses || 0) > 0) {
        setPromoError("This referral code has already been used or is inactive.");
        setPromoSuccess("");
        setAppliedDiscount(false);
        setAppliedRefCodeObj(null);
        return;
      }
      setAppliedRefCodeObj(matched);
      setAppliedDiscount(true);
      const discVal = matched.discountPercent || parseInt(matched.discount) || 10;
      const planNotice = matched.applicablePlan === "one-time" ? " (Valid for One-Time Plan Only)" : matched.applicablePlan === "installment" ? " (Valid for Installment Plan Only)" : "";
      setPromoSuccess(`Referral code applied! ${discVal}% Discount saved.${planNotice}`);
      setPromoError("");
    } else {
      const isFallbackDefault = ["BEANGATE10", "REF10", "MERN10"].includes(inputCode);
      if (isFallbackDefault) {
        const defaultDisc = cfg.discountPercent || 10;
        setAppliedRefCodeObj({ code: inputCode, discountPercent: defaultDisc, applicablePlan: "all" });
        setAppliedDiscount(true);
        setPromoSuccess(`Referral code applied! ${defaultDisc}% Discount saved.`);
        setPromoError("");
      } else {
        setPromoError("Invalid referral code.");
        setPromoSuccess("");
        setAppliedDiscount(false);
        setAppliedRefCodeObj(null);
      }
    }
  };

  const handleRemoveReferral = () => {
    setAppliedDiscount(false);
    setReferralCode("");
    setPromoSuccess("");
    setPromoError("");
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rawRegistrations, setRawRegistrations] = useState<any[]>([]);

  // Dynamic Special Offer Countdown Timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      let targetTime: number;

      if ((cfg.offerTimerMode === "target_date" || (!cfg.offerTimerMode && cfg.offerTargetDate)) && cfg.offerTargetDate) {
        targetTime = new Date(cfg.offerTargetDate).getTime();
      } else if (cfg.offerTimerMode === "hours" && cfg.offerTimerHours) {
        const totalDurationMs = (cfg.offerTimerHours || 4) * 60 * 60 * 1000;
        const currentMs = now.getTime() % totalDurationMs;
        targetTime = now.getTime() + (totalDurationMs - currentMs);
      } else {
        // Default: End of current day (23:59:59)
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        targetTime = endOfDay.getTime();
      }

      const diff = targetTime - now.getTime();
      if (isNaN(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [cfg.offerTimerMode, cfg.offerTimerHours, cfg.offerTargetDate]);

  // Fetch Completed Registrations Count
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await fetch("/api/registrations");
        if (res.ok) {
          const data = await res.json();
          const registrationsArray = Array.isArray(data) ? data : [];
          setRawRegistrations(registrationsArray);
          localStorage.setItem("bg_registrations_cache", JSON.stringify(registrationsArray));
        } else {
          throw new Error("Failed to fetch");
        }
      } catch (err) {
        const stored = localStorage.getItem("bg_registrations_cache");
        if (stored) {
          try {
            setRawRegistrations(JSON.parse(stored) || []);
          } catch {
            setRawRegistrations([]);
          }
        }
      }
    };

    fetchRegistrations();
    const interval = setInterval(fetchRegistrations, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSeats = cfg.totalSeats ?? 50;
  const manualSeatsOffset = cfg.manualSeatsOffset ?? 32;
  const baseRegCount = cfg.manualSeatsOffsetRegistrationsCount ?? 0;

  const currentRegCount = rawRegistrations.length;
  // Calculate new registrations since the manual offset was last set/saved
  const newRegs = Math.max(0, currentRegCount - baseRegCount);

  const seatsLeft = Math.max(0, manualSeatsOffset - newRegs);

  // Progress bar represents seats filled (so it grows longer as more seats are taken)
  const seatsFilled = totalSeats - seatsLeft;
  const seatsPercentage = Math.min(100, Math.round((seatsFilled / totalSeats) * 100));

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [phoneErrorMsg, setPhoneErrorMsg] = useState("");
  const [emailErrorMsg, setEmailErrorMsg] = useState("");

  const checkIsPhoneRegistered = (inputPhone: string): boolean => {
    const cleanInput = inputPhone.replace(/[^0-9]/g, "");
    if (!cleanInput || cleanInput.length < 10) return false;
    const target10 = cleanInput.slice(-10);

    const existsInRaw = rawRegistrations.some((r: any) => {
      const p = String(r.phone || "").replace(/[^0-9]/g, "");
      return p.length >= 10 && p.slice(-10) === target10;
    });
    if (existsInRaw) return true;

    try {
      const stored = localStorage.getItem("bg_registrations");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const existsInLocal = list.some((r: any) => {
            const p = String(r.phone || "").replace(/[^0-9]/g, "");
            return p.length >= 10 && p.slice(-10) === target10;
          });
          if (existsInLocal) return true;
        }
      }
    } catch (e) {}

    return false;
  };

  const checkIsEmailRegistered = (inputEmail: string): boolean => {
    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail) return false;

    const existsInRaw = rawRegistrations.some((r: any) => {
      const e = String(r.email || "").trim().toLowerCase();
      return e === cleanEmail;
    });
    if (existsInRaw) return true;

    try {
      const stored = localStorage.getItem("bg_registrations");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const existsInLocal = list.some((r: any) => {
            const e = String(r.email || "").trim().toLowerCase();
            return e === cleanEmail;
          });
          if (existsInLocal) return true;
        }
      }
    } catch (e) {}

    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length <= 10) {
        setFormData({ ...formData, [name]: onlyNums });
      }
      if (onlyNums.length === 10 && checkIsPhoneRegistered(onlyNums)) {
        setPhoneErrorMsg("Yeh mobile number pehle se registered hai! Ek mobile number se dobara registration nahi kar sakte.");
        setErrors(prev => ({ ...prev, phone: true }));
      } else {
        setPhoneErrorMsg("");
        if (errors[name]) setErrors({ ...errors, [name]: false });
      }
      return;
    }

    if (name === "email") {
      const cleanEmail = value.trim().toLowerCase();
      setFormData({ ...formData, [name]: value });
      if (cleanEmail && checkIsEmailRegistered(cleanEmail)) {
        setEmailErrorMsg("Yeh email ID pehle se registered hai! Ek email ID se dobara registration nahi kar sakte.");
        setErrors(prev => ({ ...prev, email: true }));
      } else {
        setEmailErrorMsg("");
        if (errors[name]) setErrors({ ...errors, [name]: false });
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (errors[name]) setErrors({ ...errors, [name]: false });

    if (name === "plan") {
      setSelectedPlanId(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, boolean> = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      newErrors.phone = true;
      setPhoneErrorMsg("Mobile Number must be exactly 10 digits *");
    } else if (checkIsPhoneRegistered(formData.phone)) {
      newErrors.phone = true;
      setPhoneErrorMsg("Yeh mobile number pehle se registered hai! Ek mobile number se dobara registration nahi kar sakte.");
    }

    if (!formData.email.trim()) {
      newErrors.email = true;
      setEmailErrorMsg("Email address is required *");
    } else if (checkIsEmailRegistered(formData.email)) {
      newErrors.email = true;
      setEmailErrorMsg("Yeh email ID pehle se registered hai! Ek email ID se dobara registration nahi kar sakte.");
    }
    if (!formData.course) newErrors.course = true;
    if (!formData.college) newErrors.college = true;
    if (!formData.city) newErrors.city = true;
    if (!agreeTerms) {
      setTermsError(true);
      newErrors.terms = true;
    } else {
      setTermsError(false);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus("error");
      return;
    }

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
    const finalRefCode = appliedDiscount ? referralCode.trim().toUpperCase() : "";
    const regPayload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      course: formData.course,
      college: formData.college || "N/A",
      city: formData.city || "N/A",
      timestamp,
      referralCode: finalRefCode
    };

    try {
      fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regPayload)
      }).catch(err => console.warn("API registration post failed:", err));

      const storedRegs = localStorage.getItem("bg_registrations");
      const list = storedRegs ? JSON.parse(storedRegs) : [];
      const hasReg = list.some((r: any) => r.email === formData.email && r.phone === formData.phone);
      if (!hasReg) {
        localStorage.setItem("bg_registrations", JSON.stringify([regPayload, ...list]));
      }
      window.dispatchEvent(new Event("bg_registration_added"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    // Redirect to checkout carrying registration details
    navigate("/payment", {
      state: {
        registrationData: formData,
        planId: formData.plan,
        discountApplied: appliedDiscount,
        referralCode: finalRefCode,
        appliedCodeObj: appliedRefCodeObj
      }
    });
  };

  const codeDiscPct = appliedRefCodeObj?.discountPercent ?? (appliedRefCodeObj?.discount ? parseInt(appliedRefCodeObj.discount) : null);
  const oneTimeDiscPct = appliedRefCodeObj?.applicablePlan === "installment" ? 0 : (codeDiscPct !== null ? codeDiscPct : (cfg.oneTimeDiscountPercent ?? cfg.discountPercent ?? 10));
  const inst1DiscPct = appliedRefCodeObj?.applicablePlan === "one-time" ? 0 : (codeDiscPct !== null ? codeDiscPct : (cfg.installment1DiscountPercent ?? cfg.discountPercent ?? 10));
  const selectedDiscPct = formData.plan === 'inst-1' ? inst1DiscPct : oneTimeDiscPct;

  const basePrice = formData.plan === 'inst-1' ? cfg.installment1Price : cfg.oneTimePrice;
  const currentPrice = appliedDiscount ? Math.round(basePrice * (1 - selectedDiscPct / 100)) : basePrice;
  const saveAmount = cfg.oneTimeOriginalPrice - currentPrice;
  const savePercent = Math.round((saveAmount / cfg.oneTimeOriginalPrice) * 100);

  return (
    <section id="reviews" className="py-20 bg-gray-50 scroll-mt-24">
      <div className="max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 items-stretch">
          
          {/* LEFT: INFO & OFFERS (Matching the screenshot exactly with optimized spacing) */}
          <div className="flex-1 bg-gradient-to-br from-blue-950 via-cyan-950 to-[#0b111e] text-white px-6 py-10 md:px-10 md:py-12 flex flex-col justify-between relative overflow-hidden border-r border-white/5">
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              
              <div>
                {/* Header Title with confetti popper */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <h2 className="text-2xl font-extrabold text-white tracking-wider uppercase font-sans">
                    SPECIAL OFFER
                  </h2>
                  <span className="text-2xl">🎉</span>
                </div>

                {/* Price Details Card Container (White Box) */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl text-center">
                  <div className="grid grid-cols-2 items-center relative">
                    {/* Left Side */}
                    <div className="text-center">
                      <p className="text-gray-400 text-[11px] font-semibold tracking-wide uppercase mb-1">Actual Price</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-400 line-through">₹{cfg.oneTimeOriginalPrice.toLocaleString("en-IN")}</p>
                    </div>
                    {/* Divider */}
                    <div className="absolute left-1/2 top-1 bottom-1 w-[1px] bg-gray-200 -translate-x-1/2"></div>
                    {/* Right Side */}
                    <div className="text-center">
                      <p className="text-gray-900 text-[11px] font-extrabold tracking-wide uppercase mb-1">Today Only</p>
                      <p className="text-2xl sm:text-3xl font-black text-[#ff6600]">
                        ₹{currentPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Thin divider */}
                  <div className="w-full h-[1px] bg-gray-100 my-4"></div>
                  
                  {/* Savings Badge */}
                  <div className="inline-block bg-[#ffcc00] text-gray-950 text-[11px] font-extrabold px-6 py-2 rounded-full tracking-wide">
                    You Save ₹{saveAmount.toLocaleString()} ({savePercent}% OFF)
                  </div>
                </div>

                {/* Timers block */}
                <div className={`grid ${timeLeft.days > 0 ? "grid-cols-4" : "grid-cols-3"} gap-2.5 sm:gap-3 mb-6`}>
                  {(timeLeft.days > 0
                    ? [
                        { label: "DAYS", val: timeLeft.days },
                        { label: "HOURS", val: timeLeft.hours },
                        { label: "MINUTES", val: timeLeft.minutes },
                        { label: "SECONDS", val: timeLeft.seconds },
                      ]
                    : [
                        { label: "HOURS", val: timeLeft.hours },
                        { label: "MINUTES", val: timeLeft.minutes },
                        { label: "SECONDS", val: timeLeft.seconds },
                      ]
                  ).map((t) => (
                    <div key={t.label} className="bg-white/[0.04] border border-white/10 rounded-2xl py-3.5 sm:py-4 px-1 text-center shadow-md">
                      <span className="block text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
                        {String(t.val).padStart(2, "0")}
                      </span>
                      <span className="block text-[8px] uppercase font-bold text-gray-400 mt-1.5 tracking-wider">{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* Hurry Alert Text */}
                <p className="text-center text-xs font-bold text-white mb-2 tracking-wide leading-relaxed">
                  Hurry! Offer ends soon. Limited Seats Available!
                </p>
              </div>

              {/* Batch Highlights & Included Benefits */}
              <div className="space-y-3 border-t border-white/10 pt-5 text-left">
                <p className="text-xs font-black uppercase tracking-wider text-orange-400">
                  What's Included in This Batch:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="text-[#ff6600] font-bold text-sm shrink-0 mt-0.5">📜</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">Dual Industry Certification</h4>
                      <p className="text-[11px] text-gray-300">Official Course Completion + IT Internship Credential by BeanGate IT Solutions Pvt. Ltd.</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="text-[#ff6600] font-bold text-sm shrink-0 mt-0.5">💻</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">Live Production Client Projects</h4>
                      <p className="text-[11px] text-gray-300">Build real-world full-stack MERN apps with Git, REST APIs, and Cloud Deployment.</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="text-[#ff6600] font-bold text-sm shrink-0 mt-0.5">🎯</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">1-on-1 Mentorship &amp; Placement Support</h4>
                      <p className="text-[11px] text-gray-300">Dedicated doubt resolution, resume building, mock interviews, and job referrals.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Rating & Security Trust Bar */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-left mt-2">
                <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="text-white text-[11px] ml-1">4.9/5 Rating</span>
                </div>
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                  BeanGate IT Solutions
                </span>
              </div>



            </div>
          </div>

          {/* RIGHT: REGISTER NOW FORM */}
          <div className="flex-1 p-8 md:p-12 text-left">
            <h3 className="text-2xl font-black text-gray-900 mb-2">REGISTER NOW</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Fill in your correct student credentials to proceed to secure batch payment and seat reservation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${errors.name ? 'text-red-500' : 'text-gray-700'}`}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none text-sm text-gray-900 transition-colors ${errors.name ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-1 focus:ring-orange-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${errors.phone ? 'text-red-500' : 'text-gray-700'}`}>Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="XXXXXXXXXX"
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none text-sm text-gray-900 transition-colors ${errors.phone ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-1 focus:ring-orange-500'}`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️ {phoneErrorMsg || "Mobile Number must be exactly 10 digits *"}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${errors.email ? 'text-red-500' : 'text-gray-700'}`}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none text-sm text-gray-900 transition-colors ${errors.email ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-1 focus:ring-orange-500'}`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️ {emailErrorMsg || "Valid Email Address is required *"}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${errors.course ? 'text-red-500' : 'text-gray-700'}`}>Select Course *</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none text-sm text-gray-900 transition-colors ${errors.course ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-1 focus:ring-orange-500'}`}
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${errors.college ? 'text-red-500' : 'text-gray-700'}`}>College / University *</label>
                  <input
                    type="text"
                    name="college"
                    list="college-list"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="Enter your College / University"
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none text-sm text-gray-900 transition-colors ${errors.college ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-1 focus:ring-orange-500'}`}
                  />
                  <datalist id="college-list">
                    {colleges.filter(c => c !== "Other").map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${errors.city ? 'text-red-500' : 'text-gray-700'}`}>City *</label>
                  <input
                    type="text"
                    name="city"
                    list="city-list"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your City"
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none text-sm text-gray-900 transition-colors ${errors.city ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-1 focus:ring-orange-500'}`}
                  />
                  <datalist id="city-list">
                    {cities.filter(c => c !== "Other").map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Payment Plan</label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none"
                >
                  <option value="one-time">One-Time Payment Plan ({appliedDiscount ? `₹${Math.round(cfg.oneTimePrice * (1 - oneTimeDiscPct / 100)).toLocaleString("en-IN")}` : `₹${cfg.oneTimePrice.toLocaleString("en-IN")}`})</option>
                  <option value="inst-1">Flexible Installment Plan ({appliedDiscount ? `₹${Math.round(cfg.installment1Price * (1 - inst1DiscPct / 100)).toLocaleString("en-IN")}` : `₹${cfg.installment1Price.toLocaleString("en-IN")}`})</option>
                </select>
              </div>

              {/* Referral Code Field */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                  Referral Code (Optional) - Save Extra Instantly
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter referral code (e.g. BEANGATE10)"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toUpperCase());
                      setPromoError("");
                    }}
                    disabled={appliedDiscount}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none text-xs focus:border-orange-500/40 transition duration-300"
                  />
                  {appliedDiscount ? (
                    <button
                      type="button"
                      onClick={handleRemoveReferral}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyReferral}
                      disabled={!referralCode}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 text-white text-xs font-black rounded-xl transition shrink-0 cursor-pointer border-none"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {promoError && (
                  <p className="text-red-400 text-[10px] mt-1 font-bold">{promoError}</p>
                )}
                {promoSuccess && (
                  <p className="text-green-600 text-[10px] mt-1 font-bold">{promoSuccess}</p>
                )}
              </div>
              
              {/* Terms & Conditions Section */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <FaShieldAlt className="text-orange-500 text-xs" /> Terms &amp; Conditions &amp; Course Policies
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[11px] text-orange-600 hover:underline font-bold cursor-pointer bg-transparent border-none"
                  >
                    View Full Terms
                  </button>
                </div>

                {/* Scrollable Terms List */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-36 overflow-y-auto text-[11px] text-gray-600 space-y-2 font-medium leading-relaxed shadow-inner">
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>100% Job Assistance will be provided to eligible students; however, it does not guarantee employment.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>Course fees are non-refundable and non-transferable after registration.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>Students must maintain a minimum of 90% attendance to be eligible for the Course Completion Certificate.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>The Course Completion Certificate will be issued by BeanGate IT Solutions Private Limited upon successful completion of the course requirements.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>Certificate issuance is subject to meeting the required attendance, assignments, projects, and course completion criteria.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span><strong>Internship Opportunity:</strong> After successful completion of the course, students who demonstrate the required technical skills, performance, and ability to contribute to live projects may be selected by BeanGate IT Solutions Private Limited for a 3-month internship. Internship selection will be based solely on the company's evaluation and requirements and is not guaranteed for every student.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>Students are expected to maintain professional and respectful behavior with trainers and other team members/developers. In case of misconduct or violation of professional standards, BeanGate IT Solutions Private Limited reserves the right to discontinue the student's classes/course participation without refund of the course fee.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>Job assistance will be provided based on the student's skills, performance, and eligibility.</span>
                  </p>
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (e.target.checked) setTermsError(false);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-800 leading-tight">
                    I have read and agree to all the <span className="text-orange-600 font-bold">Terms &amp; Conditions</span> and policies *
                  </span>
                </label>

                {termsError && (
                  <p className="text-red-500 text-xs font-bold pt-1">
                    ⚠️ Please check and agree to the Terms &amp; Conditions before proceeding.
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary-orange text-white py-3.5 rounded-xl font-extrabold hover:bg-orange-600 transition shadow-md shadow-orange-500/10 cursor-pointer"
              >
                PROCEED TO PAYMENT &amp; REGISTER →
              </button>
        
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mt-2 font-medium">
                <FaLock className="text-green-500 shrink-0 text-xs" /> Your details are safe with us. We will never share your data.
              </p>
            </form>
          </div>
          
        </div>
      </div>

      {/* FULL TERMS MODAL LIGHTBOX */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] p-6 sm:p-8 shadow-2xl flex flex-col justify-between border border-gray-200 text-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-red-500 hover:text-white transition duration-200 cursor-pointer border-none shadow-md"
            >
              <FaTimes size={16} />
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <FaShieldAlt className="text-orange-500" /> Terms &amp; Conditions and Course Policies
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                BeanGate IT Solutions Private Limited — Student Agreement
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 overflow-y-auto max-h-[55vh] text-xs text-gray-700 space-y-3 font-medium leading-relaxed my-2">
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>1. Job Assistance:</strong> 100% Job Assistance will be provided to eligible students; however, it does not guarantee employment.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>2. Refund Policy:</strong> Course fees are non-refundable and non-transferable after registration.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>3. Attendance Requirement:</strong> Students must maintain a minimum of 90% attendance to be eligible for the Course Completion Certificate.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>4. Certificate Authority:</strong> The Course Completion Certificate will be issued by BeanGate IT Solutions Private Limited upon successful completion of the course requirements.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>5. Certificate Criteria:</strong> Certificate issuance is subject to meeting the required attendance, assignments, projects, and course completion criteria.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>6. Internship Opportunity:</strong> After successful completion of the course, students who demonstrate the required technical skills, performance, and ability to contribute to live projects may be selected by BeanGate IT Solutions Private Limited for a 3-month internship. Internship selection will be based solely on the company's evaluation and requirements and is not guaranteed for every student.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>7. Code of Conduct:</strong> Students are expected to maintain professional and respectful behavior with trainers and other team members/developers. In case of misconduct or violation of professional standards, BeanGate IT Solutions Private Limited reserves the right to discontinue the student's classes/course participation without refund of the course fee.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span><strong>8. Eligibility:</strong> Job assistance will be provided based on the student's skills, performance, and eligibility.</span>
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <FaCheckCircle /> Official BeanGate Policy Document
              </span>
              <button
                onClick={() => {
                  setAgreeTerms(true);
                  setTermsError(false);
                  setShowTermsModal(false);
                }}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none transition shadow-md"
              >
                I Agree &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Offer;
