import { describe, it, expect } from 'vitest';
import { calculatePrice, MAX_SWING } from '../src/lib/pricing.js';

describe('calculatePrice', () => {
  it('raises the price when usage beats the goal', () => {
    // Used 15 of a 30-min budget → well under goal → price should rise.
    const { newPrice, pctChange } = calculatePrice(100, 30, 15);
    expect(newPrice).toBeGreaterThan(100);
    expect(pctChange).toBeGreaterThan(0);
  });

  it('drops the price when usage exceeds the goal', () => {
    // Used 60 of a 30-min budget → over goal → price should fall.
    const { newPrice, pctChange } = calculatePrice(100, 30, 60);
    expect(newPrice).toBeLessThan(100);
    expect(pctChange).toBeLessThan(0);
  });

  it('leaves the price flat when usage exactly meets the goal', () => {
    const { newPrice, pctChange } = calculatePrice(100, 30, 30);
    expect(newPrice).toBeCloseTo(100, 10);
    expect(pctChange).toBeCloseTo(0, 10);
  });

  it('clamps a huge overage to the max downward swing', () => {
    // Massive overage would blow past -30% without clamping.
    const { pctChange } = calculatePrice(100, 30, 100000);
    expect(pctChange).toBeCloseTo(-MAX_SWING * 100, 10);
  });

  it('clamps a huge underage to the max upward swing', () => {
    const { pctChange } = calculatePrice(100, 300, 1);
    expect(pctChange).toBeCloseTo(MAX_SWING * 100, 10);
  });

  it('never lets a price fall below the floor of 1', () => {
    // Repeatedly crashing a low price must not go below 1.
    const { newPrice } = calculatePrice(1.2, 30, 100000);
    expect(newPrice).toBeGreaterThanOrEqual(1);
  });

  it('scales the move with the size of the miss', () => {
    const small = calculatePrice(100, 30, 35); // slightly over
    const big = calculatePrice(100, 30, 90); // way over
    expect(big.newPrice).toBeLessThan(small.newPrice);
  });
});
