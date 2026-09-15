import { FaQrcode } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import qr from "../assets/qr-beangate.png";
import {
  FaCopy,
} from "react-icons/fa";

declare const SpreadsheetApp: any;
declare const ContentService: any;

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedPlanId = location.state?.planId || "one-time";
  const initialDiscountApplied = location.state?.discountApplied || false;
  const initialReferralCode = location.state?.referralCode || (initialDiscountApplied ? "BEANGATE10" : "");
  const initialAppliedCodeObj = location.state?.appliedCodeObj || null;

  const [discountAppliedState, setDiscountAppliedState] = useState(initialDiscountApplied);
  const [promoCode, setPromoCode] = useState(initialReferralCode);
  const [appliedRefCodeObj, setAppliedRefCodeObj] = useState<any>(initialAppliedCodeObj);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const [cfg, setCfg] = useState<any>(() => {
    try {
      const s = localStorage.getItem("bg_plan_config");
      return s ? JSON.parse(s) : {
        courseName: "MERN Stack",
        oneTimePrice: 6000,
        installment1Price: 3200,
        installment2Price: 3200,
        discountPercent: 10,
        oneTimeDiscountPercent: 10,
        installment1DiscountPercent: 10,
        installment2DiscountPercent: 10,
      };
    } catch {
      return {
        courseName: "MERN Stack",
        oneTimePrice: 6000,
        installment1Price: 3200,
        installment2Price: 3200,
        discountPercent: 10,
        oneTimeDiscountPercent: 10,
        installment1DiscountPercent: 10,
        installment2DiscountPercent: 10,
      };
    }
  });

  // Fetch plan config and resolve initial referral code
  useEffect(() => {
    const fetchConfig = () => {
      fetch("/api/planconfig")
        .then(res => res.json())
        .then(data => {
          if (data && data.oneTimePrice) {
            setCfg(data);
            localStorage.setItem("bg_plan_config", JSON.stringify(data));
          }
        })
        .catch(err => {
          console.warn("Failed to load planconfig from DB, trying local storage:", err);
          try {
            const s = localStorage.getItem("bg_plan_config");
            if (s) setCfg(JSON.parse(s));
          } catch (e) {
            console.error(e);
          }
        });
    };

    const fetchInitialCode = async () => {
      if (!initialReferralCode) return;
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

      const inputCode = initialReferralCode.trim().toUpperCase();
      const matched = allRefCodes.find((c: any) => c.code.trim().toUpperCase() === inputCode);
      if (matched && matched.active && (matched.uses || 0) === 0) {
        setAppliedRefCodeObj(matched);
        setDiscountAppliedState(true);
        const discVal = matched.discountPercent || parseInt(matched.discount) || 10;
        setPromoSuccess(`Referral code applied! ${discVal}% Discount saved.`);
      } else {
        const defaultDisc = cfg.discountPercent || 10;
        setAppliedRefCodeObj({ code: inputCode, discountPercent: defaultDisc, applicablePlan: "all" });
        setDiscountAppliedState(true);
        setPromoSuccess(`Referral code applied! ${defaultDisc}% Discount saved.`);
      }
    };

    fetchConfig();
    fetchInitialCode();
    const interval = setInterval(fetchConfig, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyPromoCode = async () => {
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

    const inputCode = promoCode.trim().toUpperCase();
    const matched = allRefCodes.find((c: any) => c.code.trim().toUpperCase() === inputCode);

    if (matched) {
      if (!matched.active || (matched.uses || 0) > 0) {
        setPromoError("This referral code has already been used or is inactive.");
        setPromoSuccess("");
        setDiscountAppliedState(false);
        setAppliedRefCodeObj(null);
        return;
      }
      setAppliedRefCodeObj(matched);
      setDiscountAppliedState(true);
      const discVal = matched.discountPercent || parseInt(matched.discount) || 10;
      const planNotice = matched.applicablePlan === "one-time" ? " (Valid for One-Time Plan Only)" : matched.applicablePlan === "installment" ? " (Valid for Installment Plan Only)" : "";
      setPromoSuccess(`Referral code applied! ${discVal}% Discount saved.${planNotice}`);
      setPromoError("");
    } else {
      const isFallbackDefault = ["BEANGATE10", "REF10", "MERN10"].includes(inputCode);
      if (isFallbackDefault) {
        const defaultDisc = cfg.discountPercent || 10;
        setAppliedRefCodeObj({ code: inputCode, discountPercent: defaultDisc, applicablePlan: "all" });
        setDiscountAppliedState(true);
        setPromoSuccess(`Referral code applied! ${defaultDisc}% Discount saved.`);
        setPromoError("");
      } else {
        setPromoError("Invalid referral code.");
        setPromoSuccess("");
        setDiscountAppliedState(false);
        setAppliedRefCodeObj(null);
      }
    }
  };

  const codeDiscPct = appliedRefCodeObj?.discountPercent ?? (appliedRefCodeObj?.discount ? parseInt(appliedRefCodeObj.discount) : null);

  const oneTimeDiscPct = appliedRefCodeObj?.applicablePlan === "installment"
    ? 0
    : (codeDiscPct !== null ? codeDiscPct : (cfg.oneTimeDiscountPercent ?? cfg.discountPercent ?? 10));

  const inst1DiscPct = appliedRefCodeObj?.applicablePlan === "one-time"
    ? 0
    : (codeDiscPct !== null ? codeDiscPct : (cfg.installment1DiscountPercent ?? cfg.discountPercent ?? 10));

  const inst2DiscPct = appliedRefCodeObj?.applicablePlan === "one-time"
    ? 0
    : (codeDiscPct !== null ? codeDiscPct : (cfg.installment2DiscountPercent ?? cfg.discountPercent ?? 10));

  const paymentPlans = [
    {
      id: "one-time",
      title: discountAppliedState ? `${cfg.courseName} - One-Time (${oneTimeDiscPct}% Code Applied)` : `${cfg.courseName} - One-Time Payment`,
      basePrice: discountAppliedState ? Math.round(cfg.oneTimePrice * (1 - oneTimeDiscPct / 100)) : cfg.oneTimePrice,
      description: discountAppliedState ? `Special discounted price (${oneTimeDiscPct}% OFF applied)` : "Pay full course fee once and save extra",
      tag: discountAppliedState ? "Promo Applied" : "Best Value"
    },
    {
      id: "inst-1",
      title: discountAppliedState ? `${cfg.courseName} - 1st Installment (${inst1DiscPct}% OFF)` : `${cfg.courseName} - 1st Installment`,
      basePrice: discountAppliedState ? Math.round(cfg.installment1Price * (1 - inst1DiscPct / 100)) : cfg.installment1Price,
      description: discountAppliedState ? `First installment (${inst1DiscPct}% OFF applied)` : "First installment to start the course",
      tag: "Flexible"
    },
    {
      id: "inst-2",
      title: discountAppliedState ? `${cfg.courseName} - 2nd Installment (${inst2DiscPct}% OFF)` : `${cfg.courseName} - 2nd Installment`,
      basePrice: discountAppliedState ? Math.round(cfg.installment2Price * (1 - inst2DiscPct / 100)) : cfg.installment2Price,
      description: discountAppliedState ? `Second installment (${inst2DiscPct}% OFF applied)` : "Second installment during the course",
      tag: "Flexible"
    }
  ];

  const [selectedPlanId, setSelectedPlanId] = useState(preSelectedPlanId);
  const selectedPlan = paymentPlans.find((p) => p.id === selectedPlanId) || paymentPlans[0];

  const originalPlanPrice = selectedPlanId === "one-time" 
    ? cfg.oneTimePrice 
    : selectedPlanId === "inst-2" 
      ? cfg.installment2Price 
      : cfg.installment1Price;

  const activeDiscountPct = selectedPlanId === "one-time" 
    ? oneTimeDiscPct 
    : selectedPlanId === "inst-2" 
      ? inst2DiscPct 
      : inst1DiscPct;

  const discountSavedAmount = discountAppliedState ? Math.max(0, originalPlanPrice - selectedPlan.basePrice) : 0;
  const gstAmount = Math.round(selectedPlan.basePrice * 0.18);
  const totalAmount = selectedPlan.basePrice + gstAmount;

  const basePriceStr = `₹${selectedPlan.basePrice.toLocaleString("en-IN")}`;
  const gstAmountStr = `₹${gstAmount.toLocaleString("en-IN")}`;
  const totalAmountStr = `₹${totalAmount.toLocaleString("en-IN")}`;

  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [copied, setCopied] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState("UTR");

  // ✅ COPY FUNCTION
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);

    setTimeout(() => {
      setCopied(null);
    }, 1500);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validation
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.transactionId.trim() ||
      !formData.course
    ) {
      alert("Please fill in all required fields, including Course and Transaction/UTR ID.");
      return;
    }

    if (transactionType === "UTR" && formData.transactionId.length !== 12) {
      alert("UTR ID must be exactly 12 digits. Please check and try again.");
      return;
    }

    if (transactionType === "Transaction ID" && formData.transactionId.length < 10) {
      alert("Transaction ID must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
      const finalRefCode = discountAppliedState ? promoCode.trim().toUpperCase() : "";

      const regDataObj = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        course: formData.course,
        college: formData.college || "N/A",
        city: formData.city || "N/A",
        timestamp,
        referralCode: finalRefCode
      };

      const payDataObj = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        transactionId: formData.transactionId,
        course: formData.course,
        planTitle: selectedPlan.title,
        planAmount: totalAmountStr,
        timestamp,
        referralCode: finalRefCode
      };

      // 1. Save locally in localStorage for Admin Panel immediately for zero delay
      try {
        const storedRegs = localStorage.getItem("bg_registrations");
        const registrationsList = storedRegs ? JSON.parse(storedRegs) : [];
        const hasReg = registrationsList.some((r: any) => r.email === formData.email && r.phone === formData.phone);
        if (!hasReg) {
          localStorage.setItem("bg_registrations", JSON.stringify([regDataObj, ...registrationsList]));
        }

        const storedPays = localStorage.getItem("bg_payments");
        const paymentsList = storedPays ? JSON.parse(storedPays) : [];
        const hasPay = paymentsList.some((p: any) => p.transactionId === formData.transactionId);
        if (!hasPay) {
          localStorage.setItem("bg_payments", JSON.stringify([payDataObj, ...paymentsList]));
        }

        window.dispatchEvent(new Event("bg_registration_added"));
        window.dispatchEvent(new Event("bg_payment_added"));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error("Error saving data locally:", e);
      }

      // 2. Submit Registration & Payment Data to Backend API
      try {
        await fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regDataObj),
        });

        await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payDataObj),
        });
      } catch (backendError) {
        console.warn("Backend API call failed, saved locally fallback:", backendError);
      }

      // 4. Update referral code uses count if active (Local fallback)
      if (finalRefCode) {
        try {
          const storedCodes = localStorage.getItem("bg_ref_codes");
          if (storedCodes) {
            const codesList = JSON.parse(storedCodes);
            const updated = codesList.map((c: any) => {
              if (c.code.trim().toUpperCase() === finalRefCode) {
                return { ...c, uses: (c.uses || 0) + 1, active: false };
              }
              return c;
            });
            localStorage.setItem("bg_ref_codes", JSON.stringify(updated));
          }
        } catch (e) { console.error("Error updating ref code locally", e); }
      }

      // Save data for Receipt Modal
      setReceiptData({
        name: formData.name,
        course: formData.course,
        transactionId: formData.transactionId,
        planTitle: selectedPlan.title,
        total: totalAmountStr
      });

      // Form Clear
      setFormData({
        name: "",
        email: "",
        phone: "",
        course: "",
        college: "",
        city: "",
        transactionId: "",
        upiId: "",
      });

      // Success Modal Open
      setShowSuccess(true);
    } catch (err) {
      console.error("Error during submission:", err);
      alert("Submission failed. Please check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const registrationData = location.state?.registrationData || {};
  const hasRegistrationData = !!registrationData.name;

  const [formData, setFormData] = useState({
    name: registrationData.name || "",
    email: registrationData.email || "",
    phone: registrationData.phone || "",
    course: registrationData.course || "",
    college: registrationData.college || "",
    city: registrationData.city || "",
    transactionId: "",
    upiId: "",
  });

  const bankData = [
    { label: "Account Holder", value: "BEANGATE IT SOLUTIONS PVT. LTD." },
    { label: "Bank Name", value: "IDFC FIRST BANK" },
    { label: "Account Number", value: "10126070211" },
    { label: "IFSC Code", value: "IDFB0041382" },
    { label: "Branch Code", value: "41382" },
    { label: "Branch", value: "BHOPAL ARERA COLONY" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background radial glows - Soft light mode colors */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/[0.04] rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-[1250px] mx-auto relative z-10">
        
        {/* Back Link */}
        <div className="mb-10 text-left">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-orange-600 transition-colors duration-300 group bg-transparent border-none cursor-pointer"
          >
            <span className="transform group-hover:-translate-x-1.5 transition-transform duration-300 font-extrabold">←</span> Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight leading-none text-slate-950">
            Secure Payment{" "}
            <span className="bg-gradient-to-r from-violet-700 via-fuchsia-700 to-orange-600 text-transparent bg-clip-text">
              &amp; Checkout
            </span>
          </h1>
          <p className="text-slate-700 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-bold">
            Please complete your payment by scanning the QR code or using direct bank transfer, then submit your receipt verification code below.
          </p>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Plan Info & QR Code */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Selected Plan Details Card */}
            <div className="bg-white border border-slate-200 hover:border-violet-400 transition-all duration-500 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-slate-100/50 text-left">
              {/* Premium Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500"></div>
              
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-violet-100 text-violet-700 border border-violet-200 inline-block mb-4">
                Active Selection
              </span>
              <h3 className="text-lg font-black text-slate-950 mb-1.5 leading-snug">{selectedPlan.title}</h3>
              <p className="text-xs text-slate-600 mb-6 font-bold leading-relaxed">{selectedPlan.description}</p>
              
              <div className="space-y-2.5 border-t border-slate-200 pt-4">
                {discountAppliedState ? (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-bold">Original Course Fee:</span>
                      <span className="text-slate-400 line-through font-semibold">₹{originalPlanPrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                      <span>Referral Discount ({activeDiscountPct}% OFF):</span>
                      <span>-₹{discountSavedAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-extrabold">Discounted Fee:</span>
                      <span className="text-slate-900 font-black">₹{selectedPlan.basePrice.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-bold">Course Fee (Base Price):</span>
                    <span className="text-slate-800 font-extrabold">₹{selectedPlan.basePrice.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold">GST (18% on {discountAppliedState ? "Discounted Fee" : "Fee"}):</span>
                  <span className="text-slate-800 font-extrabold">{gstAmountStr}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2.5">
                  <span className="text-xs text-slate-700 uppercase tracking-widest font-black">Total Payable:</span>
                  <span className="text-2xl font-black text-[#ff5500] tracking-tight">
                    {totalAmountStr}
                  </span>
                </div>
              </div>
            </div>

            {/* UPI QR Payment Card */}
            <div className="bg-white border border-slate-200 hover:border-violet-400 transition-all duration-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-100/50">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200 inline-block mb-6">
                Instant UPI Scan
              </span>
              <div className="bg-white p-3 rounded-2xl flex justify-center shadow-md mb-6 border border-slate-200">
                <img
                  src={qr}
                  alt="UPI QR Code"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                />
              </div>
              <p className="text-xs font-black text-slate-950 mb-1">Scan QR via GooglePay, PhonePe, or Paytm</p>
              <p className="text-[10px] text-slate-500 font-extrabold">100% secure payment confirmations</p>
            </div>
            
          </div>

          {/* Right Column: Bank Account Details & Submit Form */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Bank Transfer Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-100/50">
              <h3 className="text-xs font-black text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-left">
                🏦 Net Banking Transfer Account
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {bankData.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-slate-50/85 border border-slate-200 p-3 rounded-2xl hover:border-slate-300 hover:bg-slate-100 transition duration-300"
                  >
                    <div className="text-left overflow-hidden">
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5 font-bold">{item.label}</p>
                      <p className="text-xs font-extrabold text-slate-900 truncate">{item.value}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => handleCopy(item.value)}
                        className="text-slate-500 hover:text-orange-600 transition p-1.5 hover:bg-slate-200 rounded-lg border-none bg-transparent cursor-pointer"
                        title="Copy details"
                      >
                        <FaCopy className="text-[10px]" />
                      </button>
                      {copied === item.value && (
                        <span className="text-[8px] text-emerald-600 font-black uppercase tracking-wider">Copied</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration & Payment Submit Form Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-100/50 text-left relative overflow-hidden">
              <h3 className="text-xs font-black text-violet-700 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-200 pb-3">
                📝 Verify Registration &amp; Submit Receipt
              </h3>
              
              {/* FORM FIELDS */}
              <div className="space-y-4">
                {!hasRegistrationData ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">Full Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 placeholder-slate-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">Email Address</label>
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 placeholder-slate-400 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="Phone"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 placeholder-slate-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">Selected Course</label>
                        <select
                          value={formData.course}
                          onChange={(e) =>
                            setFormData({ ...formData, course: e.target.value })
                          }
                          required
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 font-medium"
                        >
                          <option value="">Select Course</option>
                          <option value="Frontend Developer">Frontend Developer</option>
                          <option value="Backend Developer">Backend Developer</option>
                          <option value="MERN Stack">MERN Stack</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">College / University</label>
                      <select
                        value={formData.college}
                        onChange={(e) =>
                          setFormData({ ...formData, college: e.target.value })
                        }
                        required
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 font-medium"
                      >
                        <option value="">Select College</option>
                        <option value="PDPS College">PDPS College</option>
                        <option value="BUIT">BUIT</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">City</label>
                      <select
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        required
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 font-medium"
                      >
                        <option value="">Select City</option>
                        <option value="Bhopal">Bhopal</option>
                        <option value="Indore">Indore</option>
                        <option value="Jabalpur">Jabalpur</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-black">Verifying Registration For</p>
                    <p><span className="text-slate-600 font-bold">Name:</span> <strong className="text-slate-900 font-extrabold">{formData.name}</strong></p>
                    <p><span className="text-slate-600 font-bold">Email:</span> <strong className="text-slate-900 font-extrabold">{formData.email}</strong></p>
                    <p><span className="text-slate-600 font-bold">Phone:</span> <strong className="text-slate-900 font-extrabold">{formData.phone}</strong></p>
                  </div>
                )}

                <div className="mb-5 space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-black">Select Payment Reference Type</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="radio" name="transType" checked={transactionType === "UTR"} onChange={() => {
                        setTransactionType("UTR");
                        setFormData({...formData, transactionId: ""});
                      }} className="accent-violet-600 w-4 h-4 cursor-pointer" />
                      UTR Number (12 Digits)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="radio" name="transType" checked={transactionType === "Transaction ID"} onChange={() => {
                        setTransactionType("Transaction ID");
                        setFormData({...formData, transactionId: ""});
                      }} className="accent-violet-600 w-4 h-4 cursor-pointer" />
                      App Transaction ID
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-black">
                    {transactionType === "UTR" ? "UTR ID (12-Digit Numeric) *" : "Transaction ID (e.g. PhonePe/Paytm) *"}
                  </label>
                  <input
                    type="text"
                    placeholder={transactionType === "UTR" ? "Enter 12-digit UTR Code" : "Enter Transaction ID"}
                    required
                    value={formData.transactionId}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (transactionType === "UTR") {
                        val = val.replace(/[^0-9]/g, "").slice(0, 12);
                      }
                      setFormData({
                        ...formData,
                        transactionId: val,
                      });
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-350 focus:border-violet-600 focus:bg-white outline-none text-xs text-slate-900 transition-all duration-300 font-mono font-bold tracking-wider placeholder-slate-400"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl font-bold text-white text-xs uppercase tracking-widest transition-all duration-300 shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                      Submitting Receipt...
                    </>
                  ) : (
                    "Complete Registration & Submit UTR"
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Receipt Modal */}
      {showSuccess && (
        <>
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-receipt, #printable-receipt * {
                visibility: visible;
              }
              #printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100vh;
                margin: 0;
                padding: 40px;
                box-sizing: border-box;
                background: white;
              }
            }
          `}</style>
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:backdrop-blur-none">
            <div id="printable-receipt" className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none">
            
            {/* Decorative Top Banner */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 print:hidden"></div>

            {/* Header / Branding */}
            <div className="text-center mb-6 border-b-2 border-dashed border-slate-200 pb-6 pt-2">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center mb-4 print:hidden shadow-inner">
                <span className="text-3xl text-emerald-500">✓</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">BeanGate <span className="text-emerald-600">IT</span> Solutions</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Official Registration Receipt</p>
            </div>

            {/* Receipt Data */}
            <div className="space-y-3 mb-8 text-sm">
              
              {/* Receipt Info Card */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Date & Time</p>
                  <p className="font-mono font-bold text-slate-700 text-xs">{new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Receipt No.</p>
                  <p className="font-mono font-black text-emerald-600 text-xs">BG-{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
              </div>

              {/* Line Items */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-3 pt-2">
                <span className="text-slate-500 font-semibold text-xs">Student Name</span>
                <span className="font-extrabold text-slate-900 text-right">{receiptData?.name}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-slate-500 font-semibold text-xs">Course Selected</span>
                <span className="font-extrabold text-slate-900 text-right bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">{receiptData?.course}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-slate-500 font-semibold text-xs">Payment Plan</span>
                <span className="font-bold text-slate-700 text-right text-xs">{receiptData?.planTitle}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <span className="text-slate-500 font-semibold text-xs">Transaction ID</span>
                <span className="font-mono font-bold text-slate-600 text-right text-xs">{receiptData?.transactionId}</span>
              </div>

              {/* Financials Box */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 mt-4 border border-emerald-100/50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-650 font-bold text-xs">Course Fee (Base Price)</span>
                  <span className="font-bold text-slate-800 text-xs">{basePriceStr}</span>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-650 font-bold text-xs">GST (18%)</span>
                  <span className="font-bold text-slate-800 text-xs">{gstAmountStr}</span>
                </div>
                
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-emerald-200/50">
                  <span className="text-emerald-700 font-black text-sm uppercase tracking-wide">Amount Paid (Total)</span>
                  <span className="font-black text-emerald-600 text-xl">{receiptData?.total}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs">Remaining Dues</span>
                  <span className="font-black text-red-500 text-sm">
                    {(() => {
                      const totalCourseBase = discountAppliedState 
                        ? Math.round(cfg.oneTimePrice * (1 - oneTimeDiscPct / 100)) 
                        : cfg.oneTimePrice;
                      const totalCourseWithGST = Math.round(totalCourseBase * 1.18);
                      const paid = parseInt((receiptData?.total || "0").replace(/[^0-9]/g, "")) || 0;
                      const due = totalCourseWithGST - paid;
                      return due > 0 ? `₹${due.toLocaleString("en-IN")}` : "₹0 (Cleared)";
                    })()}
                  </span>
                </div>
              </div>

            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold transition-all cursor-pointer uppercase text-xs tracking-widest flex justify-center items-center gap-2"
              >
                🖨️ Print / Save PDF
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  navigate("/");
                }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-xl font-black transition-all cursor-pointer uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20"
              >
                Go to Home
              </button>
            </div>
            
            <p className="text-slate-400 text-[9px] text-center mt-6 uppercase tracking-widest font-semibold print:mt-12">
              * Keep this receipt for your records. Transaction verification may take up to 24 hours.
            </p>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default Payment;
