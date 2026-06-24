export function compactUsd(value: number, digits = 1): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(digits)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(digits)}K`;
  return value.toFixed(0);
}

export function compactCnyLike(value: number, digits = 1): string {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(digits)} 亿美元`;
  if (Math.abs(value) >= 10_000) return `${(value / 10_000).toFixed(digits)} 万美元`;
  return `${value.toFixed(0)} 美元`;
}

export function number(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "∞";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function pct(value: number, digits = 1): string {
  return `${number(value, digits)}%`;
}

/** Signed percent, e.g. +2.3% / -1.1%, for change indicators. */
export function signedPct(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${number(value, digits)}%`;
}

/** Plain USD price with thousands separators, e.g. 67,240.50. */
export function usdPrice(value: number, digits = 2): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Whole BTC count with thousands separators. */
export function btcAmount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function dateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
