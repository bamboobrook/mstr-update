import { annualDebtInterest, annualPreferredDividend } from "../../shared/calc";
import type {
  AtmProgram,
  BtcOperation,
  DebtInstrument,
  PreferredSeries,
  Security,
  SourceMeta
} from "../../shared/types";

export function source(label: string, sourceUrl: string, confidence: SourceMeta["confidence"] = "estimated", note?: string): SourceMeta {
  const now = new Date().toISOString();
  return {
    sourceUrl,
    label,
    retrievedAt: now,
    asOfDate: now.slice(0, 10),
    confidence,
    note
  };
}

export const officialSources = {
  purchases: "https://www.strategy.com/purchases",
  debt: "https://www.strategy.com/debt",
  credit: "https://www.strategy.com/credit",
  strc: "https://www.strategy.com/strc/learn",
  strd: "https://www.strategy.com/strd/learn",
  strf: "https://www.strategy.com/strf/learn",
  strk: "https://www.strategy.com/strk/learn",
  streSec: "https://www.sec.gov/Archives/edgar/data/1050446/000119312525272591/d22199d424b5.htm",
  secSubmissions: "https://data.sec.gov/submissions/CIK0001050446.json"
};

export const fallbackPreferred: PreferredSeries[] = [
  {
    symbol: "STRC",
    label: "Stretch Preferred STRC",
    notionalUsd: 17_510_000_000,
    dividendRatePct: 14.5,
    annualDividendUsd: 0,
    floating: true,
    source: source("STRC 官网/估算", officialSources.strc, "estimated", "待官网结构化字段校准")
  },
  {
    symbol: "STRD",
    label: "Stride Preferred STRD",
    notionalUsd: 4_000_000_000,
    dividendRatePct: 13,
    annualDividendUsd: 0,
    floating: false,
    source: source("STRD 官网/估算", officialSources.strd, "estimated", "待官网结构化字段校准")
  },
  {
    symbol: "STRK",
    label: "Strike Preferred STRK",
    notionalUsd: 2_100_000_000,
    dividendRatePct: 8,
    annualDividendUsd: 0,
    floating: false,
    source: source("STRK 官网/估算", officialSources.strk, "estimated", "压力测试默认可上调")
  },
  {
    symbol: "STRF",
    label: "Strife Preferred STRF",
    notionalUsd: 1_620_000_000,
    dividendRatePct: 10,
    annualDividendUsd: 0,
    floating: false,
    source: source("STRF 官网/估算", officialSources.strf, "estimated", "待官网结构化字段校准")
  },
  {
    symbol: "STRE",
    label: "Stream Preferred STRE",
    notionalUsd: 715_000_000,
    dividendRatePct: 10,
    annualDividendUsd: 0,
    floating: false,
    source: source("STRE SEC 424B5/估算", officialSources.streSec, "estimated", "欧元发行按默认汇率折算")
  }
].map((item) => ({ ...item, annualDividendUsd: Math.round(item.notionalUsd * (item.dividendRatePct / 100)) }));

export const fallbackDebt: DebtInstrument[] = [
  {
    id: "2027-convertible",
    label: "Convertible notes due 2027",
    principalUsd: 1_050_000_000,
    couponPct: 0,
    annualInterestUsd: 0,
    maturityYear: 2027,
    convertible: true,
    source: source("Strategy Debt", officialSources.debt, "estimated")
  },
  {
    id: "2028-convertible",
    label: "Convertible notes due 2028",
    principalUsd: 1_010_000_000,
    couponPct: 0.625,
    annualInterestUsd: 0,
    maturityYear: 2028,
    convertible: true,
    source: source("Strategy Debt", officialSources.debt, "estimated")
  },
  {
    id: "2030-convertible",
    label: "Convertible notes due 2030",
    principalUsd: 3_000_000_000,
    couponPct: 0,
    annualInterestUsd: 0,
    maturityYear: 2030,
    convertible: true,
    source: source("Strategy Debt", officialSources.debt, "estimated")
  },
  {
    id: "2032-convertible",
    label: "Convertible notes due 2032",
    principalUsd: 2_000_000_000,
    couponPct: 0,
    annualInterestUsd: 0,
    maturityYear: 2032,
    convertible: true,
    source: source("Strategy Debt", officialSources.debt, "estimated")
  }
].map((item) => ({ ...item, annualInterestUsd: Math.round(item.principalUsd * (item.couponPct / 100)) }));

