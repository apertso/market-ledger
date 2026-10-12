import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const bytes = await readFile(new URL('../public/producer.wasm', import.meta.url));

async function producer(count = 5, seed = 42) {
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: {
      abort: () => {
        throw new Error('Invalid generator input');
      },
    },
  });
  const { memory, initialize, generate } = instance.exports;
  initialize(count, seed);
  return {
    memory,
    initialize,
    generate: (size) => new Uint32Array(memory.buffer, generate(size), size * 7),
  };
}

test('the compiled Wasm produces exactly the requested batch sizes and valid trades', async () => {
  for (const count of [1, 5, 50]) {
    const wasm = await producer(count);
    const previous = new Map();
    for (const size of [1, 100, 1000]) {
      const batch = wasm.generate(size);
      assert.equal(batch.length, size * 7);
      for (let offset = 0; offset < batch.length; offset += 7) {
        const [instrument, price, quantity, bid, ask, bidQty, askQty] = batch.subarray(
          offset,
          offset + 7,
        );
        assert.ok(instrument >= 0 && instrument < count);
        assert.ok(bid > 0 && bid < ask);
        assert.ok(price === bid || price === ask);
        assert.ok(quantity > 0 && quantity <= 100);
        assert.ok(bidQty >= 0 && bidQty <= 1000);
        assert.ok(askQty >= 0 && askQty <= 1000);
        if (previous.has(instrument)) assert.ok(Math.abs(bid - previous.get(instrument)) <= 11);
        previous.set(instrument, bid);
      }
    }
  }
});

test('fixed seeds are reproducible, including across batch boundaries', async () => {
  const split = await producer();
  const first = [...split.generate(70)];
  const second = [...split.generate(30)];
  const combined = await producer();
  assert.deepEqual([...first, ...second], [...combined.generate(100)]);
  const otherSeed = await producer(5, 43);
  assert.notDeepEqual([...combined.generate(100)], [...otherSeed.generate(100)]);
});

test('reinitialization resets per-instrument and random state', async () => {
  const wasm = await producer();
  const original = [...wasm.generate(100)];
  wasm.generate(1000);
  wasm.initialize(5, 42);
  assert.deepEqual([...wasm.generate(100)], original);
});

test('repeated calls reuse a bounded Wasm memory buffer', async () => {
  const wasm = await producer(50);
  const buffer = wasm.memory.buffer;
  for (let i = 0; i < 100; i++) wasm.generate(1000);
  assert.equal(wasm.memory.buffer, buffer);
});

test('invalid counts and batch sizes are rejected, and a zero seed works', async () => {
  const wasm = await producer(1, 0);
  assert.equal(wasm.generate(1).length, 7);
  for (const count of [0, 51]) assert.throws(() => wasm.initialize(count, 1));
  for (const size of [0, 1001]) assert.throws(() => wasm.generate(size));
});
