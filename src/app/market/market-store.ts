import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { MarketMetrics } from './metrics';
import {
  DEFAULT_SETTINGS,
  ProducerSettings,
  ProducerStatus,
  validSettings,
  WorkerCommand,
  WorkerEvent,
} from './model';

@Injectable({ providedIn: 'root' })
export class MarketStore {
  private worker?: Worker;
  private readonly settingsState = signal<Readonly<ProducerSettings>>(DEFAULT_SETTINGS);
  private readonly statusState = signal<ProducerStatus>('initializing');
  private readonly snapshotState = signal(
    new MarketMetrics(DEFAULT_SETTINGS.instrumentCount).snapshot(),
  );
  private readonly errorState = signal<string | null>(null);
  private readonly runIdState = signal(0);
  private readonly updatedAtState = signal<Date | null>(null);

  readonly settings = this.settingsState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly snapshot = this.snapshotState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly runId = this.runIdState.asReadonly();
  readonly updatedAt = this.updatedAtState.asReadonly();
  readonly nominalRate = computed(
    () => (this.settings().updatesPerBatch * 1000) / this.settings().intervalMs,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
    this.apply(DEFAULT_SETTINGS);
  }

  apply(settings: ProducerSettings): void {
    if (!validSettings(settings))
      throw new Error('Settings must be integers within the allowed ranges.');
    this.worker?.terminate();
    this.worker = undefined;
    const runId = this.runIdState() + 1;
    this.runIdState.set(runId);
    this.settingsState.set({ ...settings });
    this.snapshotState.set(new MarketMetrics(settings.instrumentCount).snapshot());
    this.statusState.set('initializing');
    this.errorState.set(null);
    this.updatedAtState.set(null);

    try {
      this.worker = new Worker(new URL('./market.worker', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }: MessageEvent<WorkerEvent>) => {
        if (data.runId !== this.runIdState() || this.statusState() === 'error') return;
        if (data.type === 'error') {
          this.fail(data.message);
        } else {
          this.snapshotState.set(data.snapshot);
          if (data.snapshot.tradeCount > 0) this.updatedAtState.set(new Date());
          if (data.type === 'state') this.statusState.set(data.status);
          if (data.type === 'snapshot') this.send({ type: 'ack', runId });
        }
      };
      this.worker.onerror = (event) => {
        event.preventDefault();
        if (runId === this.runIdState())
          this.fail(event.message || 'The market worker could not start.');
      };
      this.worker.onmessageerror = () => {
        if (runId === this.runIdState()) this.fail('The market worker returned unreadable data.');
      };
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      this.send({
        type: 'start',
        runId,
        settings: { ...settings },
        seed,
        wasmUrl: new URL('producer.wasm', document.baseURI).href,
      });
    } catch (error) {
      this.fail(
        error instanceof Error ? error.message : 'Web Workers are unavailable in this browser.',
      );
    }
  }

  pause(): void {
    if (this.status() === 'running') this.send({ type: 'pause', runId: this.runId() });
  }

  resume(): void {
    if (this.status() === 'paused') this.send({ type: 'resume', runId: this.runId() });
  }

  private send(command: WorkerCommand): void {
    this.worker?.postMessage(command);
  }

  private fail(message: string): void {
    this.statusState.set('error');
    this.errorState.set(message);
    this.worker?.terminate();
    this.worker = undefined;
  }
}
