import { describe, expect, it } from 'vitest';
import { MarketMetrics } from './metrics';

describe('MarketMetrics', () => {
  it('shows unavailable values and zero volume before the first trade', () => {
    expect(new MarketMetrics(1).snapshot()).toEqual({
      tradeCount: 0,
      rows: [
        {
          symbol: 'ALFA',
          lastCents: null,
          spreadCents: null,
          volume: 0n,
          vwapCents: null,
          imbalance: null,
        },
      ],
    });
  });

  it('matches the worked example and counts only trade quantities', () => {
    const metrics = new MarketMetrics(1);
    metrics.consume(
      new Uint32Array([0, 10000, 10, 9996, 10000, 100, 100, 0, 10200, 30, 10196, 10200, 600, 400]),
    );
    expect(metrics.snapshot().rows[0]).toEqual({
      symbol: 'ALFA',
      lastCents: 10200,
      spreadCents: 4,
      volume: 40n,
      vwapCents: 10150,
      imbalance: 0.2,
    });
    expect(metrics.snapshot().tradeCount).toBe(2);
  });

  it('keeps instruments and previously published snapshots isolated', () => {
    const metrics = new MarketMetrics(2);
    metrics.consume(new Uint32Array([0, 10000, 10, 9999, 10000, 5, 0]));
    const previous = metrics.snapshot();
    metrics.consume(new Uint32Array([1, 20000, 20, 19999, 20000, 0, 5]));
    expect(metrics.snapshot().rows[0]).toEqual(previous.rows[0]);
    expect(metrics.snapshot().rows[1].volume).toBe(20n);
    expect(metrics.snapshot().rows.map((row) => row.imbalance)).toEqual([1, -1]);
    expect(previous.rows[1].lastCents).toBeNull();
  });

  it('handles zero denominators without NaN or Infinity', () => {
    const metrics = new MarketMetrics(1);
    metrics.consume(new Uint32Array([0, 10000, 0, 9999, 10000, 0, 0]));
    expect(metrics.snapshot().rows[0].vwapCents).toBeNull();
    expect(metrics.snapshot().rows[0].imbalance).toBeNull();
  });

  it('does not round cumulative VWAP after each batch', () => {
    const metrics = new MarketMetrics(1);
    metrics.consume(new Uint32Array([0, 10001, 1, 10000, 10001, 1, 1]));
    metrics.consume(new Uint32Array([0, 10000, 2, 10000, 10001, 1, 1]));
    expect(metrics.snapshot().rows[0].vwapCents).toBeCloseTo(10000 + 1 / 3, 8);
  });

  it('accumulates notionals beyond Number.MAX_SAFE_INTEGER exactly', () => {
    const metrics = new MarketMetrics(1);
    const max = 0xffffffff;
    metrics.consume(new Uint32Array([0, max, max, max - 1, max, 0, 0]));
    metrics.consume(new Uint32Array([0, max - 1, max, max - 1, max, 0, 0]));
    expect(metrics.snapshot().rows[0].volume).toBe(2n * BigInt(max));
    expect(metrics.snapshot().rows[0].vwapCents).toBe(max - 0.5);
  });

  it('rejects malformed batches and unknown instruments', () => {
    const metrics = new MarketMetrics(1);
    expect(() => metrics.consume(new Uint32Array(1))).toThrow('length');
    expect(() => metrics.consume(new Uint32Array([1, 1, 1, 1, 2, 0, 0]))).toThrow('index');
  });
});
