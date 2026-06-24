import { Bitcoin, LineChart as LineChartIcon, RefreshCw } from "lucide-react";
import type { DashboardSnapshot } from "../../../shared/types";
import { compactUsd, number } from "../format";

interface HeaderProps {
  snapshot: DashboardSnapshot;
  loading: boolean;
  onRefresh: () => void;
}

/** Compact sticky header: brand + live price pills + refresh. */
export function Header({ snapshot, loading, onRefresh }: HeaderProps) {
  const btc = snapshot.securities.find((item) => item.symbol === "BTC");
  const mstr = snapshot.securities.find((item) => item.symbol === "MSTR");

  return (
    <header className="app-header">
      <div className="brand-block">
        <span className="coin-mark">
          <Bitcoin size={24} />
        </span>
        <div className="brand-title">
          <h1>Strategy 风险监控</h1>
          <span className="subtitle">Strategy Risk Monitor</span>
        </div>
      </div>

      <div className="header-actions">
        <span className="price-pill">
          <Bitcoin size={15} />
          <span className="px-symbol">BTC</span>
          <span>${compactUsd(btc?.priceUsd ?? 0, 2)}</span>
        </span>
        <span className="price-pill">
          <LineChartIcon size={15} />
          <span className="px-symbol">MSTR</span>
          <span>${number(mstr?.priceUsd ?? 0, 2)}</span>
        </span>
        <button className="icon-button" onClick={onRefresh} title="刷新公开数据 / Refresh">
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </div>
    </header>
  );
}
