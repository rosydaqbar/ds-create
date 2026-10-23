import { open, stat } from 'node:fs/promises';
import path from 'node:path';

const MAX_LINE = 1024 * 1024, MAX_LOG = 20 * 1024 * 1024;
const iso = ms => new Date(ms).toISOString();
const clean = text => String(text).replace(/\b(?:sk-[\w-]{12,}|Bearer\s+[\w.=-]{12,})/gi, '[redacted]').replace(/\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*["']?[^\s"',;}]+/gi, '[redacted]').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 800);
const fileStat = file => stat(file).catch(e => { if (e.code === 'ENOENT') return null; throw e; });

// Read progress independently of the worker: this also understands jobs started
// by an earlier Builder version. It never writes job/approval/source state.
export function createSetupProgress() {
  let cache, reading = Promise.resolve();
  async function read(dir) {
    const [request, events, stderr] = await Promise.all(['request.json', 'events.jsonl', 'stderr.log'].map(f => fileStat(path.join(dir, f))));
    if (!request) return null;
    if (!cache || cache.dir !== dir || events && (events.ino !== cache.ino || events.size < cache.offset)) {
      cache = {dir,ino:events?.ino,offset:0,pending:Buffer.alloc(0),discard:false,recent:[],phase:'Starting the local agent',connection:false,stage:'context',activity:[]};
    }
    const activity = (kind,text) => {if(cache.activity.at(-1)?.text!==text)cache.activity=[...cache.activity.slice(-11),{kind,text}];};
    const consume = line => {
      let event;try { event = JSON.parse(line.toString('utf8')); } catch { return; }
      const item = event.item || {}, type = item.type;
      if(event.type==='builder.stage'&&['context','decisions','foundation','validation'].includes(event.stage)){cache.stage=event.stage;cache.phase={context:'Reading product context',decisions:'Resolving design decisions',foundation:'Preparing foundations',validation:'Checking the saved foundation draft'}[event.stage];return;}
      if(event.type==='builder.update'&&typeof event.message==='string'){const message=clean(event.message);if(message){activity('message',message);if(cache.recent.at(-1)!==message)cache.recent=[...cache.recent.slice(-3),message];}cache.connection=false;return;}
      if (type === 'agent_message' && typeof item.text === 'string' && !/^[\s]*[\[{]/.test(item.text)) {
        const stage=/^DS_CREATE_STAGE: (context|decisions|foundation)\s*$/.exec(item.text.trim());
        if(stage){cache.stage=stage[1];cache.phase={context:'Reading product context',decisions:'Resolving design decisions',foundation:'Preparing foundations'}[stage[1]];return;}
        const message = clean(item.text);
        if(message)activity('message',message);
        if (message && cache.recent.at(-1) !== message) cache.recent = [...cache.recent.slice(-3), message];
        cache.phase = 'Preparing foundations';cache.connection = false;
      } else if (type === 'command_execution') {
        const command = item.command || '';
        cache.phase = /foundation-(?:validation|proof)|checkPreparation|validatePlan/.test(command) ? 'Checking foundation output' : /writeFile|write_text|apply_patch/.test(command) ? 'Working on the local draft' : 'Reading project files';
        if(event.type==='item.completed')activity('tool',/foundation-(?:validation|proof)|checkPreparation|validatePlan/.test(command)?'Check foundation output':/writeFile|write_text|apply_patch/.test(command)?'Update the local draft':'Inspect workspace files');
        cache.connection = false;
      } else if ((type === 'error' || event.type === 'error') && /reconnect|retrying|connection|timed out|timeout|rate limit/i.test(item.message || event.message || '')) {
        cache.phase = 'Waiting for the agent connection';cache.connection = true;
      }
    };
    if (events && events.size > cache.offset) {
      cache.ino = events.ino;
      const file = await open(path.join(dir, 'events.jsonl'), 'r');
      try {
        const end = Math.min(events.size, MAX_LOG), chunk = Buffer.alloc(64 * 1024);
        while (cache.offset < end) {
          const {bytesRead} = await file.read(chunk, 0, Math.min(chunk.length, end - cache.offset), cache.offset);
          if (!bytesRead) break;
          cache.offset += bytesRead;
          let data = Buffer.concat([cache.pending, chunk.subarray(0, bytesRead)]), from = 0, newline;
          while ((newline = data.indexOf(10, from)) !== -1) {
            if (!cache.discard && newline - from <= MAX_LINE) consume(data.subarray(from, newline));
            cache.discard = false;from = newline + 1;
          }
          cache.pending = Buffer.from(data.subarray(from));
          if (cache.discard || cache.pending.length > MAX_LINE) { cache.pending = Buffer.alloc(0);cache.discard = true; }
        }
      } finally { await file.close(); }
    }
    let connectionIssue = cache.connection;
    if (stderr && stderr.mtimeMs > (events?.mtimeMs || request.mtimeMs)) {
      const file = await open(path.join(dir, 'stderr.log'), 'r');
      try {
        const buffer = Buffer.alloc(Math.min(stderr.size, 4096));
        await file.read(buffer, 0, buffer.length, Math.max(0, stderr.size - buffer.length));
        connectionIssue ||= /failed to connect|transport channel closed|request timed out|reconnecting/i.test(buffer.toString('utf8'));
      } finally { await file.close(); }
    }
    return {startedAt:iso(request.mtimeMs),lastActivityAt:iso(events?.mtimeMs || request.mtimeMs),phase:cache.phase,
      stage:cache.stage,activity:[...cache.activity],message:cache.recent.at(-1) || 'Waiting for the local agent to report its progress.',recent:[...cache.recent],connectionIssue};
  }
  return dir => {
    const result = reading.then(() => read(dir)).catch(() => null);
    reading = result;return result;
  };
}
