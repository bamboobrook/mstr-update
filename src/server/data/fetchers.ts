import * as cheerio from "cheerio";
import {
  enrichDebt,
  enrichSeries,
  fallbackAtm,
  fallbackBtcCostBasis,
  fallbackBtcHoldings,
  fallbackCashUsd,
  fallbackDebt,
  fallbackOperations,
  fallbackPreferred,
  fallbackSecurities,
  officialSources,
  source
} from "./fallback";
import type {
  AtmProgram,
  BtcOperation,
  DebtInstrument,
  PreferredSeries,
  Security,
  SourceMeta
} from "../../shared/types";

export interface FetchedData {
  securities: Security[];
  cashUsd: number;
  btcHoldings: number;
  btcCostBasisUsd: number;
  preferredSeries: PreferredSeries[];
  debt: DebtInstrument[];
  atmPrograms: AtmProgram[];
  operations: BtcOperation[];
  sources: SourceMeta[];
  warnings: string[];
}

async function fetchText(url: string, timeoutMs = 12_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "mstr-update/0.1 contact: local-dashboard",
        accept: "text/html,application/json,text/plain,*/*"
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function numbersAround(text: string, keyword: string, limit = 4): number[] {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx < 0) return [];
  const slice = text.slice(Math.max(0, idx - 400), idx + 800);
  const matches = [...slice.matchAll(/(?:\$|€)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s?(billion|million|thousand|BTC)?/gi)];
  return matches
    .map((match) => toNumber(match[1], match[2]))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, limit);
}

function toNumber(raw: string, suffix?: string): number {
  const value = Number(raw.replace(/,/g, ""));
  const normalized = suffix?.toLowerCase();
  if (normalized === "billion") return value * 1_000_000_000;
  if (normalized === "million") return value * 1_000_000;
  if (normalized === "thousand") return value * 1_000;
  return value;
}

function textFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script,style,noscript").remove();
  return $.text().replace(/\s+/g, " ").trim();
}

export async function fetchMarketPrices(): Promise<{ btcPriceUsd: number; mstrPriceUsd: number; sources: SourceMeta[]; warnings: string[] }> {
  const warnings: string[] = [];
  let btcPriceUsd = 105_000;
  let mstrPriceUsd = 360;
  const sources: SourceMeta[] = [];

  try {
    const json = JSON.parse(
      await fetchText("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
    ) as { bitcoin?: { usd?: number; usd_24h_change?: number } };
    if (json.bitcoin?.usd) {
      btcPriceUsd = json.bitcoin.usd;
      sources.push(source("CoinGecko BTC spot", "https://api.coingecko.com/api/v3/simple/price", "parsed"));
    }
  } catch (error) {
    warnings.push(`BTC price fallback used: ${(error as Error).message}`);
  }

  const quoteAttempts = [
    async () => {
      const url = "https://query1.finance.yahoo.com/v8/finance/chart/MSTR?range=1d&interval=1d";
      const json = JSON.parse(await fetchText(url)) as {
        chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number } }> };
      };
      const meta = json.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice ?? meta?.previousClose;
      if (!price) throw new Error("Yahoo response did not include regularMarketPrice");
      return { price, source: source("Yahoo Finance MSTR delayed quote", url, "parsed") };
    },
    async () => {
      const url = "https://stooq.com/q/l/?s=mstr.us&f=sd2t2ohlcv&h&e=csv";
      const csv = await fetchText(url);
      const lines = csv.trim().split(/\r?\n/);
      const values = lines[1]?.split(",");
      const close = Number(values?.[6]);
      if (!Number.isFinite(close) || close <= 0) throw new Error("Stooq response did not include close");
      return { price: close, source: source("Stooq MSTR delayed quote", url, "parsed") };
    }
  ];

  let quoteError = "";
  for (const attempt of quoteAttempts) {
    try {
      const result = await attempt();
      mstrPriceUsd = result.price;
      sources.push(result.source);
      quoteError = "";
      break;
    } catch (error) {
      quoteError = (error as Error).message;
    }
  }
  if (quoteError) warnings.push(`MSTR price fallback used: ${quoteError}`);

  return { btcPriceUsd, mstrPriceUsd, sources, warnings };
}

