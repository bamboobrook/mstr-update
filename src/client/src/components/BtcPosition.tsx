import { Banknote, Bitcoin } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardSnapshot } from "../../../shared/types";
import { btcAmount, compactCnyLike, compactUsd, number } from "../format";
import { axisStyle, gridStyle, palette, tooltipStyle } from "../theme";
import { Panel } from "./Panel";

interface BtcPositionProps {
  snapshot: DashboardSnapshot;
}

/** BTC holdings detail card: position stats + 50/50 funding split + sale-scenario area chart. */
export function BtcPosition({ snapshot }: BtcPositionProps) {
  const reserve = snapshot.reserve;
  const pnl = reserve.bitcoinMarketValueUsd - reserve.bitcoinCostBasisUsd;
  const pnlPct = reserve.bitcoinCostBasisUsd > 0 ? (pnl / reserve.bitcoinCostBasisUsd) * 100 : 0;

  const btcFlow = useMemo(() => {
    const base = reserve.bitcoinHoldings;
    return [
      { label: "当前", btc: base },
      { label: "卖 10%", btc: base * 0.9 },
      { label: "卖 25%", btc: base * 0.75 },
      { label: "卖 50%", btc: base * 0.5 }
    ];
  }, [reserve]);

  return (
    <Panel title="BTC 持仓详情" subtitle="Bitcoin Position" icon={<Bitcoin size={16} />}>
      <div className="position-stats">
        <div className={`stat-cell ${pnl >= 0 ? "positive" : "negative"}`}>
          <span>持仓量 · Holdings</span>
          <strong>{btcAmount(reserve.bitcoinHoldings)} BTC</strong>
        </div>
        <div className="stat-cell">
          <span>成本基础 · Cost Basis</span>
          <strong>${compactUsd(reserve.bitcoinCostBasisUsd)}</strong>
        </div>
        <div className="stat-cell">
          <span>市值 · Market Value</span>
          <strong>${compactUsd(reserve.bitcoinMarketValueUsd)}</strong>
        </div>
        <div className={`stat-cell ${pnl >= 0 ? "positive" : "negative"}`}>
          <span>未实现盈亏 · Unrealized P&L</span>
          <strong>
            {pnl >= 0 ? "+" : ""}
            {compactCnyLike(pnl)}
          </strong>
        </div>
      </div>

      <div className="split-path">
        <div className="split-cell">
          <Banknote size={20} />
          <span>约一半用于储备 / 付息 / 偿债</span>
        </div>
        <div className="ratio">50 / 50</div>
        <div className="split-cell gold">
          <Bitcoin size={20} />
          <span>约一半用于继续买入 BTC 现货</span>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={btcFlow} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="btcArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={palette.gold} stopOpacity={0.55} />
                <stop offset="95%" stopColor={palette.gold} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="label" {...axisStyle} />
            <YAxis {...axisStyle} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`} width={52} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)" }} formatter={(value: number) => [`${number(value, 0)} BTC`, "持仓"]} />
            <Area type="monotone" dataKey="btc" stroke={palette.gold} strokeWidth={2} fill="url(#btcArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
