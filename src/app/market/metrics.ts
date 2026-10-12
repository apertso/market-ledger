import { instrumentSymbol, MarketRow, MarketSnapshot, UPDATE_STRIDE } from './model';

export class MarketMetrics {
  private readonly rows: MarketRow[];
  private readonly notionals: bigint[];
  private tradeCount = 0;

  constructor(instrumentCount: number) {
    this.rows = Array.from({ length: instrumentCount }, (_, index) => ({
      symbol: instrumentSymbol(index),
      lastCents: null,
      spreadCents: null,
      volume: 0n,
      vwapCents: null,
      imbalance: null,
    }));
    this.notionals = Array<bigint>(instrumentCount).fill(0n);
  }

  consume(batch: Uint32Array): void {
    if (batch.length % UPDATE_STRIDE !== 0) throw new Error('Invalid market batch length.');

    for (let offset = 0; offset < batch.length; offset += UPDATE_STRIDE) {
      const [index, price, quantity, bid, ask, bidQuantity, askQuantity] = batch.subarray(
        offset,
        offset + UPDATE_STRIDE,
      );
      const row = this.rows[index];
      if (!row) throw new Error('Invalid instrument index.');

      row.lastCents = price;
      row.spreadCents = ask - bid;
      row.volume += BigInt(quantity);
      this.notionals[index] += BigInt(price) * BigInt(quantity);
      const bookQuantity = bidQuantity + askQuantity;
      row.imbalance = bookQuantity === 0 ? null : (bidQuantity - askQuantity) / bookQuantity;
      this.tradeCount++;
    }
  }

  snapshot(): MarketSnapshot {
    return {
      tradeCount: this.tradeCount,
      rows: this.rows.map((row, index) => {
        const notional = this.notionals[index];
        // Divide before converting so long-running integer totals keep their precision.
        const vwapCents =
          row.volume === 0n
            ? null
            : Number(notional / row.volume) + Number(notional % row.volume) / Number(row.volume);
        return { ...row, vwapCents };
      }),
    };
  }
}
