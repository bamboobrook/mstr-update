import type {
  AtmProgram,
  DebtInstrument,
  PreferredSeries,
  ReserveSnapshot,
  ScenarioInput,
  ScenarioResult
} from "./types";

export const usd = (value: number) => Math.round(value);

export function annualPreferredDividend(series: PreferredSeries[]): number {
  return series.reduce((sum, item) => sum + item.notionalUsd * (item.dividendRatePct / 100), 0);
}

export function annualDebtInterest(debt: DebtInstrument[]): number {
  return debt.reduce((sum, item) => sum + item.principalUsd * (item.couponPct / 100), 0);
}

export function remainingAtm(atmPrograms: AtmProgram[]): number {
  return atmPrograms.reduce((sum, item) => sum + Math.max(0, item.remainingUsd), 0);
}

export function coverageMonths(liquidityUsd: number, annualObligationUsd: number): number {
  if (annualObligationUsd <= 0) return Number.POSITIVE_INFINITY;
  return (liquidityUsd / annualObligationUsd) * 12;
}

export function coverageYears(liquidityUsd: number, annualObligationUsd: number): number {
  if (annualObligationUsd <= 0) return Number.POSITIVE_INFINITY;
  return liquidityUsd / annualObligationUsd;
}

export function buildReserveSnapshot(input: {
  cashUsd: number;
  btcHoldings: number;
  btcPriceUsd: number;
  btcCostBasisUsd: number;
  mstrPriceUsd: number;
  assumedDilutedShares: number;
  preferredSeries: PreferredSeries[];
  debt: DebtInstrument[];
  atmPrograms: AtmProgram[];
  source: ReserveSnapshot["source"];
}): ReserveSnapshot {
  const preferredDividend = annualPreferredDividend(input.preferredSeries);
  const debtInterest = annualDebtInterest(input.debt);
  const obligation = preferredDividend + debtInterest;
  const principal = input.debt.reduce((sum, item) => sum + item.principalUsd, 0);
  const atm = remainingAtm(input.atmPrograms);
  const cashAfterPrincipal = input.cashUsd - principal;
  const bitcoinMarketValueUsd = input.btcHoldings * input.btcPriceUsd;
  const mstrMarketCapUsd = input.mstrPriceUsd * input.assumedDilutedShares;
  const bitcoinUnrealizedPnlUsd = bitcoinMarketValueUsd - input.btcCostBasisUsd;
  const bitcoinUnrealizedPnlPct = input.btcCostBasisUsd > 0 ? (bitcoinUnrealizedPnlUsd / input.btcCostBasisUsd) * 100 : 0;
  const bitcoinPerShare = input.assumedDilutedShares > 0 ? input.btcHoldings / input.assumedDilutedShares : 0;
  const mnav = bitcoinMarketValueUsd > 0 ? mstrMarketCapUsd / bitcoinMarketValueUsd : Number.POSITIVE_INFINITY;
  const btcAssetCoverageRatio = principal > 0 ? bitcoinMarketValueUsd / principal : Number.POSITIVE_INFINITY;

  return {
    cashUsd: usd(input.cashUsd),
    bitcoinHoldings: input.btcHoldings,
    bitcoinMarketValueUsd: usd(bitcoinMarketValueUsd),
    bitcoinCostBasisUsd: usd(input.btcCostBasisUsd),
    bitcoinUnrealizedPnlUsd: usd(bitcoinUnrealizedPnlUsd),
    bitcoinUnrealizedPnlPct,
    bitcoinPerShare,
    assumedDilutedShares: input.assumedDilutedShares,
    mnav,
    mstrMarketCapUsd: usd(mstrMarketCapUsd),
    btcAssetCoverageRatio,
    annualPreferredDividendUsd: usd(preferredDividend),
    annualDebtInterestUsd: usd(debtInterest),
    annualDebtAndDividendUsd: usd(obligation),
    debtPrincipalUsd: usd(principal),
    netCashAfterDebtPrincipalUsd: usd(cashAfterPrincipal),
    cashCoverageMonths: coverageMonths(input.cashUsd, obligation),
    atmCoverageYears: coverageYears(atm, obligation),
    allLiquidityCoverageYears: coverageYears(input.cashUsd + atm, obligation),
    source: input.source
  };
}

