// A bounded data-parser thread, not an AI agent or command runner.
import {parentPort,workerData} from 'node:worker_threads';
import {extractSource} from './source-pack.mjs';
parentPort.postMessage(extractSource(Buffer.from(workerData.bytes),workerData.extension));
