import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from './app.routes';
import { MarketStore } from './market/market-store';
import { MarketMetrics } from './market/metrics';
import { WorkerEvent } from './market/model';

describe('navigation and run lifetime', () => {
  beforeEach(() => {
    // jsdom does not implement window scrolling used by the dashboard virtualizer.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('preserves metrics and paused state across routes without creating another worker', async () => {
    const worker = {
      onmessage: null as ((event: MessageEvent<WorkerEvent>) => void) | null,
      postMessage: vi.fn(),
      terminate: vi.fn(),
    };
    const constructor = vi.fn(function () {
      return worker;
    });
    vi.stubGlobal('Worker', constructor);
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create('/');
    const store = TestBed.inject(MarketStore);
    const metrics = new MarketMetrics(5);
    metrics.consume(new Uint32Array([0, 10200, 30, 10196, 10200, 600, 400]));
    worker.onmessage?.({
      data: { type: 'state', runId: 1, status: 'paused', snapshot: metrics.snapshot() },
    } as MessageEvent<WorkerEvent>);
    await harness.navigateByUrl('/settings');
    await harness.navigateByUrl('/');
    expect(constructor).toHaveBeenCalledOnce();
    expect(store.status()).toBe('paused');
    expect(store.snapshot().rows[0].volume).toBe(30n);
    expect(harness.routeNativeElement?.textContent).toContain('Resume');
    expect(harness.routeNativeElement?.textContent).toContain('$102.00');
  });
});
