# kit

Code and templates for ds-create.

## Used by the engine

- `builder/`: the Builder web app. The engine runs Builder for each project. In the older `workspace/` layout, a session copies Builder to `workspace/output/{slug}/manager/` and runs it there.
- `mcp/`: the MCP server that lets an agent prepare and publish from Builder.
- `tools/`: scripts for Figma, building and content checks.

## Copied into projects

- `web/`: the documentation site template.
- `app/`: the React Native template.

`web/scripts/build-manager-setup.mjs` and `web/scripts/build-manager-items.mjs` rebuild Builder's client files in `builder/client/`. They are for maintainers only.
