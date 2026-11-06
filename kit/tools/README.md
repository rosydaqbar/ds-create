# Workflow tools

Run Node commands from the repository root. The command references under `skills/ds-create/reference/` specify when each tool runs.

| Directory | Responsibility |
| --- | --- |
| `figma/` | Scripts executed through the Figma tool: renderers, libraries, copy, exports, audits and icon generation |
| `build/` | Manifest packing, renderer caching, build ledger and exported-set registry |
| `content/` | Documentation copy checks and editorial validation |

The icon and foundation-default generators are in `dev/maintain/`. Builder has its own entry point: `node kit/builder/cli.mjs`. MCP has its own entry point: `node kit/mcp/server.mjs`.

Do not place session-specific scripts, generated calls, copied runtimes or project assets in these directories; those belong in `workspace/output/{session}/`.
