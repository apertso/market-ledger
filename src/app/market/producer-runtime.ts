import { MarketMetrics } from './metrics';
import { ProducerSettings, validSettings, WorkerCommand, WorkerEvent } from './model';
import { loadProducer, WasmProducer } from './wasm-producer';

const MIN_PUBLISH_INTERVAL_MS = 100;

// The worker owns generation and aggregation. Angular receives bounded snapshots.
export class ProducerRuntime {
  private runId = 0;
  private settings?: ProducerSettings;
  private metrics?: MarketMetrics;
  private producer?: WasmProducer;
  private timer?: ReturnType<typeof setTimeout>;
  private paused = false;
  private snapshotPending = false;
  private lastPublished = 0;

  constructor(
    private readonly send: (event: WorkerEvent) => void,
    private readonly load = loadProducer,
  ) {}

  async handle(command: WorkerCommand): Promise<void> {
    if (command.type === 'start') {
      this.stopTimer();
      this.runId = command.runId;
      this.producer = undefined;
      this.metrics = undefined;
      this.paused = false;
      this.snapshotPending = false;
      this.lastPublished = 0;
      try {
        if (!validSettings(command.settings)) throw new Error('Invalid producer settings.');
        this.settings = { ...command.settings };
        this.metrics = new MarketMetrics(command.settings.instrumentCount);
        const producer = await this.load(
          command.wasmUrl,
          command.settings.instrumentCount,
          command.seed,
        );
        if (command.runId !== this.runId) return;
        this.producer = producer;
        this.publishState();
        if (!this.paused) this.schedule();
      } catch (error) {
        if (command.runId === this.runId) this.fail(error);
      }
      return;
    }

    if (command.runId !== this.runId) return;
    if (command.type === 'ack') {
      this.snapshotPending = false;
    } else if (command.type === 'pause') {
      this.paused = true;
      this.stopTimer();
      if (this.producer) this.publishState();
    } else if (command.type === 'resume' && this.paused && this.producer) {
      this.paused = false;
      this.publishState();
      this.schedule();
    }
  }

  private schedule(): void {
    this.timer = setTimeout(() => {
      try {
        this.metrics!.consume(this.producer!.generate(this.settings!.updatesPerBatch));
        const now = performance.now();
        if (!this.snapshotPending && now - this.lastPublished >= MIN_PUBLISH_INTERVAL_MS) {
          this.snapshotPending = true;
          this.lastPublished = now;
          this.send({ type: 'snapshot', runId: this.runId, snapshot: this.metrics!.snapshot() });
        }
        this.schedule();
      } catch (error) {
        this.fail(error);
      }
    }, this.settings!.intervalMs);
  }

  private publishState(): void {
    this.send({
      type: 'state',
      runId: this.runId,
      status: this.paused ? 'paused' : 'running',
      snapshot: this.metrics!.snapshot(),
    });
  }

  private fail(error: unknown): void {
    this.stopTimer();
    this.producer = undefined;
    this.send({
      type: 'error',
      runId: this.runId,
      message: error instanceof Error ? error.message : 'The market producer failed.',
    });
  }

  private stopTimer(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