export function runScenario(
  snapshot: {
    reserve: ReserveSnapshot;
    atmPrograms: AtmProgram[];
    preferredSeries: PreferredSeries[];
    debt: DebtInstrument[];
  },
  input: ScenarioInput
): ScenarioResult {
  const atmBase = remainingAtm(snapshot.atmPrograms);
  const bitcoinMarketValue = snapshot.reserve.bitcoinHoldings * input.btcPriceUsd;
  const mstrMarketCap = input.mstrPriceUsd * snapshot.reserve.assumedDilutedShares;
  const mnav = bitcoinMarketValue > 0 ? mstrMarketCap / bitcoinMarketValue : Number.POSITIVE_INFINITY;
  const btcAssetCoverageRatio =
    snapshot.reserve.debtPrincipalUsd > 0 ? bitcoinMarketValue / snapshot.reserve.debtPrincipalUsd : Number.POSITIVE_INFINITY;
  const bitcoinUnrealizedPnl = bitcoinMarketValue - snapshot.reserve.bitcoinCostBasisUsd;

  const mnavAtmMultiplier = mnav >= 1.25 ? 1 : mnav >= 1.05 ? 0.65 : mnav >= 0.9 ? 0.25 : 0.05;
  const btcCoverageMultiplier = btcAssetCoverageRatio >= 5 ? 1 : btcAssetCoverageRatio >= 3 ? 0.8 : btcAssetCoverageRatio >= 1.5 ? 0.55 : 0.25;
  const costBasisMultiplier = bitcoinUnrealizedPnl >= 0 ? 1 : bitcoinUnrealizedPnl >= -snapshot.reserve.bitcoinCostBasisUsd * 0.25 ? 0.75 : 0.5;
  const effectiveAtmExecutionPct = input.atmExecutionPct * mnavAtmMultiplier * btcCoverageMultiplier * costBasisMultiplier;
  const atmLiquidity =
    atmBase * (effectiveAtmExecutionPct / 100) * Math.max(0, 1 - input.marketDiscountPct / 100);

  const shockedPreferred = snapshot.preferredSeries.reduce((sum, item) => {
    const shockedRate = item.dividendRatePct + input.preferredRateShockBps / 100;
    return sum + item.notionalUsd * (shockedRate / 100);
  }, 0);
  const debtInterest = annualDebtInterest(snapshot.debt);
  const annualObligation = shockedPreferred + debtInterest;
  const debtPrincipal = input.includeDebtPrincipal ? snapshot.reserve.debtPrincipalUsd : 0;
  const btcSaleLiquidity =
    snapshot.reserve.bitcoinHoldings *
    input.btcPriceUsd *
    (input.sellBtcPct / 100) *
    Math.max(0, 1 - input.marketDiscountPct / 100);
  const totalLiquidity = snapshot.reserve.cashUsd + atmLiquidity + btcSaleLiquidity - debtPrincipal;
  const runwayYears = coverageYears(Math.max(0, totalLiquidity), annualObligation);
  const cashMonths = coverageMonths(snapshot.reserve.cashUsd, annualObligation);

  const bottlenecks: string[] = [];
  if (input.atmExecutionPct < 35) bottlenecks.push("ATM 窗口假设偏窄，融资弹性显著下降");
  if (mnav < 1.05) bottlenecks.push("mNAV 接近或低于 1，普通股 ATM 实际可执行性会被压缩");
  else if (mnav < 1.25) bottlenecks.push("mNAV 不高，普通股 ATM 融资折价和发行阻力上升");
  if (btcAssetCoverageRatio < 3) bottlenecks.push("BTC 市值相对债务本金覆盖不足 3 倍，BTC 下跌会放大再融资压力");
  if (bitcoinUnrealizedPnl < 0) bottlenecks.push("BTC 持仓低于成本基础，市场会重新定价 Strategy 的融资能力");
  if (input.marketDiscountPct > 20) bottlenecks.push("市场折价较高，出售股票或 BTC 的净流入被削弱");
  if (input.preferredRateShockBps >= 300) bottlenecks.push("优先股股息率上行会快速抬高固定支出");
  if (input.includeDebtPrincipal) bottlenecks.push("债务本金纳入后，覆盖时间更接近硬压力测试");
  if (cashMonths < 12) bottlenecks.push("仅靠现金覆盖固定支出的时间不足 12 个月");
  if (!bottlenecks.length) bottlenecks.push("主要压力仍来自未来 ATM 是否持续打开");

  const score = Math.max(
    0,
    Math.min(
      100,
      100 -
        Math.min(runwayYears, 10) * 7 -
        Math.min(cashMonths, 36) * 0.6 +
        Math.max(0, 1.25 - Math.min(mnav, 1.25)) * 24 +
        Math.max(0, 3 - Math.min(btcAssetCoverageRatio, 3)) * 6 +
        (bitcoinUnrealizedPnl < 0 ? Math.min(18, Math.abs(bitcoinUnrealizedPnl) / Math.max(1, snapshot.reserve.bitcoinCostBasisUsd) * 35) : 0) +
        input.marketDiscountPct * 0.6 +
        (input.preferredRateShockBps / 100) * 2 +
        (input.includeDebtPrincipal ? 12 : 0)
    )
  );

  const riskLevel =
    runwayYears < 1 || score >= 80
      ? "critical"
      : runwayYears < 3 || score >= 60
        ? "high"
        : runwayYears < 6 || score >= 38
          ? "medium"
          : "low";

  return {
    riskLevel,
    score: Math.round(score),
    runwayYears,
    cashCoverageMonths: cashMonths,
    atmLiquidityUsd: usd(atmLiquidity),
    effectiveAtmExecutionPct,
    btcSaleLiquidityUsd: usd(btcSaleLiquidity),
    bitcoinMarketValueUsd: usd(bitcoinMarketValue),
    mnav,
    btcAssetCoverageRatio,
    bitcoinUnrealizedPnlUsd: usd(bitcoinUnrealizedPnl),
    annualObligationUsd: usd(annualObligation),
    debtPrincipalIncludedUsd: usd(debtPrincipal),
    bottlenecks
  };
}
