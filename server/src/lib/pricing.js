// Core price model for the "stock market" of tracked apps.
//
// A stock's price rises when you beat your daily goal (used less time than
// budgeted) and falls when you exceed it. The daily move is proportional to how
// far off the goal you were, scaled by volatility and clamped to +/- MAX_SWING
// so a single day can't move a stock more than 30%. Prices never fall below 1.

export const VOLATILITY = 0.15;
export const MAX_SWING = 0.3;

/**
 * Compute the new price for an app-stock after a day of usage.
 *
 * @param {number} prevPrice     Price before this day's move.
 * @param {number} goalMinutes   The daily time budget for the app.
 * @param {number} actualMinutes Minutes actually spent in the app.
 * @returns {{ newPrice: number, pctChange: number }} New price and the day's
 *          percent change (already scaled to a percentage, e.g. 12.5 for +12.5%).
 */
export function calculatePrice(prevPrice, goalMinutes, actualMinutes) {
  const ratio = goalMinutes / actualMinutes;
  const rawChange = (ratio - 1) * VOLATILITY * 3;
  const pctChange = Math.max(-MAX_SWING, Math.min(MAX_SWING, rawChange));
  const newPrice = Math.max(1, prevPrice * (1 + pctChange));
  return { newPrice, pctChange: pctChange * 100 };
}
