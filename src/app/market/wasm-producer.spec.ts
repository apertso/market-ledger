import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadProducer } from './wasm-producer';

describe('Wasm loading errors', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('reports a missing asset with its HTTP status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadProducer('producer.wasm', 5, 42)).rejects.toThrow('HTTP 404');
  });

  it('reports corrupt Wasm bytes instead of starting a JavaScript fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }),
    );
    await expect(loadProducer('producer.wasm', 5, 42)).rejects.toThrow();
  });
});
