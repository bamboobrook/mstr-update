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

export function dateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
