# Workflow tools

Run Node commands from the repository root. The command references under `skills/ds-create/reference/` specify when each tool runs.

| Directory | Responsibility |
| --- | --- |
| `figma/` | Scripts executed through the Figma tool: renderers, libraries, copy, exports, audits and icon generation |
| `build/` | Manifest packing, renderer caching, build ledger and exported-set registry |
| `content/` | Documentation copy checks and editorial validation |
| `maintain/` | Rebuild bundled icon data and foundation defaults from their authoritative sources |

Builder has its own entry point: `node kit/manager/cli.mjs`. MCP has its own entry point: `node kit/mcp/server.mjs`. Tests and synthetic fixtures live in `tests/`.

Do not place session-specific scripts, generated calls, copied runtimes or project assets in these directories; those belong in `workspace/output/{session}/`.
