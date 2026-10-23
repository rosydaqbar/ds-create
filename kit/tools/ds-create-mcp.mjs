#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {realpath} from 'node:fs/promises';
try{
 const args=process.argv.slice(2);
 if(args.length!==0&&(args.length!==2||args[0]!=='--workspace'))throw new Error('Usage: node kit/tools/ds-create-mcp.mjs [--workspace /absolute/workspace]');
 const workspace=await realpath(args[1]||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'));
 if(Number(process.versions.node.split('.')[0])<20)throw new Error('DS Create MCP requires Node20+.');
 const {runDsCreateMcp}=await import('../mcp/server.mjs');await runDsCreateMcp(workspace);
}catch(e){console.error(e.code==='ERR_MODULE_NOT_FOUND'?'DS Create MCP dependencies are missing. Run npm ci --prefix kit/mcp in the workspace.':e.message);process.exitCode=1;}
