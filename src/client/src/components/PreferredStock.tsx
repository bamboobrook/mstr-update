import { WalletCards } from "lucide-react";
import type { DashboardSnapshot } from "../../../shared/types";
import { compactUsd, number } from "../format";
import { Panel } from "./Panel";

interface PreferredStockProps {
  snapshot: DashboardSnapshot;
}

/** Preferred-stock detail table — surfaces preferredSeries[] previously hidden in the snapshot. */
export function PreferredStock({ snapshot }: PreferredStockProps) {
  const total = snapshot.preferredSeries.reduce((sum, item) => sum + item.notionalUsd, 0);
  const totalDividend = snapshot.preferredSeries.reduce((sum, item) => sum + item.annualDividendUsd, 0);

  return (
    <Panel title="优先股明细" subtitle="Preferred Stock" icon={<WalletCards size={16} />}>
      <table className="data-table">
        <thead>
          <tr>
            <th>代码 / Symbol</th>
            <th>类型</th>
            <th className="num">票息率</th>
            <th className="num">本金</th>
            <th className="num">年股息</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.preferredSeries.map((item) => (
            <tr key={item.symbol}>
              <td>
                <strong>{item.symbol}</strong>
              </td>
              <td>
                <span className={`tag ${item.floating ? "floating" : "fixed"}`}>{item.floating ? "浮动 Float" : "固定 Fixed"}</span>
              </td>
              <td className="num">{number(item.dividendRatePct, 2)}%</td>
              <td className="num">${compactUsd(item.notionalUsd)}</td>
              <td className="num">${compactUsd(item.annualDividendUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="scenario-numbers">
        <div className="num-cell">
          <span>本金合计 · Total Notional</span>
          <strong>${compactUsd(total)}</strong>
        </div>
        <div className="num-cell">
          <span>年股息合计 · Annual Dividend</span>
          <strong>${compactUsd(totalDividend)}</strong>
        </div>
      </div>
    </Panel>
  );
}
