import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketStore } from '../market/market-store';
import { MarketMetrics } from '../market/metrics';
import { MarketSnapshot } from '../market/model';
import { Dashboard } from './dashboard';

describe('market metric accessibility', () => {
  let fixture: ComponentFixture<Dashboard>;
  let metrics: MarketMetrics;
  let snapshot: WritableSignal<MarketSnapshot>;
  beforeEach(async () => {
    metrics = new MarketMetrics(1);
    snapshot = signal(metrics.snapshot());
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: MarketStore,
          useValue: {
            snapshot,
            status: signal('running'),
            pause: vi.fn(),
            resume: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
  });
  function cellNames(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('tbody td') as NodeListOf<HTMLElement>,
    ).map((cell) => cell.getAttribute('aria-label')!);
  }
  it('distinguishes unavailable metrics without relying on CSS or header layout', () => {
    expect(cellNames()).toEqual([
      'Last price unavailable',
      'Spread unavailable',
      'Volume 0',
      'VWAP unavailable',
      'Book imbalance unavailable',
    ]);
  });
  it('preserves each metric name and its formatted value after a trade', async () => {
    metrics.consume(new Uint32Array([0, 10200, 30, 10196, 10200, 600, 400]));
    snapshot.set(metrics.snapshot());
    await fixture.whenStable();
    expect(cellNames()).toEqual([
      'Last price $102.00',
      'Spread $0.04',
      'Volume 30',
      'VWAP $102.00',
      'Book imbalance +0.20',
    ]);
  });
});
