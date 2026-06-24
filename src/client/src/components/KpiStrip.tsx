import { Banknote, Bitcoin, CalendarClock, Gauge, WalletCards } from "lucide-react";
import type { DashboardSnapshot, ScenarioResult } from "../../../shared/types";
import { compactCnyLike, compactUsd, number } from "../format";
import { Metric } from "./Metric";

interface KpiStripProps {
  snapshot: DashboardSnapshot;
  scenario: ScenarioResult;
}

const riskLabels = { low: "低", medium: "中", high: "高", critical: "临界" };

/** Five-card KPI row covering cash, fixed outflow, coverage, risk, and BTC P&L. */
export function KpiStrip({ snapshot, scenario }: KpiStripProps) {
  const reserve = snapshot.reserve;
  const btcPnl = reserve.bitcoinMarketValueUsd - reserve.bitcoinCostBasisUsd;
  const btcPnlPct = reserve.bitcoinCostBasisUsd > 0 ? (btcPnl / reserve.bitcoinCostBasisUsd) * 100 : 0;
  const pnlTone = btcPnl >= 0 ? "green" : "red";

  return (
    <section className="kpi-grid">
      <Metric
        label="美元现金储备"
        labelEn="USD Cash Reserve"
        value={compactCnyLike(reserve.cashUsd)}
        sub={`现金覆盖 ${number(reserve.cashCoverageMonths, 1)} 个月`}
        tone="green"
        icon={<Banknote size={18} />}
      />
      <Metric
        label="年化固定支出"
        labelEn="Annual Fixed Outflow"
        value={compactCnyLike(reserve.annualDebtAndDividendUsd)}
        sub={`股息 ${compactUsd(reserve.annualPreferredDividendUsd)} · 债息 ${compactUsd(reserve.annualDebtInterestUsd)}`}
        tone="blue"
        icon={<WalletCards size={18} />}
      />
      <Metric
        label="综合覆盖年限"
        labelEn="Total Coverage"
        value={`${number(scenario.runwayYears, 1)} 年`}
        sub={`仅现金 ${number(reserve.cashCoverageMonths, 1)} 个月`}
        tone="amber"
        icon={<CalendarClock size={18} />}
      />
      <Metric
        label="风险等级"
        labelEn="Risk Level"
        value={riskLabels[scenario.riskLevel]}
        sub={`综合分 ${scenario.score}/100`}
        tone={scenario.riskLevel === "critical" || scenario.riskLevel === "high" ? "red" : "green"}
        icon={<Gauge size={18} />}
      />
      <Metric
        label="BTC 持仓盈亏"
        labelEn="BTC Position P&L"
        value={`${btcPnl >= 0 ? "+" : ""}${compactCnyLike(btcPnl)}`}
        sub={`${btcPnl >= 0 ? "+" : ""}${number(btcPnlPct, 1)}% 未实现损益`}
        tone={pnlTone}
        icon={<Bitcoin size={18} />}
      />
    </section>
  );
}
