# Market Ledger

A realtime Angular dashboard for fictional financial instruments. A stateful
AssemblyScript WebAssembly module generates trades inside a Web Worker; the
worker calculates cumulative metrics and sends bounded snapshots to the UI.

The application has two pages: **Market** and **Producer settings**. It starts
with 5 instruments, 100 updates per batch, and a 500 ms requested interval.

## Run locally

Use Node **24.19.0** (recorded in `.node-version`) and npm. Angular 22 requires
Node 22.22.3+, 24.15.0+, or 26+. Older Node 22 releases will not work.

```sh
npm ci
npm start
```

Open `http://localhost:4200`. `npm start` compiles the Wasm source before starting
Angular. Changes to `assembly/producer.ts` require restarting `npm start` or
running `npm run build:wasm` and reloading the browser.

```sh
npm test                 # Rebuild Wasm, test its actual binary, then Angular/Vitest tests
npm run build            # Rebuild Wasm and create an optimized static application
npm run format:check     # Check consistent formatting
```

Build output: `dist/market/browser`. Serve it over HTTP; `file://` cannot load
module workers. The generated Wasm binary is ignored by Git and always rebuilt.
No credentials or environment variables are required for the application.

## Behavior

- Last price and spread use the latest trade and bid/ask snapshot.
- Volume counts every trade quantity exactly once; VWAP uses cumulative traded
  notional divided by cumulative volume. Both reset only when a new run starts.
- Book imbalance is `(bidQuantity − askQuantity) / (bidQuantity + askQuantity)`.
- Before data arrives, price metrics and imbalance display a dash; volume is zero.
  A zero denominator also displays a dash.
- Pause stops generation. Resume preserves totals and waits one interval, without
  generating trades for the paused period.
- Editing settings affects only the draft. Apply clears the previous run and
  starts generation, including when the previous run was paused.
- Navigation keeps the same root service and worker. Replaced workers are
  terminated; messages from previous run IDs are rejected.
- Initialization and worker failures appear with a **Restart run** action.

## Code map

| Path                                 | Responsibility                                                        |
| ------------------------------------ | --------------------------------------------------------------------- |
| `assembly/producer.ts`               | Stateful seeded random walk and valid market updates in Wasm          |
| `src/app/market/wasm-producer.ts`    | Load Wasm and borrow its fixed output buffer                          |
| `src/app/market/producer-runtime.ts` | Worker scheduling, aggregation, pause/resume, and bounded publication |
| `src/app/market/metrics.ts`          | Per-instrument cumulative totals and formulas                         |
| `src/app/market/market-store.ts`     | Singleton worker lifetime, signals, and run isolation                 |
| `src/app/dashboard/`                 | Market table and controls                                             |
| `src/app/settings/`                  | Typed validated settings draft and explicit Apply                     |
| `tests/producer.test.mjs`            | Tests against the compiled Wasm module                                |

The Wasm output contains seven unsigned 32-bit words per trade: instrument index,
price cents, trade quantity, bid cents, ask cents, bid quantity, and ask quantity.
The worker consumes this borrowed memory synchronously before generating again.
See [MVP decisions](docs/mvp.md) for performance tradeoffs and interview talking
points, and [the assignment](docs/assignment.md) for the supplied requirements.

## Tests

Tests cover the worked VWAP example, zero denominators, instrument isolation,
exact integer totals, settings boundaries and fractional input, reset on Apply,
paused navigation, stale messages and delayed initialization, pause/resume with
fake clocks, publication backpressure, and meaningful loading errors.

Compiled-Wasm tests verify batch sizes, valid values, evolving prices, fixed-seed
reproducibility across calls, reset behavior, rejected inputs, and bounded memory.
Tests do not require long realtime waits. End-to-end tests and a formal benchmark
are outside the assignment scope.

## Optional automatic deployment

Nothing has been deployed. `.github/workflows/ci.yml` checks formatting, runs both
test suites, and builds on every push and pull request. Its Pages deployment job
is disabled until you set the repository variable `ENABLE_PAGES` to `true`.

When you are ready:

1. Create a public GitHub repository and push this project's `main` branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. In **Settings → Secrets and variables → Actions → Variables**, create
   `ENABLE_PAGES` with the value `true`.
4. Push a commit or run the workflow once. Later pushes to `main` automatically
   test, build, and redeploy; no manual deploy command is needed.
5. Add the repository and live-demo URLs to your submission.

The workflow computes the repository base path automatically, including
`owner.github.io` repositories. Hash routing avoids host-side fallback rules.
For a different static host, run `npm run build` and publish `dist/market/browser`.
See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Limits

This is a simulated feed, not an exchange model. Timing can drift under browser
load or background throttling. The maximum setting requests 20,000 updates/s
across all instruments; actual throughput depends on the browser. No benchmark
claim is made. Reloading starts a fresh run; settings and trades are not persisted.
