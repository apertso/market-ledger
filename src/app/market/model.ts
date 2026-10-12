export interface ProducerSettings {
  instrumentCount: number;
  updatesPerBatch: number;
  intervalMs: number;
}

export const DEFAULT_SETTINGS: Readonly<ProducerSettings> = {
  instrumentCount: 5,
  updatesPerBatch: 100,
  intervalMs: 500,
};

export const SETTING_LIMITS = {
  instrumentCount: { min: 1, max: 50 },
  updatesPerBatch: { min: 1, max: 1000 },
  intervalMs: { min: 50, max: 2000 },
} as const;

export function validSettings(settings: ProducerSettings): boolean {
  return (Object.keys(SETTING_LIMITS) as (keyof ProducerSettings)[]).every((key) => {
    const value = settings[key];
    const { min, max } = SETTING_LIMITS[key];
    return Number.isInteger(value) && value >= min && value <= max;
  });
}

const SYMBOLS = ['ALFA', 'BETA', 'GAMA', 'DLTA', 'EPSI'];

export function instrumentSymbol(index: number): string {
  return SYMBOLS[index] ?? `SIM${String(index + 1).padStart(2, '0')}`;
}

export interface MarketRow {
  symbol: string;
  lastCents: number | null;
  spreadCents: number | null;
  volume: bigint;
  vwapCents: number | null;
  imbalance: number | null;
}

export interface MarketSnapshot {
  rows: MarketRow[];
  tradeCount: number;
}

export type ProducerStatus = 'initializing' | 'running' | 'paused' | 'error';

// Wasm ABI: instrument index, price cents, trade quantity, bid cents, ask cents,
// bid quantity, ask quantity. Each update occupies seven unsigned 32-bit words.
export const UPDATE_STRIDE = 7;

export type WorkerCommand =
  | { type: 'start'; runId: number; settings: ProducerSettings; wasmUrl: string; seed: number }
  | { type: 'pause' | 'resume' | 'ack'; runId: number };

export type WorkerEvent =
  | {
      type: 'state';
      runId: number;
      status: 'running' | 'paused';
      snapshot: MarketSnapshot;
    }
  | { type: 'snapshot'; runId: number; snapshot: MarketSnapshot }
  | { type: 'error'; runId: number; message: string };
