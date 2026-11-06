#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolveProject} from './paths.mjs';

const BUILDER = fileURLToPath(new URL('./builder/cli.mjs', import.meta.url));
const MCP = fileURLToPath(new URL('./mcp/server.mjs', import.meta.url));
const PASS = ['publish', 'retry', 'fonts', 'parts', 'approve', 'tokens', 'compare', 'check-site', 'wait', 'sessions', 'mcp-host', 'stop'];
const usage = 'Usage: ds-create builder [stop] | status | mcp | publish|retry|fonts|parts|approve|tokens|compare|check-site|wait|sessions|mcp-host|stop | --version\n       Flags: [--project dir] [--workspace dir] [--slug {slug}]';

const args = process.argv.slice(2);
const flag = k => args.includes(k) ? args[args.indexOf(k) + 1] : undefined;
const fail = message => { console.error(message); process.exit(1); };
const run = (script, scriptArgs) => new Promise(resolve => {
  const child = spawn(process.execPath, [script, ...scriptArgs], {stdio: 'inherit'});
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => child.kill(s));
  child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
});

let command = args[0], rest = args.slice(1);
if (command === '--version' || command === '-v') {
  console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
  process.exit(0);
}
if (command === 'init-web') { console.error('init-web is now builder.'); command = 'builder'; }
if (command === 'start') command = 'builder';
if (command === 'builder' && rest[0] === 'stop') { command = 'stop'; rest = rest.slice(1); }
if (!['builder', 'status', 'mcp', ...PASS].includes(command)) fail(usage);

let project;
try { project = resolveProject({project: flag('--project'), workspace: flag('--workspace')}); } catch (e) { fail(e.message); }

if (command === 'mcp') {
  process.exit(await run(MCP, ['--workspace', project.root]));
}
// Project mode: the project root replaces --slug (the Builder takes the slug from ds-create.json).
// Workspace mode: the user's flags go through unchanged.
const forward = project.mode === 'project' && !args.includes('--project') ? [...rest, '--project', project.root] : rest;
process.exit(await run(BUILDER, [command, ...forward]));
