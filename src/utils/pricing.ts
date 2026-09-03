/** Commercial constants. Single source of truth — the licence flow, the
 *  earnings ledger, and the admin payout view all read from here. */

/** What a venue pays to license a piece, permanently. */
export const LICENSE_FEE_EUR = 30;

/** The artist's cut of each licence fee. Lumen keeps the remainder. */
export const ARTIST_SHARE_PCT = 0.7;

/** Minimum accrued balance before an artist is paid out. */
export const PAYOUT_THRESHOLD_EUR = 50;

/** An artist's share of a single licence, rounded to whole cents. */
export function artistShare(licenseFee: number = LICENSE_FEE_EUR): number {
  return Math.round(licenseFee * ARTIST_SHARE_PCT * 100) / 100;
}

/** Boost placements an artist can buy, priced per month in euro cents. */
export const BOOST_PRICES_CENTS = {
  featured_show: 7_500,
  homepage_feature: 15_000,
} as const;

export type BoostPlacement = keyof typeof BOOST_PRICES_CENTS;

/** Purchasable boost durations, with their bulk discount. */
export const BOOST_TERMS: Record<number, { discountPct: number }> = {
  1: { discountPct: 0 },
  3: { discountPct: 10 },
  6: { discountPct: 20 },
};

export const BOOST_LABELS: Record<BoostPlacement, string> = {
  featured_show: "Featured Show",
  homepage_feature: "Homepage Feature",
};

/** Total cents for a boost purchase, discount applied. */
export function boostTotalCents(placement: BoostPlacement, months: number): number {
  const term = BOOST_TERMS[months];
  if (!term) throw new Error(`Unsupported boost term: ${months}`);
  const gross = BOOST_PRICES_CENTS[placement] * months;
  return Math.round(gross * (1 - term.discountPct / 100));
}
