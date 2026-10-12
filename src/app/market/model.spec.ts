import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, ProducerSettings, SETTING_LIMITS, validSettings } from './model';

describe('producer settings validation', () => {
  it('accepts the defaults', () => expect(validSettings(DEFAULT_SETTINGS)).toBe(true));
  for (const key of Object.keys(SETTING_LIMITS) as (keyof ProducerSettings)[]) {
    const { min, max } = SETTING_LIMITS[key];
    it(`accepts both boundaries of ${key}`, () => {
      for (const value of [min, max])
        expect(validSettings({ ...DEFAULT_SETTINGS, [key]: value })).toBe(true);
    });
    it(`rejects invalid values for ${key}`, () => {
      for (const value of [min - 1, max + 1, min + 0.5, NaN, Infinity]) {
        expect(validSettings({ ...DEFAULT_SETTINGS, [key]: value })).toBe(false);
      }
    });
  }
});
