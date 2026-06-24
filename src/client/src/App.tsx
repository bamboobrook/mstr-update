import { AlertTriangle, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardSnapshot, ScenarioInput, ScenarioResult, SourceStatus } from "../../shared/types";
import { api } from "./api";
import { BtcPosition } from "./components/BtcPosition";
import { Conclusion } from "./components/Conclusion";
import { FundingCapacity } from "./components/FundingCapacity";
import { Header } from "./components/Header";
import { KpiStrip } from "./components/KpiStrip";
import { PreferredStock } from "./components/PreferredStock";
import { ScenarioLab } from "./components/ScenarioLab";
import { SourcesAudit } from "./components/SourcesAudit";
import { WatchList } from "./components/WatchList";

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

  // Re-run the scenario (debounced) whenever an input changes.
  useEffect(() => {
    if (!scenarioInput) return;
    const handle = window.setTimeout(() => {
      api.scenario(scenarioInput).then(setScenario).catch((err) => setError((err as Error).message));
    }, 180);
    return () => window.clearTimeout(handle);
  }, [scenarioInput]);

  if (loading && !snapshot) {
    return (
      <main className="loading-shell">
        <div className="loading-card">
          <Activity className="spin" />
          <span>正在抓取 Strategy / SEC / 市场价格...</span>
        </div>
      </main>
    );
  }

  if (!snapshot || !scenarioInput || !scenario) {
    return (
      <main className="loading-shell">
        <div className="loading-card error-card">
          <AlertTriangle size={22} />
          <span>{error ?? "无法加载数据 / Failed to load data"}</span>
          <button onClick={() => load(true)}>重试 / Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Header snapshot={snapshot} loading={loading} onRefresh={() => load(true)} />

      {error ? <div className="warning-strip">{error}</div> : null}
      {snapshot.warnings.length ? <div className="warning-strip">{snapshot.warnings.slice(0, 2).join(" / ")}</div> : null}

      <KpiStrip snapshot={snapshot} scenario={scenario} />

      <ScenarioLab input={scenarioInput} result={scenario} onChange={setScenarioInput} />

      <FundingCapacity snapshot={snapshot} />

      <div className="row-grid row-2-narrow">
        <BtcPosition snapshot={snapshot} />
        <PreferredStock snapshot={snapshot} />
      </div>

      <div className="row-grid row-2-narrow">
        <WatchList />
        <SourcesAudit sources={sources} />
      </div>

      <Conclusion snapshot={snapshot} />
    </main>
  );
}
