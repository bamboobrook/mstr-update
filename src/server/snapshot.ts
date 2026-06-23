import { buildReserveSnapshot } from "../shared/calc";
import type { DashboardSnapshot, ScenarioInput } from "../shared/types";
import { fetchAllData } from "./data/fetchers";
import { source } from "./data/fallback";
import { getLatestSnapshot, saveSnapshot } from "./db";

export async function buildSnapshot(): Promise<DashboardSnapshot> {
  const data = await fetchAllData();
  const generatedAt = new Date().toISOString();
  const btcPriceUsd = data.securities.find((item) => item.symbol === "BTC")?.priceUsd ?? 105_000;
  const mstrPriceUsd = data.securities.find((item) => item.symbol === "MSTR")?.priceUsd ?? 360;
  const reserve = buildReserveSnapshot({
    cashUsd: data.cashUsd,
    btcHoldings: data.btcHoldings,
    btcPriceUsd,
    btcCostBasisUsd: data.btcCostBasisUsd,
    preferredSeries: data.preferredSeries,
    debt: data.debt,
    atmPrograms: data.atmPrograms,
    source: source("MSTR Update computed reserve", "app://computed/reserve", "estimated")
  });
  const scenarioDefaults: ScenarioInput = {
    btcPriceUsd,
    mstrPriceUsd,
    atmExecutionPct: 50,
    preferredRateShockBps: 300,
    marketDiscountPct: 15,
    streEurUsd: 1.16,
    includeDebtPrincipal: false,
    sellBtcPct: 0
  };

  const uniqueSources = new Map<string, DashboardSnapshot["sources"][number]>();
  for (const sourceMeta of [reserve.source, ...data.sources]) {
    uniqueSources.set(sourceMeta.sourceUrl, sourceMeta);
  }

  return {
    generatedAt,
    securities: data.securities,
    reserve,
    atmPrograms: data.atmPrograms,
    preferredSeries: data.preferredSeries,
    debt: data.debt,
    operations: data.operations,
    scenarioDefaults,
    sources: [...uniqueSources.values()],
    warnings: data.warnings
  };
}

export async function refreshSnapshot(): Promise<DashboardSnapshot> {
  const snapshot = await buildSnapshot();
  saveSnapshot(snapshot);
  return snapshot;
}

export async function getOrCreateSnapshot(): Promise<DashboardSnapshot> {
  const latest = getLatestSnapshot();
  if (latest) return latest;
  return refreshSnapshot();
}
