# Builder

Run from the repository root:

```sh
node kit/manager/cli.mjs init-web --new
```

| Location | Responsibility |
| --- | --- |
| `cli.mjs` | Launch, discover, inspect and stop local Builder sessions |
| `client/` | Browser entry, page shell and shared presentation styles |
| `client/features/` | Intake, preparation, publication and foundation previews |
| `client/assets/` | Bundled fonts, icons, licenses and source metadata |
| `server/` | HTTP/API routes, job ownership, source intake, compilation handoff and saved-output verification |
| `foundations/` | Foundation definitions, templates, validation, imports and Figma call generation |
| `shared/` | Interface choices and motion values used by browser and server |

The HTTP server exposes only an explicit list of client/shared resources. Server code and foundation internals are private. Browser modules must not import Node or server modules.

The CLI copies the runtime into the selected session's `manager/` directory; it excludes this README and the CLI itself. Session inputs, generated artifacts and process records belong in `workspace/`, never here. MCP execution starts at `kit/mcp/server.mjs`.
