import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
        {
          provide: MarketStore,
          useValue: { settings: signal(DEFAULT_SETTINGS), apply },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
  });

  it('editing leaves the active producer unchanged', async () => {
    fixture.componentInstance.form.controls.updatesPerBatch.setValue(1000);
    fixture.componentInstance.form.controls.intervalMs.setValue(50);
    await fixture.whenStable();
    expect(apply).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.updatesPerBatch.value).toBe(1000);
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
    expect(fixture.nativeElement.querySelector('[role=status]').textContent).toContain('Applied');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#instrumentCount');
    input.value = '25';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
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
    expect(fixture.nativeElement.querySelector('#instrumentCount-error').getAttribute('role')).toBe(
      'alert',
    );
    expect(fixture.nativeElement.querySelector('#instrumentCount-error').textContent).toContain(
      'whole number',
    );
  });
});
