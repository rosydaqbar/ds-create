// A bounded data-parser thread, not an AI agent or command runner.
import {parentPort,workerData} from 'node:worker_threads';
import {extractSource} from './sources.mjs';
parentPort.postMessage(extractSource(Buffer.from(workerData.bytes),workerData.extension));
