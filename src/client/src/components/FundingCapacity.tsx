import { Landmark, Target } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardSnapshot } from "../../../shared/types";
import { compactCnyLike, compactUsd, number } from "../format";
import { axisStyle, gridStyle, tooltipStyle } from "../theme";
import { Panel } from "./Panel";

interface FundingCapacityProps {
  snapshot: DashboardSnapshot;
}

/** Two-column funding panel: remaining ATM capacity + debt structure with detail table. */
export function FundingCapacity({ snapshot }: FundingCapacityProps) {
  const atmData = useMemo(
    () =>
      snapshot.atmPrograms.map((program) => ({
        symbol: program.symbol,
        remaining: program.remainingUsd / 1_000_000_000,
        color: program.color
      })),
    [snapshot]
  );

  const debtData = useMemo(
    () =>
      snapshot.debt.map((item) => ({
        year: item.maturityYear,
        principal: item.principalUsd / 1_000_000_000
      })),
    [snapshot]
  );

  const totalAtm = snapshot.atmPrograms.reduce((sum, item) => sum + item.remainingUsd, 0);
  const totalPool = snapshot.reserve.cashUsd + totalAtm;
  const coverageYears =
    snapshot.reserve.annualDebtAndDividendUsd > 0
      ? Math.max(0, snapshot.reserve.netCashAfterDebtPrincipalUsd) / snapshot.reserve.annualDebtAndDividendUsd
      : 0;

  return (
    <div className="row-grid row-2">
      <Panel title="剩余 ATM 弹药" subtitle="Remaining ATM Capacity" icon={<Target size={16} />}>
        <div className="atm-list">
          {snapshot.atmPrograms.map((program) => (
            <div className="atm-row" key={program.symbol}>
              <span className="ticker-dot" style={{ borderColor: program.color, color: program.color }}>
                {program.symbol}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.max(3, (program.remainingUsd / Math.max(program.authorizedUsd, 1)) * 100)}%`,
                    background: program.color
                  }}
                />
              </div>
              <strong>{compactCnyLike(program.remainingUsd)}</strong>
            </div>
          ))}
        </div>
        <div className="big-total">
          合计接近 <strong>{compactCnyLike(totalAtm)}</strong>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={atmData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="symbol" {...axisStyle} />
              <YAxis {...axisStyle} tickFormatter={(value) => `$${value}B`} width={48} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="remaining" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {atmData.map((entry) => (
                  <Cell key={entry.symbol} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="债务结构" subtitle="Debt Structure" icon={<Landmark size={16} />}>
        <div className="stat-flow">
          <div className="stat-cell">
            <span>可转债本金</span>
            <strong>{compactCnyLike(snapshot.reserve.debtPrincipalUsd)}</strong>
          </div>
          <div className="stat-cell">
            <span>总现金池+ATM</span>
            <strong>{compactCnyLike(totalPool)}</strong>
          </div>
          <div className="stat-cell">
            <span>扣本金后</span>
            <strong>{compactCnyLike(snapshot.reserve.netCashAfterDebtPrincipalUsd)}</strong>
          </div>
          <div className="stat-cell">
            <span>覆盖期</span>
            <strong>{number(coverageYears, 1)} 年</strong>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={debtData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="year" {...axisStyle} />
              <YAxis {...axisStyle} tickFormatter={(value) => `$${value}B`} width={48} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="principal" fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>债券 / Instrument</th>
              <th className="num">票息</th>
              <th className="num">本金</th>
              <th className="num">到期</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.debt.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.label}</strong>
                </td>
                <td className="num">{item.couponPct.toFixed(2)}%</td>
                <td className="num">${compactUsd(item.principalUsd)}</td>
                <td className="num">{item.maturityYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
