import type { ReactNode } from "react";

interface PanelProps {
  /** Chinese title shown as the primary heading. */
  title?: string;
  /** English subtitle shown beneath the title. */
  subtitle?: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Optional extra class on the panel root. */
  className?: string;
  children: ReactNode;
}

/**
 * Generic glassmorphism panel wrapper with a bilingual header
 * (Chinese title + English subtitle).
 */
export function Panel({ title, subtitle, icon, className, children }: PanelProps) {
  return (
    <section className={`panel ${className ?? ""}`}>
      {title || icon ? (
        <div className="panel-head">
          {icon ? <span className="panel-icon">{icon}</span> : null}
          <div className="panel-titles">
            {title ? <span className="panel-title">{title}</span> : null}
            {subtitle ? <span className="panel-subtitle">{subtitle}</span> : null}
          </div>
        </div>
      ) : null}
      {children}
    </section>
  );
}
