import { AlertTriangle, ArrowDownRight, Gauge } from "lucide-react";
import type { ScenarioInput, ScenarioResult } from "../../../shared/types";
import { compactCnyLike, number } from "../format";
import { Panel } from "./Panel";
import { Slider } from "./Slider";

const riskLabels = { low: "低", medium: "中", high: "高", critical: "临界" };
const riskClass = { low: "risk-low", medium: "risk-medium", high: "risk-high", critical: "risk-critical" };

interface ScenarioLabProps {
  input: ScenarioInput;
  result: ScenarioResult;
  onChange: (next: ScenarioInput) => void;
}

/** Interactive stress-test panel: risk gauge + 5 sliders + debt toggle, flanked by bottlenecks. */
export function ScenarioLab({ input, result, onChange }: ScenarioLabProps) {
  return (
    <div className="row-grid row-2-wide">
      <Panel title="风险压力实验室" subtitle="Scenario Lab" icon={<Gauge size={16} />}>
        <div className={`scenario-head ${riskClass[result.riskLevel]}`}>
          <div className="risk-label">
            当前情景
            <span style={{ textTransform: "none", letterSpacing: 0, fontSize: 10 }}>Current Scenario</span>
          </div>
          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <div className="risk-value">{riskLabels[result.riskLevel]}</div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }} />
            </div>
          </div>
          <div className="risk-meta">
            可覆盖
            <strong>{number(result.runwayYears, 1)} 年</strong>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <Slider
            label="BTC 价格 · BTC Price"
            value={input.btcPriceUsd}
            min={20_000}
            max={250_000}
            step={1_000}
            suffix=" USD"
            onChange={(value) => onChange({ ...input, btcPriceUsd: value })}
          />
          <Slider
            label="ATM 可执行比例 · ATM Execution"
            value={input.atmExecutionPct}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={(value) => onChange({ ...input, atmExecutionPct: value })}
          />
          <Slider
            label="优先股利率冲击 · Preferred Rate Shock"
            value={input.preferredRateShockBps}
            min={-200}
            max={800}
            step={25}
            suffix=" bps"
            onChange={(value) => onChange({ ...input, preferredRateShockBps: value })}
          />
          <Slider
            label="市场折价/滑点 · Market Discount"
            value={input.marketDiscountPct}
            min={0}
            max={60}
            step={1}
            suffix="%"
            onChange={(value) => onChange({ ...input, marketDiscountPct: value })}
          />
          <Slider
            label="出售 BTC 比例 · BTC Sale"
            value={input.sellBtcPct}
            min={0}
            max={50}
            step={1}
            suffix="%"
            onChange={(value) => onChange({ ...input, sellBtcPct: value })}
          />
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={input.includeDebtPrincipal}
            onChange={(event) => onChange({ ...input, includeDebtPrincipal: event.target.checked })}
          />
          <span>把债务本金纳入硬压力测试 · Include debt principal</span>
        </label>
      </Panel>

      <Panel title="情景瓶颈" subtitle="Scenario Bottlenecks" icon={<AlertTriangle size={16} />}>
        <ul className="bottlenecks">
          {result.bottlenecks.map((item) => (
            <li key={item}>
              <ArrowDownRight size={15} />
              {item}
            </li>
          ))}
        </ul>
        <div className="scenario-numbers">
          <div className="num-cell">
            <span>ATM 净流入</span>
            <strong>{compactCnyLike(result.atmLiquidityUsd)}</strong>
          </div>
          <div className="num-cell">
            <span>卖币净流入</span>
            <strong>{compactCnyLike(result.btcSaleLiquidityUsd)}</strong>
          </div>
          <div className="num-cell">
            <span>年化支出</span>
            <strong>{compactCnyLike(result.annualObligationUsd)}</strong>
          </div>
        </div>
      </Panel>
    </div>
  );
}
