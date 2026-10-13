import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { injectWindowVirtualizer } from '@tanstack/angular-virtual';
import { MarketStore } from '../market/market-store';
import { QuantityPipe } from '../market/quantity-pipe';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DecimalPipe, QuantityPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly market = inject(MarketStore);
  protected readonly rowCount = computed(() => this.market.snapshot().rows.length);
  protected readonly scrollMargin = signal(0);
  private readonly tableBody = viewChild<ElementRef<HTMLTableSectionElement>>('tableBody');
  private readonly rowElements = viewChildren<ElementRef<HTMLTableRowElement>>('virtualRow');
  private measuredWidth = 0;

  protected readonly virtualizer = injectWindowVirtualizer<HTMLTableRowElement>(() => ({
    count: this.rowCount(),
    estimateSize: () => (window.innerWidth <= 760 ? 112 : 36),
    overscan: 2,
    scrollMargin: this.scrollMargin(),
    measureElement: (element) => element.getBoundingClientRect().height,
    useApplicationRefTick: false,
  }));

  constructor() {
    afterRenderEffect({
      mixedReadWrite: () => {
        // A resize can change the height of every mobile row, including unmounted rows.
        const width = this.virtualizer.scrollRect()?.width ?? 0;
        if (width !== this.measuredWidth) {
          this.measuredWidth = width;
          this.virtualizer.measure();
        }

        this.market.error();
        const body = this.tableBody()?.nativeElement;
        if (body) this.scrollMargin.set(body.getBoundingClientRect().top + window.scrollY);

        for (const row of this.rowElements()) {
          this.virtualizer.measureElement(row.nativeElement);
        }
      },
    });
  }
}
