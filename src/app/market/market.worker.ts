/// <reference lib="webworker" />
import { WorkerCommand, WorkerEvent } from './model';
import { ProducerRuntime } from './producer-runtime';

const runtime = new ProducerRuntime((event: WorkerEvent) => postMessage(event));
addEventListener('message', (event: MessageEvent<WorkerCommand>) => {
  void runtime.handle(event.data);
});
