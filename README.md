# Market Ledger

A realtime Angular 22 dashboard displaying last price, spread, cumulative volume,
VWAP, and book imbalance. A stateful AssemblyScript WebAssembly producer runs in
a Web Worker; the responsive market list uses virtual scrolling.

## Run locally

Use Node **24.19.0** (see `.node-version`) and npm.

```sh
npm ci
npm start
```

Open [localhost:4200](http://localhost:4200).

## Commands

```sh
npm test                 # Angular and compiled-Wasm tests
npm run build            # Production build
npm run format           # Format source files
npm run format:check     # Check formatting
```

Start, build, and test compile Wasm automatically. After editing
`assembly/producer.ts`, run `npm run build:wasm` and reload the browser.

Build output: `dist/market/browser`.

## Behavior

- Pause stops generation; Resume preserves cumulative totals.
- Settings take effect on Apply, which resets totals and starts a new run.
- Navigation preserves the active run. Reloading starts with the defaults.

See [assignment requirements](docs/assignment.md) and
[architecture decisions](docs/mvp.md) for details.
