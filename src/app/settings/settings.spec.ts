import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../market/model';
import { MarketStore } from '../market/market-store';
import { Settings } from './settings';

describe('Settings form', () => {
  let fixture: ComponentFixture<Settings>;
  const apply = vi.fn();
  beforeEach(async () => {
    apply.mockClear();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([]),
        {
          provide: MarketStore,
          useValue: { settings: signal(DEFAULT_SETTINGS), runId: signal(2), apply },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
  });

  it('editing updates the preview without changing the active producer', async () => {
    fixture.componentInstance.form.controls.updatesPerBatch.setValue(1000);
    fixture.componentInstance.form.controls.intervalMs.setValue(50);
    await fixture.whenStable();
    expect(apply).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.rate').textContent).toContain('20,000');
  });

  it('applies a validated draft only on submit', async () => {
    fixture.componentInstance.form.setValue({
      instrumentCount: 50,
      updatesPerBatch: 1000,
      intervalMs: 50,
    });
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    button.click();
    await fixture.whenStable();
    expect(apply).toHaveBeenCalledExactlyOnceWith({
      instrumentCount: 50,
      updatesPerBatch: 1000,
      intervalMs: 50,
    });
    expect(fixture.nativeElement.querySelector('[role=status]').textContent).toContain('Run 2');
  });

  it('rejects missing, fractional, and out-of-range values and exposes errors', async () => {
    for (const value of [null, 0, 51, 1.5]) {
      fixture.componentInstance.form.controls.instrumentCount.setValue(value);
      fixture.componentInstance.apply();
      expect(apply).not.toHaveBeenCalled();
      expect(fixture.componentInstance.form.invalid).toBe(true);
    }
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#instrumentCount');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#instrumentCount-error').textContent).toContain(
      'whole number',
    );
    expect(fixture.nativeElement.querySelector('.rate').textContent).toContain('—');
  });
});
