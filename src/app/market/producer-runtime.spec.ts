import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, WorkerEvent } from './model';
import { ProducerRuntime } from './producer-runtime';
import { WasmProducer } from './wasm-producer';

const start = {
  type: 'start' as const,
  runId: 1,
  settings: { ...DEFAULT_SETTINGS },
  wasmUrl: 'producer.wasm',
  seed: 1,
};
const batch = new Uint32Array([0, 10000, 10, 9999, 10000, 600, 400]);

describe('worker producer lifecycle', () => {
  const events: WorkerEvent[] = [];
  let generate = vi.fn((_size: number) => batch);
  let runtime: ProducerRuntime;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    events.length = 0;
    generate = vi.fn((_size: number) => batch);
    runtime = new ProducerRuntime(
      (event) => events.push(event),
      async () => ({ generate }),
    );
  });
  afterEach(() => vi.useRealTimers());

  it('generates at the requested interval and batch size', async () => {
    await runtime.handle(start);
    expect(generate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(generate).toHaveBeenCalledExactlyOnceWith(100);
    expect(events.at(-1)).toMatchObject({ type: 'snapshot', snapshot: { tradeCount: 1 } });
  });

  it('pauses generation and resumes totals without catching up paused time', async () => {
    await runtime.handle(start);
    vi.advanceTimersByTime(500);
    await runtime.handle({ type: 'pause', runId: 1 });
    expect(events.at(-1)).toMatchObject({ status: 'paused', snapshot: { tradeCount: 1 } });
    vi.advanceTimersByTime(100000);
    expect(generate).toHaveBeenCalledTimes(1);
    await runtime.handle({ type: 'resume', runId: 1 });
    expect(events.at(-1)).toMatchObject({ status: 'running', snapshot: { tradeCount: 1 } });
    await runtime.handle({ type: 'ack', runId: 1 });
    vi.advanceTimersByTime(499);
    expect(generate).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(events.at(-1)).toMatchObject({ snapshot: { tradeCount: 2 } });
  });

  it('bounds pending messages while counting every generated trade', async () => {
    await runtime.handle(start);
    vi.advanceTimersByTime(5000);
    expect(generate).toHaveBeenCalledTimes(10);
    expect(events.filter((event) => event.type === 'snapshot')).toHaveLength(1);
    await runtime.handle({ type: 'ack', runId: 1 });
    vi.advanceTimersByTime(500);
    expect(events.at(-1)).toMatchObject({
      snapshot: {
        tradeCount: 11,
        rows: expect.arrayContaining([expect.objectContaining({ volume: 110n })]),
      },
    });
  });

  it('caps publication frequency at high producer rates', async () => {
    await runtime.handle({ ...start, settings: { ...start.settings, intervalMs: 50 } });
    for (let i = 0; i < 20; i++) {
      vi.advanceTimersByTime(50);
      await runtime.handle({ type: 'ack', runId: 1 });
    }
    expect(generate).toHaveBeenCalledTimes(20);
    expect(events.filter((event) => event.type === 'snapshot')).toHaveLength(5);
    expect(events.at(-1)).toMatchObject({ snapshot: { tradeCount: 20 } });
  });

  it('pausing flushes every trade before the next regular UI refresh', async () => {
    await runtime.handle({ ...start, settings: { ...start.settings, intervalMs: 50 } });
    vi.advanceTimersByTime(150);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(events.filter((event) => event.type === 'snapshot')).toHaveLength(0);
    await runtime.handle({ type: 'pause', runId: 1 });
    expect(events.at(-1)).toMatchObject({ status: 'paused', snapshot: { tradeCount: 3 } });
    vi.advanceTimersByTime(1000);
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it('flushes the latest totals when paused with a snapshot pending', async () => {
    await runtime.handle(start);
    vi.advanceTimersByTime(1500);
    await runtime.handle({ type: 'pause', runId: 1 });
    expect(events.at(-1)).toMatchObject({ status: 'paused', snapshot: { tradeCount: 3 } });
  });

  it('applying settings clears totals and starts a paused producer', async () => {
    await runtime.handle(start);
    vi.advanceTimersByTime(500);
    await runtime.handle({ type: 'pause', runId: 1 });
    await runtime.handle({
      ...start,
      runId: 2,
      settings: { ...start.settings, instrumentCount: 1 },
    });
    expect(events.at(-1)).toMatchObject({
      runId: 2,
      status: 'running',
      snapshot: { tradeCount: 0 },
    });
    vi.advanceTimersByTime(500);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('ignores stale initialization results and stale controls', async () => {
    let resolve!: (producer: WasmProducer) => void;
    const delayed = new Promise<WasmProducer>((done) => {
      resolve = done;
    });
    const load = vi.fn().mockReturnValueOnce(delayed).mockResolvedValue({ generate });
    runtime = new ProducerRuntime((event) => events.push(event), load);
    const oldStart = runtime.handle(start);
    await runtime.handle({ ...start, runId: 2 });
    resolve({
      generate: vi.fn(() => {
        throw new Error('stale generator');
      }),
    });
    await oldStart;
    await runtime.handle({ type: 'pause', runId: 1 });
    vi.advanceTimersByTime(500);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(events.every((event) => event.runId === 2)).toBe(true);
  });

  it('reports initialization and generation errors and stops scheduling', async () => {
    runtime = new ProducerRuntime(
      (event) => events.push(event),
      async () => {
        throw new Error('HTTP 404');
      },
    );
    await runtime.handle(start);
    expect(events.at(-1)).toMatchObject({ type: 'error', message: 'HTTP 404' });
    runtime = new ProducerRuntime(
      (event) => events.push(event),
      async () => ({ generate }),
    );
    generate.mockImplementation(() => {
      throw new Error('Wasm trap');
    });
    await runtime.handle(start);
    vi.advanceTimersByTime(5000);
    expect(events.at(-1)).toMatchObject({ type: 'error', message: 'Wasm trap' });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
