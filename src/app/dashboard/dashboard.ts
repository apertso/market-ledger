import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MarketStore } from '../market/market-store';
import { QuantityPipe } from '../market/quantity-pipe';
@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DecimalPipe, QuantityPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly market = inject(MarketStore);
}
