# kit

Code and templates for ds-create.

## The engine runs these

- `builder/`: the Builder web app. A session copies it into `workspace/output/{slug}/manager/` and runs it there.
- `mcp/`: the MCP server that lets an agent prepare and publish from Builder.
- `tools/`: scripts for Figma, building and content checks.

## Projects get copies of these

- `web/`: the documentation site template.
- `app/`: the React Native template.

`web/scripts/build-manager-setup.mjs` and `web/scripts/build-manager-items.mjs` rebuild Builder's client files in `builder/client/`. They are for maintainers only.
