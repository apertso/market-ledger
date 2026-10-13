import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketStore } from '../market/market-store';
import { MarketMetrics } from '../market/metrics';
import { MarketSnapshot } from '../market/model';
import { Dashboard } from './dashboard';

describe('market dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let metrics: MarketMetrics;
  let snapshot: WritableSignal<MarketSnapshot>;

  beforeEach(async () => {
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return new DOMRect(0, -window.scrollY, 1024, this.tagName === 'TR' ? 36 : 0);
    });
    metrics = new MarketMetrics(1);
    snapshot = signal(metrics.snapshot());
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: MarketStore,
          useValue: {
            snapshot,
            error: signal(null),
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

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
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

  it('mounts a bounded row range and reads current totals when scrolling to an offscreen instrument', async () => {
    metrics = new MarketMetrics(50);
    snapshot.set(metrics.snapshot());
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('table').getAttribute('aria-rowcount')).toBe('51');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBeLessThan(50);
    expect(fixture.nativeElement.textContent).not.toContain('SIM50');

    metrics.consume(new Uint32Array([49, 10200, 30, 10196, 10200, 600, 400]));
    snapshot.set(metrics.snapshot());
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('SIM50');

    const originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1700 });
    try {
      window.dispatchEvent(new Event('scroll'));
      await fixture.whenStable();
      const lastRow: HTMLElement = fixture.nativeElement.querySelector('[data-index="49"]');
      expect(lastRow).not.toBeNull();
      expect(lastRow.textContent).toContain('SIM50');
      expect(lastRow.getAttribute('aria-rowindex')).toBe('51');
      expect(lastRow.querySelector('[data-label="Volume"]')?.textContent).toContain('30');
      expect(lastRow.querySelector('[data-label="Last price"]')?.textContent).toContain('$102.00');
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBeLessThan(50);

      snapshot.set(new MarketMetrics(1).snapshot());
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('table').getAttribute('aria-rowcount')).toBe('2');
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
      expect(fixture.nativeElement.textContent).toContain('ALFA');
      expect(fixture.nativeElement.textContent).not.toContain('SIM50');
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY });
    }
  });
});
