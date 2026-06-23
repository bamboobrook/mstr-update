import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  Banknote,
  Bitcoin,
  CalendarClock,
  Database,
  Gauge,
  Landmark,
  LineChart as LineChartIcon,
  RefreshCw,
  ShieldCheck,
  Target,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DashboardSnapshot, ScenarioInput, ScenarioResult, SourceStatus } from "../../shared/types";
import { api } from "./api";
import { compactCnyLike, compactUsd, dateTime, number, pct } from "./format";

const riskLabels = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "临界"
};

const riskClass = {
  low: "risk-low",
  medium: "risk-medium",
  high: "risk-high",
  critical: "risk-critical"
};

function Panel(props: { title?: string; icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`panel ${props.className ?? ""}`}>
      {props.title ? (
        <div className="panel-title">
          {props.icon}
          <span>{props.title}</span>
        </div>
      ) : null}
      {props.children}
    </section>
  );
}

function Metric(props: { label: string; value: string; sub?: string; tone?: "green" | "blue" | "amber" | "red"; icon?: React.ReactNode }) {
  return (
    <div className={`metric metric-${props.tone ?? "green"}`}>
      <div className="metric-icon">{props.icon}</div>
      <div>
        <div className="metric-label">{props.label}</div>
        <div className="metric-value">{props.value}</div>
        {props.sub ? <div className="metric-sub">{props.sub}</div> : null}
      </div>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-row">
      <span>
        {props.label}
        <strong>
          {number(props.value, props.step < 1 ? 2 : 0)}
          {props.suffix ?? ""}
        </strong>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [scenarioInput, setScenarioInput] = useState<ScenarioInput | null>(null);
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = refresh ? await api.refresh() : await api.snapshot();
      setSnapshot(data);
      setScenarioInput(data.scenarioDefaults);
      const [scenarioData, sourceData] = await Promise.all([api.scenario(data.scenarioDefaults), api.sources()]);
      setScenario(scenarioData);
      setSources(sourceData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!scenarioInput) return;
    const handle = window.setTimeout(() => {
      api.scenario(scenarioInput).then(setScenario).catch((err) => setError((err as Error).message));
    }, 180);
    return () => window.clearTimeout(handle);
  }, [scenarioInput]);

  const atmData = useMemo(
    () =>
      snapshot?.atmPrograms.map((program) => ({
        symbol: program.symbol,
        remaining: program.remainingUsd / 1_000_000_000,
        sold: program.soldUsd / 1_000_000_000,
        color: program.color
      })) ?? [],
    [snapshot]
  );

  const debtData = useMemo(
    () =>
      snapshot?.debt.map((item) => ({
        year: item.maturityYear,
        principal: item.principalUsd / 1_000_000_000,
        interest: item.annualInterestUsd / 1_000_000
      })) ?? [],
    [snapshot]
  );

  const btcFlow = useMemo(() => {
    if (!snapshot) return [];
    const base = snapshot.reserve.bitcoinHoldings;
    return [
      { label: "当前", btc: base },
      { label: "卖 10%", btc: base * 0.9 },
      { label: "卖 25%", btc: base * 0.75 },
      { label: "卖 50%", btc: base * 0.5 }
    ];
  }, [snapshot]);

  if (loading && !snapshot) {
    return (
      <main className="terminal-shell loading-shell">
        <div className="loading-card">
          <Activity className="spin" />
          <span>正在抓取 Strategy / SEC / 市场价格...</span>
        </div>
      </main>
    );
  }

  if (!snapshot || !scenarioInput || !scenario) {
    return (
      <main className="terminal-shell loading-shell">
        <div className="loading-card error-card">
          <AlertTriangle />
          <span>{error ?? "无法加载数据"}</span>
          <button onClick={() => load(true)}>重试</button>
        </div>
      </main>
    );
  }

  const btc = snapshot.securities.find((item) => item.symbol === "BTC");
  const mstr = snapshot.securities.find((item) => item.symbol === "MSTR");

  return (
    <main className="terminal-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="coin-mark">
            <Bitcoin size={30} />
          </div>
          <div>
            <h1>Strategy 暴雷倒计时?</h1>
            <p>关键不只是现金，而是 ATM 融资窗口、BTC 价格和固定支出之间的动态关系。</p>
          </div>
        </div>
        <div className="top-actions">
          <div className="price-pill">
            <Bitcoin size={16} />
            BTC ${compactUsd(btc?.priceUsd ?? 0, 2)}
          </div>
          <div className="price-pill">
            <LineChartIcon size={16} />
            MSTR ${number(mstr?.priceUsd ?? 0, 2)}
          </div>
          <button className="icon-button" onClick={() => load(true)} title="刷新公开数据">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {error ? <div className="warning-strip">{error}</div> : null}
      {snapshot.warnings.length ? <div className="warning-strip">{snapshot.warnings.slice(0, 2).join(" / ")}</div> : null}

      <section className="metric-grid">
        <Metric
          label="USD Reserve"
          value={compactCnyLike(snapshot.reserve.cashUsd)}
          sub={`现金覆盖 ${number(snapshot.reserve.cashCoverageMonths, 1)} 个月`}
          tone="green"
          icon={<Banknote />}
        />
        <Metric
          label="年化股息 + 债息"
          value={compactCnyLike(snapshot.reserve.annualDebtAndDividendUsd)}
          sub={`股息 ${compactUsd(snapshot.reserve.annualPreferredDividendUsd)} / 债息 ${compactUsd(snapshot.reserve.annualDebtInterestUsd)}`}
          tone="blue"
          icon={<WalletCards />}
        />
        <Metric
          label="仅现金覆盖"
          value={`${number(snapshot.reserve.cashCoverageMonths, 1)} 个月`}
          sub="不含 ATM、卖币和再融资"
          tone="amber"
          icon={<CalendarClock />}
        />
        <Metric
          label="风险压力"
          value={riskLabels[scenario.riskLevel]}
          sub={`综合分 ${scenario.score}/100，跑道 ${number(scenario.runwayYears, 1)} 年`}
          tone={scenario.riskLevel === "critical" || scenario.riskLevel === "high" ? "red" : "green"}
          icon={<Gauge />}
        />
      </section>

      <div className="core-grid">
        <Panel title="剩余 ATM 弹药" icon={<Target size={18} />}>
          <div className="atm-list">
            {snapshot.atmPrograms.map((program) => (
              <div className="atm-row" key={program.symbol}>
                <span className="ticker-dot" style={{ borderColor: program.color }}>
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
            合计接近 <strong>{compactCnyLike(snapshot.atmPrograms.reduce((sum, item) => sum + item.remainingUsd, 0))}</strong>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={atmData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#173331" />
              <XAxis dataKey="symbol" stroke="#8ba7a0" />
              <YAxis stroke="#8ba7a0" tickFormatter={(value) => `$${value}B`} />
              <Tooltip contentStyle={{ background: "#091616", border: "1px solid #285148" }} />
              <Bar dataKey="remaining" radius={[4, 4, 0, 0]}>
                {atmData.map((entry) => (
                  <Cell key={entry.symbol} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="更严格的压力测试" icon={<Gauge size={18} />} className="scenario-panel">
          <div className={`risk-card ${riskClass[scenario.riskLevel]}`}>
            <span>当前情景</span>
            <strong>{riskLabels[scenario.riskLevel]}</strong>
            <em>可覆盖 {number(scenario.runwayYears, 1)} 年</em>
          </div>
          <Slider
            label="BTC 价格"
            value={scenarioInput.btcPriceUsd}
            min={20_000}
            max={250_000}
            step={1_000}
            suffix=" USD"
            onChange={(value) => setScenarioInput({ ...scenarioInput, btcPriceUsd: value })}
          />
          <Slider
            label="ATM 可执行比例"
            value={scenarioInput.atmExecutionPct}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={(value) => setScenarioInput({ ...scenarioInput, atmExecutionPct: value })}
          />
          <Slider
            label="优先股利率冲击"
            value={scenarioInput.preferredRateShockBps}
            min={-200}
            max={800}
            step={25}
            suffix=" bps"
            onChange={(value) => setScenarioInput({ ...scenarioInput, preferredRateShockBps: value })}
          />
          <Slider
            label="市场折价/滑点"
            value={scenarioInput.marketDiscountPct}
            min={0}
            max={60}
            step={1}
            suffix="%"
            onChange={(value) => setScenarioInput({ ...scenarioInput, marketDiscountPct: value })}
          />
          <Slider
            label="出售 BTC 比例"
            value={scenarioInput.sellBtcPct}
            min={0}
            max={50}
            step={1}
            suffix="%"
            onChange={(value) => setScenarioInput({ ...scenarioInput, sellBtcPct: value })}
          />
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={scenarioInput.includeDebtPrincipal}
              onChange={(event) => setScenarioInput({ ...scenarioInput, includeDebtPrincipal: event.target.checked })}
            />
            <span>把债务本金纳入硬压力测试</span>
          </label>
        </Panel>
      </div>

      <div className="wide-grid">
        <Panel title="再把债务本金算进去" icon={<Landmark size={18} />}>
          <div className="debt-flow">
            <div>
              <span>可转债本金</span>
              <strong>{compactCnyLike(snapshot.reserve.debtPrincipalUsd)}</strong>
            </div>
            <div>
              <span>总现金池 + ATM</span>
              <strong>{compactCnyLike(snapshot.reserve.cashUsd + snapshot.atmPrograms.reduce((sum, item) => sum + item.remainingUsd, 0))}</strong>
            </div>
            <div>
              <span>扣本金后</span>
              <strong>{compactCnyLike(snapshot.reserve.netCashAfterDebtPrincipalUsd)}</strong>
            </div>
            <div>
              <span>覆盖期</span>
              <strong>{number(Math.max(0, snapshot.reserve.netCashAfterDebtPrincipalUsd) / snapshot.reserve.annualDebtAndDividendUsd, 1)} 年</strong>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={debtData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3027" />
              <XAxis dataKey="year" stroke="#a7a38b" />
              <YAxis stroke="#a7a38b" tickFormatter={(value) => `$${value}B`} />
              <Tooltip contentStyle={{ background: "#15120b", border: "1px solid #5c4b22" }} />
              <Bar dataKey="principal" fill="#f6b84c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="如果按一半资金继续买 BTC" icon={<Bitcoin size={18} />}>
          <div className="split-path">
            <div>
              <Banknote />
              <span>约一半用于储备 / 付息 / 偿债</span>
            </div>
            <div className="ratio">50 / 50</div>
            <div>
              <Bitcoin />
              <span>约一半用于继续买入 BTC 现货</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={btcFlow}>
              <defs>
                <linearGradient id="btcArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7b941" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f7b941" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#302511" />
              <XAxis dataKey="label" stroke="#a89974" />
              <YAxis stroke="#a89974" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`} />
              <Tooltip contentStyle={{ background: "#15110a", border: "1px solid #604a1c" }} />
              <Area type="monotone" dataKey="btc" stroke="#f7b941" fill="url(#btcArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="bottom-grid">
        <Panel title="真正要盯的 4 个变量" icon={<ShieldCheck size={18} />}>
          <div className="watch-list">
            <div>
              <strong>1</strong>
              <span>MSTR 普通股 ATM 能不能继续卖</span>
            </div>
            <div>
              <strong>2</strong>
              <span>优先股 ATM 能不能继续卖</span>
            </div>
            <div>
              <strong>3</strong>
              <span>可转债能不能续再融资</span>
            </div>
            <div>
              <strong>4</strong>
              <span>BTC 下跌时市场还愿不愿意提供资金</span>
            </div>
          </div>
        </Panel>

        <Panel title="情景瓶颈" icon={<AlertTriangle size={18} />}>
          <ul className="bottlenecks">
            {scenario.bottlenecks.map((item) => (
              <li key={item}>
                <ArrowDownRight size={16} />
                {item}
              </li>
            ))}
          </ul>
          <div className="scenario-numbers">
            <span>ATM 净流入 {compactCnyLike(scenario.atmLiquidityUsd)}</span>
            <span>卖币净流入 {compactCnyLike(scenario.btcSaleLiquidityUsd)}</span>
            <span>年化支出 {compactCnyLike(scenario.annualObligationUsd)}</span>
          </div>
        </Panel>
      </div>

      <Panel title="来源审计" icon={<Database size={18} />} className="sources-panel">
        <div className="source-grid">
          {sources.slice(0, 12).map((item) => (
            <a href={item.sourceUrl.startsWith("http") ? item.sourceUrl : undefined} key={item.sourceUrl} target="_blank" rel="noreferrer">
              <span className={`status-dot status-${item.status}`} />
              <strong>{item.label}</strong>
              <em>{item.confidence}</em>
              <small>{dateTime(item.retrievedAt)}</small>
            </a>
          ))}
        </div>
      </Panel>

      <footer className="conclusion">
        <span>结论</span>
        Strategy 不是简单的 {number(snapshot.reserve.cashCoverageMonths, 1)} 个月倒计时，它的安全边际取决于 ATM 融资窗口、BTC 价格、股息/债息和债务本金的组合。
      </footer>
    </main>
  );
}