export const fallbackAtm: AtmProgram[] = [
  {
    symbol: "MSTR",
    label: "MSTR Common ATM",
    type: "common",
    authorizedUsd: 21_000_000_000,
    soldUsd: 0,
    remainingUsd: 21_000_000_000,
    color: "#8fdc5c",
    source: source("Strategy ATM disclosure", officialSources.secSubmissions, "estimated")
  },
  {
    symbol: "STRC",
    label: "STRC ATM",
    type: "preferred",
    authorizedUsd: 21_000_000_000,
    soldUsd: 3_490_000_000,
    remainingUsd: 17_510_000_000,
    color: "#64c7ff",
    source: source("STRC ATM disclosure", officialSources.strc, "estimated")
  },
  {
    symbol: "STRD",
    label: "STRD ATM",
    type: "preferred",
    authorizedUsd: 4_000_000_000,
    soldUsd: 0,
    remainingUsd: 4_000_000_000,
    color: "#b993ff",
    source: source("STRD ATM disclosure", officialSources.strd, "estimated")
  },
  {
    symbol: "STRK",
    label: "STRK ATM",
    type: "preferred",
    authorizedUsd: 2_100_000_000,
    soldUsd: 0,
    remainingUsd: 2_100_000_000,
    color: "#9ee269",
    source: source("STRK ATM disclosure", officialSources.strk, "estimated")
  },
  {
    symbol: "STRF",
    label: "STRF ATM",
    type: "preferred",
    authorizedUsd: 1_620_000_000,
    soldUsd: 0,
    remainingUsd: 1_620_000_000,
    color: "#f6b84c",
    source: source("STRF ATM disclosure", officialSources.strf, "estimated")
  }
];

export const fallbackOperations: BtcOperation[] = [
  {
    id: "initial-snapshot",
    date: new Date().toISOString().slice(0, 10),
    action: "hold",
    btcAmount: 640_000,
    averagePriceUsd: 73_983,
    costUsd: 47_349_000_000,
    description: "BTC 持仓基线，启动后由 Strategy purchases 页面和新闻稿刷新",
    source: source("Strategy Purchases", officialSources.purchases, "estimated")
  }
];

export function fallbackSecurities(btcPriceUsd: number, mstrPriceUsd: number): Security[] {
  return [
    {
      symbol: "BTC",
      name: "Bitcoin",
      type: "bitcoin",
      priceUsd: btcPriceUsd,
      source: source("CoinGecko simple price", "https://api.coingecko.com/api/v3/simple/price", "parsed")
    },
    {
      symbol: "MSTR",
      name: "Strategy common stock",
      type: "common",
      priceUsd: mstrPriceUsd,
      source: source("Stooq quote", "https://stooq.com/q/l/?s=mstr.us&f=sd2t2ohlcv&h&e=csv", "parsed")
    }
  ];
}

export function fallbackCashUsd(): number {
  return 1_100_000_000;
}

export function fallbackBtcHoldings(): number {
  return fallbackOperations[0].btcAmount;
}

export function fallbackBtcCostBasis(): number {
  return fallbackOperations[0].costUsd ?? 47_349_000_000;
}

export function enrichSeries(series: PreferredSeries[]): PreferredSeries[] {
  return series.map((item) => ({
    ...item,
    annualDividendUsd: Math.round(item.notionalUsd * (item.dividendRatePct / 100))
  }));
}

export function enrichDebt(debt: DebtInstrument[]): DebtInstrument[] {
  return debt.map((item) => ({
    ...item,
    annualInterestUsd: Math.round(item.principalUsd * (item.couponPct / 100))
  }));
}

export const fallbackAnnualObligation =
  annualPreferredDividend(fallbackPreferred) + annualDebtInterest(fallbackDebt);
