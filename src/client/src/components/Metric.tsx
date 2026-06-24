import type { ReactNode } from "react";

type Tone = "green" | "blue" | "amber" | "red";

interface MetricProps {
  /** Chinese label. */
  label: string;
  /** English label shown small beneath the Chinese one. */
  labelEn?: string;
  value: string;
  sub?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}

/** KPI card with a colored top accent, bilingual label, and big value. */
export function Metric({ label, labelEn, value, sub, tone = "green", icon }: MetricProps) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-head">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">
          <span className="label-zh">{label}</span>
          {labelEn ? <span className="label-en">{labelEn}</span> : null}
        </span>
      </div>
      <div className="metric-value">{value}</div>
      {sub ? <div className="metric-sub">{sub}</div> : null}
    </div>
  );
}
