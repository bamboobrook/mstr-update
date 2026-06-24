import type { DashboardSnapshot } from "../../../shared/types";
import { number } from "../format";

interface ConclusionProps {
  snapshot: DashboardSnapshot;
}

/** Narrative conclusion summarising the dashboard's takeaway. */
export function Conclusion({ snapshot }: ConclusionProps) {
  return (
    <footer className="conclusion">
      <span className="conclusion-tag">结论</span>
      <p className="conclusion-text">
        Strategy 不是简单的 {number(snapshot.reserve.cashCoverageMonths, 1)} 个月倒计时，它的安全边际取决于 ATM 融资窗口、BTC
        价格、股息/债息和债务本金的组合。
      </p>
    </footer>
  );
}
