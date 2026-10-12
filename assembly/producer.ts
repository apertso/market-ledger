// Seven u32 fields per trade; the layout is documented in src/app/market/model.ts.
const output = new StaticArray<u32>(1000 * 7);
const midpoints = new StaticArray<i32>(50);
let instrumentCount: i32 = 0;
let randomState: u32 = 1;

function random(): u32 {
  let x = randomState;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  randomState = x;
  return x;
}

export function initialize(count: i32, seed: u32): void {
  assert(count >= 1 && count <= 50);
  instrumentCount = count;
  randomState = seed == 0 ? 1 : seed;
  for (let i = 0; i < count; i++) {
    midpoints[i] = 10000 + i * 2500 + i32(random() % 10000);
  }
}

// Reuses one fixed output buffer; no allocations or host randomness per batch.
export function generate(size: i32): usize {
  assert(instrumentCount > 0 && size >= 1 && size <= 1000);
  for (let i = 0; i < size; i++) {
    const instrument = i32(random() % u32(instrumentCount));
    const previous = midpoints[instrument];
    const midpoint = min(100000000, max(2, previous + i32(random() % 11) - 5));
    midpoints[instrument] = midpoint;
    const spread = 1 + i32(random() % 12);
    const bid = max(1, midpoint - spread / 2);
    const ask = bid + spread;
    const offset = i * 7;
    output[offset] = u32(instrument);
    output[offset + 1] = u32((random() & 1) == 0 ? bid : ask);
    output[offset + 2] = 1 + (random() % 100);
    output[offset + 3] = u32(bid);
    output[offset + 4] = u32(ask);
    output[offset + 5] = random() % 1001;
    output[offset + 6] = random() % 1001;
  }
  return changetype<usize>(output);
}
