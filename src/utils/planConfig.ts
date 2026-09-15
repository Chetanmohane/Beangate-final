import { useState, useEffect } from "react";

export interface PlanConfig {
  courseName?: string;
  courseTagline?: string;
  oneTimePrice?: number;
  oneTimeOriginalPrice?: number;
  heroOfferPrice?: number;
  installment1Price?: number;
  installment2Price?: number;
  discountPercent?: number;
  oneTimeDiscountPercent?: number;
  installment1DiscountPercent?: number;
  installment2DiscountPercent?: number;
  oneTimeFeatures?: string[];
  installmentFeatures?: string[];
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
}

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
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
  batchStartDate: "22 September 2026",
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
};

// Only used as a temporary offline fallback — DB is always the source of truth
export const getStoredPlanConfig = (): PlanConfig => {
  try {
    const s = localStorage.getItem("bg_plan_config");
    return s ? { ...DEFAULT_PLAN_CONFIG, ...JSON.parse(s) } : DEFAULT_PLAN_CONFIG;
  } catch {
    return DEFAULT_PLAN_CONFIG;
  }
};

export const usePlanConfig = (): PlanConfig => {
  // Start with a temporary local value while we wait for the DB fetch
  const [cfg, setCfg] = useState<PlanConfig>(getStoredPlanConfig());

  useEffect(() => {
    const fetchFromDB = () => {
      fetch("/api/planconfig")
        .then(res => {
          if (!res.ok) throw new Error("planconfig fetch failed");
          return res.json();
        })
        .then(data => {
          if (data && typeof data === "object" && !data.message) {
            // DB data always wins — merge with defaults for any missing fields
            const merged: PlanConfig = {
              ...DEFAULT_PLAN_CONFIG,
              ...data,
              oneTimePrice: Number(data.oneTimePrice) || DEFAULT_PLAN_CONFIG.oneTimePrice,
              oneTimeOriginalPrice: Number(data.oneTimeOriginalPrice) || DEFAULT_PLAN_CONFIG.oneTimeOriginalPrice,
              heroOfferPrice: Number(data.heroOfferPrice) || Number(data.oneTimePrice) || DEFAULT_PLAN_CONFIG.heroOfferPrice,
              installment1Price: Number(data.installment1Price) || DEFAULT_PLAN_CONFIG.installment1Price,
              installment2Price: Number(data.installment2Price) || DEFAULT_PLAN_CONFIG.installment2Price,
              discountPercent: Number(data.discountPercent) || DEFAULT_PLAN_CONFIG.discountPercent,
              oneTimeDiscountPercent: Number(data.oneTimeDiscountPercent ?? data.discountPercent ?? 10),
              installment1DiscountPercent: Number(data.installment1DiscountPercent ?? data.discountPercent ?? 10),
              installment2DiscountPercent: Number(data.installment2DiscountPercent ?? data.discountPercent ?? 10),
            };
            setCfg(merged);
            // Update localStorage cache to match the DB so fallback is always fresh
            try {
              localStorage.setItem("bg_plan_config", JSON.stringify(merged));
            } catch (e) {}
          }
        })
        .catch(() => {
          // DB unreachable — use localStorage fallback silently
          const local = getStoredPlanConfig();
          setCfg(local);
        });
    };

    fetchFromDB();

    // Re-fetch when admin updates config on any tab/device
    const handleUpdate = () => fetchFromDB();
    window.addEventListener("bg_config_updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);

    // Poll every 10 seconds to stay in sync
    const interval = setInterval(fetchFromDB, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("bg_config_updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, []);

  return cfg;
};
