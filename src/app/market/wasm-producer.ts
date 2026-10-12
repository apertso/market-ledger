import { UPDATE_STRIDE } from './model';

export interface WasmProducer {
  generate(size: number): Uint32Array;
}

interface ProducerExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  initialize: (count: number, seed: number) => void;
  generate: (size: number) => number;
}

export async function loadProducer(
  url: string,
  count: number,
  seed: number,
): Promise<WasmProducer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load the Wasm producer (HTTP ${response.status}).`);

  // ArrayBuffer also works on static hosts without application/wasm MIME configuration.
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {
    env: {
      abort: () => {
        throw new Error('The Wasm producer rejected its input.');
      },
    },
  });
  const exports = instance.exports as ProducerExports;
  if (
    !(exports.memory instanceof WebAssembly.Memory) ||
    typeof exports.initialize !== 'function' ||
    typeof exports.generate !== 'function'
  ) {
    throw new Error('The Wasm producer has an incompatible interface.');
  }
  exports.initialize(count, seed);
  return {
    // The view is borrowed until the next generate call; consume it synchronously.
    generate: (size) =>
      new Uint32Array(exports.memory.buffer, exports.generate(size), size * UPDATE_STRIDE),
  };
}
