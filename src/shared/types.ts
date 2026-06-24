export type Confidence = "reported" | "parsed" | "estimated" | "manual" | "stale";

export interface SourceMeta {
  sourceUrl: string;
  label: string;
  retrievedAt: string;
  asOfDate: string;
  confidence: Confidence;
  note?: string;
}

export interface Security {
  symbol: string;
  name: string;
  type: "common" | "preferred" | "bitcoin" | "cash";
  priceUsd: number;
  change24hPct?: number;
  previousCloseUsd?: number;
  liquidationPreferenceUsd?: number;
  discountToPreferencePct?: number;
  dividendYieldPct?: number;
  source: SourceMeta;
}

export interface AtmProgram {
  symbol: string;
  label: string;
  type: "common" | "preferred";
  authorizedUsd: number;
  soldUsd: number;
  remainingUsd: number;
  color: string;
  source: SourceMeta;
}

export interface PreferredSeries {
  symbol: string;
  label: string;
  notionalUsd: number;
  dividendRatePct: number;
  annualDividendUsd: number;
  floating: boolean;
  source: SourceMeta;
}

export interface DebtInstrument {
  id: string;
  label: string;
  principalUsd: number;
  couponPct: number;
  annualInterestUsd: number;
  maturityYear: number;
  convertible: boolean;
  source: SourceMeta;
}

export interface BtcOperation {
  id: string;
  date: string;
  action: "buy" | "sell" | "hold" | "financing";
  btcAmount: number;
  averagePriceUsd?: number;
  costUsd?: number;
  description: string;
  source: SourceMeta;
}

export interface ReserveSnapshot {
  cashUsd: number;
  bitcoinHoldings: number;
  bitcoinMarketValueUsd: number;
  bitcoinCostBasisUsd: number;
  bitcoinUnrealizedPnlUsd: number;
  bitcoinUnrealizedPnlPct: number;
  bitcoinPerShare: number;
  assumedDilutedShares: number;
  mnav: number;
  mstrMarketCapUsd: number;
  btcAssetCoverageRatio: number;
  annualPreferredDividendUsd: number;
  annualDebtInterestUsd: number;
  annualDebtAndDividendUsd: number;
  debtPrincipalUsd: number;
  netCashAfterDebtPrincipalUsd: number;
  cashCoverageMonths: number;
  atmCoverageYears: number;
  allLiquidityCoverageYears: number;
  source: SourceMeta;
}

export interface ScenarioInput {
  btcPriceUsd: number;
  mstrPriceUsd: number;
  atmExecutionPct: number;
  preferredRateShockBps: number;
  marketDiscountPct: number;
  streEurUsd: number;
  includeDebtPrincipal: boolean;
  sellBtcPct: number;
}

export interface ScenarioResult {
  riskLevel: "low" | "medium" | "high" | "critical";
  score: number;
  runwayYears: number;
  cashCoverageMonths: number;
  atmLiquidityUsd: number;
  effectiveAtmExecutionPct: number;
  btcSaleLiquidityUsd: number;
  bitcoinMarketValueUsd: number;
  mnav: number;
  btcAssetCoverageRatio: number;
  bitcoinUnrealizedPnlUsd: number;
  annualObligationUsd: number;
  debtPrincipalIncludedUsd: number;
  bottlenecks: string[];
}

export interface DashboardSnapshot {
  generatedAt: string;
  securities: Security[];
  reserve: ReserveSnapshot;
  atmPrograms: AtmProgram[];
  preferredSeries: PreferredSeries[];
  debt: DebtInstrument[];
  operations: BtcOperation[];
  scenarioDefaults: ScenarioInput;
  sources: SourceMeta[];
  warnings: string[];
}

export interface SourceStatus extends SourceMeta {
  status: "ok" | "stale" | "failed";
}
