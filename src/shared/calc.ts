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

  return {
    cashUsd: usd(input.cashUsd),
    bitcoinHoldings: input.btcHoldings,
    bitcoinMarketValueUsd: usd(input.btcHoldings * input.btcPriceUsd),
    bitcoinCostBasisUsd: usd(input.btcCostBasisUsd),
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
  const atmLiquidity =
    atmBase * (input.atmExecutionPct / 100) * Math.max(0, 1 - input.marketDiscountPct / 100);

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
    btcSaleLiquidityUsd: usd(btcSaleLiquidity),
    annualObligationUsd: usd(annualObligation),
    debtPrincipalIncludedUsd: usd(debtPrincipal),
    bottlenecks
  };
}