export async function fetchStrategyPages(): Promise<{
  cashUsd: number;
  btcHoldings: number;
  btcCostBasisUsd: number;
  preferredSeries: PreferredSeries[];
  debt: DebtInstrument[];
  atmPrograms: AtmProgram[];
  operations: BtcOperation[];
  sources: SourceMeta[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const sources: SourceMeta[] = [];
  let cashUsd = fallbackCashUsd();
  let btcHoldings = fallbackBtcHoldings();
  let btcCostBasisUsd = fallbackBtcCostBasis();
  let preferredSeries = fallbackPreferred;
  let debt = fallbackDebt;
  let atmPrograms = fallbackAtm;
  let operations = fallbackOperations;

  try {
    const html = await fetchText(officialSources.purchases);
    const text = textFromHtml(html);
    const btcCandidates = numbersAround(text, "bitcoin", 12).filter((value) => value > 100_000 && value < 2_000_000);
    const totalBtc = btcCandidates.sort((a, b) => b - a)[0];
    if (totalBtc) btcHoldings = totalBtc;

    const costCandidates = numbersAround(text, "aggregate purchase price", 8).filter((value) => value > 10_000_000_000);
    if (costCandidates[0]) btcCostBasisUsd = costCandidates[0];

    operations = [
      {
        ...fallbackOperations[0],
        btcAmount: btcHoldings,
        costUsd: btcCostBasisUsd,
        description: "Strategy purchases 页面解析到的 BTC 持仓基线",
        source: source("Strategy BTC purchases", officialSources.purchases, "parsed")
      }
    ];
    sources.push(source("Strategy BTC purchases", officialSources.purchases, "parsed"));
  } catch (error) {
    warnings.push(`Strategy purchases fallback used: ${(error as Error).message}`);
  }

  try {
    const html = await fetchText(officialSources.debt);
    const text = textFromHtml(html);
    const principalCandidates = numbersAround(text, "principal", 20).filter((value) => value >= 100_000_000);
    if (principalCandidates.length >= 2) {
      const years = [...text.matchAll(/\b(202[6-9]|203[0-9]|204[0-9])\b/g)].map((match) => Number(match[1]));
      debt = enrichDebt(
        principalCandidates.slice(0, 6).map((principal, index) => ({
          id: `parsed-debt-${index + 1}`,
          label: `Parsed debt tranche ${index + 1}`,
          principalUsd: principal,
          couponPct: fallbackDebt[index]?.couponPct ?? 0,
          annualInterestUsd: 0,
          maturityYear: years[index] ?? fallbackDebt[index]?.maturityYear ?? 2030,
          convertible: true,
          source: source("Strategy Debt parsed", officialSources.debt, "parsed")
        }))
      );
    }
    sources.push(source("Strategy Debt", officialSources.debt, "parsed"));
  } catch (error) {
    warnings.push(`Strategy debt fallback used: ${(error as Error).message}`);
  }

  try {
    const html = await fetchText(officialSources.credit);
    const text = textFromHtml(html);
    const cashCandidates = numbersAround(text, "USD Reserve", 8).filter((value) => value > 100_000_000);
    if (cashCandidates[0]) cashUsd = cashCandidates[0];
    sources.push(source("Strategy Credit / USD Reserve", officialSources.credit, "parsed"));
  } catch (error) {
    warnings.push(`Strategy credit fallback used: ${(error as Error).message}`);
  }

  const preferredFetches = await Promise.allSettled(
    fallbackPreferred.map(async (series) => {
      const url = officialSources[series.symbol.toLowerCase() as keyof typeof officialSources] ?? series.source.sourceUrl;
      const html = await fetchText(url);
      const text = textFromHtml(html);
      const rate = numbersAround(text, "dividend", 10)
        .map((value) => (value > 100 ? value / 100 : value))
        .find((value) => value > 1 && value < 30);
      const notional = numbersAround(text, "ATM", 12).find((value) => value > 100_000_000) ?? series.notionalUsd;
      return {
        ...series,
        dividendRatePct: rate ?? series.dividendRatePct,
        notionalUsd: notional,
        source: source(`${series.symbol} preferred`, url, rate || notional ? "parsed" : "estimated")
      };
    })
  );
  if (preferredFetches.some((item) => item.status === "fulfilled")) {
    preferredSeries = enrichSeries(
      preferredFetches.map((item, index) =>
        item.status === "fulfilled" ? item.value : { ...fallbackPreferred[index], source: { ...fallbackPreferred[index].source, confidence: "stale" } }
      )
    );
    preferredSeries.forEach((item) => sources.push(item.source));
  }
  preferredFetches.forEach((item, index) => {
    if (item.status === "rejected") warnings.push(`${fallbackPreferred[index].symbol} preferred fallback used: ${item.reason.message}`);
  });

  atmPrograms = fallbackAtm.map((atm) => {
    const matching = preferredSeries.find((series) => series.symbol === atm.symbol);
    if (!matching) return atm;
    return {
      ...atm,
      remainingUsd: Math.max(0, matching.notionalUsd),
      source: matching.source
    };
  });

  return {
    cashUsd,
    btcHoldings,
    btcCostBasisUsd,
    preferredSeries,
    debt,
    atmPrograms,
    operations,
    sources,
    warnings
  };
}

export async function fetchAllData(): Promise<FetchedData> {
  const market = await fetchMarketPrices();
  const strategy = await fetchStrategyPages();
  const securities = fallbackSecurities(market.btcPriceUsd, market.mstrPriceUsd);

  return {
    securities,
    cashUsd: strategy.cashUsd,
    btcHoldings: strategy.btcHoldings,
    btcCostBasisUsd: strategy.btcCostBasisUsd,
    preferredSeries: strategy.preferredSeries,
    debt: strategy.debt,
    atmPrograms: strategy.atmPrograms,
    operations: strategy.operations,
    sources: [...market.sources, ...strategy.sources, ...securities.map((security) => security.source)],
    warnings: [...market.warnings, ...strategy.warnings]
  };
}
