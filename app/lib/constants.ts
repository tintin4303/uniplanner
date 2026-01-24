export const BRAND = {
  name: "UniPlanner",
  logoColor: "text-blue-600",
  primary: "bg-blue-600",
  primaryHover: "hover:bg-blue-700",
  primaryLight: "bg-blue-50",
  primaryText: "text-blue-600",
  primaryBorder: "border-blue-200",
  secondary: "bg-slate-900",
  accent: "text-emerald-500",
  accentBg: "bg-emerald-50",
  accentBorder: "border-emerald-100",
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const PALETTE = [
  "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-violet-500",
  "bg-cyan-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500"
];

// --- MISSING PART ADDED BELOW ---
export const TIME_PRESETS = [
  { label: "Morning (09:00-12:00)", start: "09:00", end: "12:00" },
  { label: "Afternoon (13:30-16:30)", start: "13:30", end: "16:30" }
];

export const AD_URL = process.env.NEXT_PUBLIC_ADSTERRA_URL || "#";