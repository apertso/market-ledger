# MVP decisions

All application requirements are in scope: two pages, all five metrics, genuine
stateful Wasm generation in a worker, validated settings, pause/resume, reset
isolation, meaningful errors, resource cleanup, tests, and a deployable static build.

The solution demonstrates the role's focus on realtime performance, automated
tests, and clear engineering decisions. A monorepo, backend, charting library,
trading actions, rolling windows, persistent settings, and external state library
do not improve this assignment's core behavior, so they are outside the MVP.

## Responsibilities

- **AssemblyScript:** deterministic seeded randomness, per-instrument price state,
  valid trades and current bid/ask snapshots; one reused output buffer.
- **Worker:** scheduling, pause/resume, cumulative aggregation, and snapshots.
- **Root Angular service:** one active worker, run identity, error recovery, and
  readonly signals that survive route changes.
- **Components:** semantic table, native validated form, and explicit user actions.

The UI uses a dense table on desktop and compact instrument groups on phones.
Every metric remains visible without opening details or scrolling horizontally.
Visible copy is limited to labels, current state, errors, and a short reset notice.

## Performance and numerical choices

Generation and aggregation cost O(batch size). Snapshot creation costs
O(instrument count), capped at 50; rendering scales with the mounted rows.
Memory contains per-instrument totals
and one fixed batch; no trade history accumulates. Snapshot messages are limited
to ten per second, with at most one data snapshot awaiting acknowledgment. A pause
state message always flushes the latest cumulative totals.

The 100 ms publication interval bounds updates separately from generation. The
maximum producer rate requests 20,000 trades/s; every trade contributes to totals.
TanStack Virtual mounts the visible rows plus a two-row buffer on each side,
using the normal page scrollbar. Measured row heights preserve mobile wrapping.
Only mounted rows evaluate formatting and update DOM bindings. Offscreen metrics
remain current in the worker and snapshots; scrolling mounts their latest values.

Volume and notional are BigInt values; generated prices stay in integer cents.
VWAP divides the integer totals before converting the remainder to a fractional
cent. Display formatting rounds the final price. Imbalance uses the current book
snapshot. Book quantities never contribute to traded volume.

Intervals are requested delays, not deadlines. The worker schedules the next batch
after the previous one completes. A slow or backgrounded browser reduces actual
generation; it does not catch up by producing a burst of fictional missed trades.
Pause clears the scheduled timer; resume waits one full interval.

Applying settings terminates the previous worker and resets values immediately.
Every result carries a monotonically increasing run ID, so queued old messages
and initialization failures cannot overwrite the new run.

## Deliberate choices

Standalone Angular 22 components, signals, OnPush, built-in template control flow,
and default zoneless change detection keep the UI current and small. Typed reactive
forms are sufficient for three numeric fields. Settings are loaded on demand.
Standalone and OnPush are Angular 22 defaults, so their decorator flags are
omitted. Component files follow the current feature-based naming convention.

AssemblyScript keeps installation and CI in one npm toolchain, with no Wasm binding
generator or Rust installation. Its TypeScript-like syntax is still compiled Wasm:
the random walk and xorshift random number generator execute inside the module.
Xorshift is intentionally simulation randomness, with a browser-generated seed.

Hash routing keeps both pages directly accessible on static hosts without rewrite
configuration. The Wasm URL resolves against the document base so repository
subpaths work. Error recovery starts a new run with the active settings.

## Interview walkthrough

1. Trace one seven-word market update from Wasm through aggregation to the table.
2. Explain why snapshots can be coalesced while trades cannot be discarded.
3. Walk through the two-trade VWAP example and integer accumulation.
4. Demonstrate pause, route navigation, resume, and Apply while paused.
5. Run the fake-clock lifecycle tests and the real compiled-Wasm tests.
6. Discuss how adding a rolling metric would require bounded extra state.

Hosting and public repository creation are left to the user, as requested. The
optional GitHub Pages job requires explicit configuration before it can deploy.
