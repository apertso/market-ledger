import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MarketStore } from '../market/market-store';
import { ProducerSettings, SETTING_LIMITS } from '../market/model';

const integer: ValidatorFn = (control) =>
  Number.isInteger(control.value) ? null : { integer: true };

function settingControl(value: number, key: keyof ProducerSettings): FormControl<number | null> {
  const { min, max } = SETTING_LIMITS[key];
  return new FormControl(value, [
    Validators.required,
    integer,
    Validators.min(min),
    Validators.max(max),
  ]);
}

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  protected readonly market = inject(MarketStore);
  readonly form = new FormGroup({
    instrumentCount: settingControl(this.market.settings().instrumentCount, 'instrumentCount'),
    updatesPerBatch: settingControl(this.market.settings().updatesPerBatch, 'updatesPerBatch'),
    intervalMs: settingControl(this.market.settings().intervalMs, 'intervalMs'),
  });
  protected readonly fields = [
    { key: 'instrumentCount', label: 'Instrument count', unit: 'instruments' },
    { key: 'updatesPerBatch', label: 'Updates per batch', unit: 'updates' },
    { key: 'intervalMs', label: 'Batch interval', unit: 'ms' },
  ] as const;
  protected readonly limits = SETTING_LIMITS;
  protected readonly applied = signal(false);

  apply(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    this.market.apply({
      instrumentCount: values.instrumentCount!,
      updatesPerBatch: values.updatesPerBatch!,
      intervalMs: values.intervalMs!,
    });

    this.form.markAsPristine();
    this.applied.set(true);
  }
}
