import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketStore } from '../market/market-store';
import { ProducerSettings, SETTING_LIMITS, validSettings } from '../market/model';

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
  imports: [ReactiveFormsModule, DecimalPipe, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  protected readonly market = inject(MarketStore);
  readonly form = new FormGroup({
    instrumentCount: settingControl(this.market.settings().instrumentCount, 'instrumentCount'),
    updatesPerBatch: settingControl(this.market.settings().updatesPerBatch, 'updatesPerBatch'),
    intervalMs: settingControl(this.market.settings().intervalMs, 'intervalMs'),
  });
  protected readonly fields = [
    {
      key: 'instrumentCount',
      label: 'Instrument count',
      hint: 'Fictional instruments in the market table.',
      unit: 'instruments',
    },
    {
      key: 'updatesPerBatch',
      label: 'Updates per batch',
      hint: 'Total trades across all instruments. An instrument can appear more than once.',
      unit: 'updates',
    },
    {
      key: 'intervalMs',
      label: 'Batch interval',
      hint: 'Requested time between generated batches.',
      unit: 'ms',
    },
  ] as const;
  protected readonly limits = SETTING_LIMITS;
  private readonly draft = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly draftRate = computed(() => {
    const values = this.draft();
    const settings = {
      instrumentCount: values.instrumentCount!,
      updatesPerBatch: values.updatesPerBatch!,
      intervalMs: values.intervalMs!,
    };
    return validSettings(settings) ? (settings.updatesPerBatch * 1000) / settings.intervalMs : null;
  });
  protected readonly appliedRun = signal<number | null>(null);

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
    this.appliedRun.set(this.market.runId());
  }
}
