import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketMetrics } from './metrics';
import { MarketStore } from './market-store';
import { DEFAULT_SETTINGS, WorkerEvent } from './model';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage?: (event: { data: WorkerEvent }) => void;
  onerror?: (event: { message: string; preventDefault: () => void }) => void;
  onmessageerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
  emit(data: WorkerEvent): void {
    this.onmessage?.({ data });
  }
}

describe('MarketStore', () => {
  let store: MarketStore;
  let worker: FakeWorker;
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
    store = TestBed.inject(MarketStore);
    worker = FakeWorker.instances[0];
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('starts exactly one worker with default settings', () => {
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'start', runId: 1, settings: DEFAULT_SETTINGS }),
    );
    expect(TestBed.inject(MarketStore)).toBe(store);
  });

  it('resets immediately on Apply and rejects every kind of stale event', () => {
    const metrics = new MarketMetrics(5);
    metrics.consume(new Uint32Array([0, 10000, 10, 9999, 10000, 1, 1]));
    worker.emit({ type: 'state', runId: 1, status: 'paused', snapshot: metrics.snapshot() });
    store.apply({ instrumentCount: 1, updatesPerBatch: 1000, intervalMs: 50 });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(store.snapshot().tradeCount).toBe(0);
    expect(store.snapshot().rows).toHaveLength(1);
    expect(store.status()).toBe('initializing');
    worker.emit({ type: 'snapshot', runId: 1, snapshot: metrics.snapshot() });
    worker.emit({ type: 'state', runId: 1, status: 'paused', snapshot: metrics.snapshot() });
    worker.emit({ type: 'error', runId: 1, message: 'Old failure' });
    worker.onerror?.({ message: 'Old worker crash', preventDefault: vi.fn() });
    expect(store.snapshot().tradeCount).toBe(0);
    expect(store.error()).toBeNull();
    expect(store.status()).toBe('initializing');
    FakeWorker.instances[1].emit({
      type: 'state',
      runId: 2,
      status: 'running',
      snapshot: new MarketMetrics(1).snapshot(),
    });
    expect(store.status()).toBe('running');
  });

  it('invalid settings leave the current run untouched', () => {
    expect(() => store.apply({ ...DEFAULT_SETTINGS, instrumentCount: 1.5 })).toThrow('integers');
    expect(store.runId()).toBe(1);
    expect(worker.terminate).not.toHaveBeenCalled();
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it('uses acknowledged worker state for pause and resume', () => {
    const snapshot = new MarketMetrics(5).snapshot();
    store.pause();
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    worker.emit({ type: 'state', runId: 1, status: 'running', snapshot });
    store.pause();
    expect(worker.postMessage).toHaveBeenLastCalledWith({ type: 'pause', runId: 1 });
    worker.emit({ type: 'state', runId: 1, status: 'paused', snapshot });
    store.resume();
    expect(worker.postMessage).toHaveBeenLastCalledWith({ type: 'resume', runId: 1 });
    expect(store.status()).toBe('paused');
    worker.emit({ type: 'state', runId: 1, status: 'running', snapshot });
    expect(store.status()).toBe('running');
  });

  it('acknowledges accepted snapshots and cleans up on errors and destruction', () => {
    worker.emit({ type: 'snapshot', runId: 1, snapshot: new MarketMetrics(5).snapshot() });
    expect(worker.postMessage).toHaveBeenLastCalledWith({ type: 'ack', runId: 1 });
    worker.onmessageerror?.();
    expect(store.status()).toBe('error');
    expect(store.error()).toContain('unreadable');
    expect(worker.terminate).toHaveBeenCalledOnce();
    store.apply(DEFAULT_SETTINGS);
    const replacement = FakeWorker.instances[1];
    TestBed.resetTestingModule();
    expect(replacement.terminate).toHaveBeenCalledOnce();
  });

  it('shows a meaningful error if Worker construction fails', () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('Workers blocked');
        }
      },
    );
    store.apply(DEFAULT_SETTINGS);
    expect(store.status()).toBe('error');
    expect(store.error()).toBe('Workers blocked');
  });
});
