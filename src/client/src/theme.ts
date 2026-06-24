// Shared recharts styling — keeps all charts visually consistent with the dashboard theme.

/** Tooltip container styling for recharts <Tooltip contentStyle={...} /> */
export const tooltipStyle = {
  background: "rgba(10, 14, 12, 0.94)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "10px",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: "#e8efe9",
  fontSize: "12px",
  padding: "8px 12px",
  labelStyle: { color: "#8a9a92", marginBottom: "4px", fontWeight: 600 }
} as const;

/** Tick + axis line styling for recharts <XAxis /> / <YAxis /> */
export const axisStyle = {
  stroke: "#6a7a74",
  tick: { fill: "#8a9a92", fontSize: 11 },
  tickLine: { stroke: "rgba(255,255,255,0.1)" },
  axisLine: { stroke: "rgba(255,255,255,0.08)" }
} as const;

/** Faint dashed grid for recharts <CartesianGrid /> */
export const gridStyle = {
  stroke: "rgba(255,255,255,0.06)",
  strokeDasharray: "4 4",
  vertical: false
} as const;

/** Shared accent colors (kept in sync with the CSS tokens). */
export const palette = {
  mint: "#4ade80",
  mintStrong: "#22c55e",
  gold: "#fbbf24",
  goldStrong: "#f59e0b",
  blue: "#60a5fa",
  blueStrong: "#3b82f6",
  red: "#f87171",
  textPrimary: "#e8efe9",
  textSecondary: "#8a9a92"
} as const;
