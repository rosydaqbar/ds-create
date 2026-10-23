import path from 'node:path';
export function mcpConfiguration(workspace,session,task='publish'){
 return {transport:'stdio',command:process.execPath,args:[path.join(workspace,'kit/tools/ds-create-mcp.mjs'),'--workspace',workspace],installCommand:'npm ci --prefix kit/mcp',agentInstruction:`Use DS Create MCP to ${task==='prepare'?'prepare foundations from the saved context':'publish the approved foundations'} for session ${session}.`};
}
