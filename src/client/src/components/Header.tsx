import { Bitcoin, LineChart as LineChartIcon, RefreshCw } from "lucide-react";
import type { DashboardSnapshot } from "../../../shared/types";
import { compactUsd, number, signedPct } from "../format";

interface HeaderProps {
  snapshot: DashboardSnapshot;
  loading: boolean;
  onRefresh: () => void;
}

/** Compact sticky header: brand + live price pills + refresh. */
export function Header({ snapshot, loading, onRefresh }: HeaderProps) {
  const btc = snapshot.securities.find((item) => item.symbol === "BTC");
  const mstr = snapshot.securities.find((item) => item.symbol === "MSTR");
  const preferredPrices = snapshot.securities.filter((item) => ["STRC", "STRD", "STRK", "STRF"].includes(item.symbol));

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
        <div className="preferred-ticker-strip">
          {preferredPrices.map((security) => (
            <span className="mini-price-pill" key={security.symbol} title={`${security.symbol} 折价 ${number(security.discountToPreferencePct ?? 0, 1)}%`}>
              <span>{security.symbol}</span>
              <strong>${number(security.priceUsd, 2)}</strong>
              <em className={(security.change24hPct ?? 0) >= 0 ? "up" : "down"}>{signedPct(security.change24hPct ?? 0, 1)}</em>
            </span>
          ))}
        </div>
        <button className="icon-button" onClick={onRefresh} title="刷新公开数据 / Refresh">
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </div>
    </header>
  );
}
