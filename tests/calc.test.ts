import { describe, expect, it } from "vitest";
import {
  annualDebtInterest,
  annualPreferredDividend,
  coverageMonths,
  runScenario
} from "../src/shared/calc";
import type { AtmProgram, DebtInstrument, PreferredSeries, ReserveSnapshot } from "../src/shared/types";

const source = {
  sourceUrl: "fixture",
  label: "fixture",
  retrievedAt: "2026-06-23T00:00:00.000Z",
  asOfDate: "2026-06-23",
  confidence: "reported" as const
};

describe("MSTR calculations", () => {
  it("computes preferred dividends and debt interest", () => {
    const preferred: PreferredSeries[] = [
      { symbol: "STRC", label: "STRC", notionalUsd: 10_000, dividendRatePct: 10, annualDividendUsd: 0, floating: true, source }
    ];
    const debt: DebtInstrument[] = [
      { id: "d1", label: "Debt", principalUsd: 20_000, couponPct: 2.5, annualInterestUsd: 0, maturityYear: 2030, convertible: true, source }
    ];

    expect(annualPreferredDividend(preferred)).toBe(1000);
    expect(annualDebtInterest(debt)).toBe(500);
  });

  it("turns annual obligations into coverage months", () => {
    expect(coverageMonths(1_200, 600)).toBe(24);
    expect(coverageMonths(1_200, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it("scores stressed scenarios with debt principal and thin ATM execution", () => {
    const atm: AtmProgram[] = [
      { symbol: "MSTR", label: "MSTR", type: "common", authorizedUsd: 10_000, soldUsd: 2_000, remainingUsd: 8_000, color: "#8fdc5c", source }
    ];
    const preferred: PreferredSeries[] = [
      { symbol: "STRK", label: "STRK", notionalUsd: 10_000, dividendRatePct: 8, annualDividendUsd: 800, floating: false, source }
    ];
    const debt: DebtInstrument[] = [
      { id: "d1", label: "Debt", principalUsd: 5_000, couponPct: 2, annualInterestUsd: 100, maturityYear: 2028, convertible: true, source }
    ];
    const reserve: ReserveSnapshot = {
      cashUsd: 1_000,
      bitcoinHoldings: 2,
      bitcoinMarketValueUsd: 200_000,
      bitcoinCostBasisUsd: 80_000,
      annualPreferredDividendUsd: 800,
      annualDebtInterestUsd: 100,
      annualDebtAndDividendUsd: 900,
      debtPrincipalUsd: 5_000,
      netCashAfterDebtPrincipalUsd: -4_000,
      cashCoverageMonths: 13.3,
      atmCoverageYears: 8.8,
      allLiquidityCoverageYears: 10,
      source
    };

    const result = runScenario(
      { reserve, atmPrograms: atm, preferredSeries: preferred, debt },
      {
        btcPriceUsd: 40_000,
        mstrPriceUsd: 300,
        atmExecutionPct: 10,
        preferredRateShockBps: 300,
        marketDiscountPct: 35,
        streEurUsd: 1.1,
        includeDebtPrincipal: true,
        sellBtcPct: 0
      }
    );

    expect(result.riskLevel).toMatch(/high|critical/);
    expect(result.bottlenecks.length).toBeGreaterThan(2);
  });
});
