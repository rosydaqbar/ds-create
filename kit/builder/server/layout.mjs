// Where a session's files live. One place decides: workspace mode keeps workspace/input/{slug} and
// workspace/output/{slug}; a project (ds-create.json at its root) keeps input/ and output/ at the root.
// No import of kit/paths.mjs: workspace sessions carry a copy of this file.
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

export const isProject = root => existsSync(path.join(root, 'ds-create.json'));
// Slug of the session whose output folder this is: the project's slug, or the folder name in workspace mode.
export function projectSlug(outputDir) {
  const file = path.join(outputDir, '../ds-create.json');
  if (!existsSync(file)) return path.basename(outputDir);
  try { return JSON.parse(readFileSync(file, 'utf8')).slug; } catch { throw new Error('ds-create.json is not valid JSON.'); }
}
export const workspaceOf = outputDir => existsSync(path.join(outputDir, '../ds-create.json')) ? path.dirname(outputDir) : path.resolve(outputDir, '../../..');
// Relative paths from the workspace root (also the text shown in prompts).
export const inputBaseRel = root => isProject(root) ? 'input' : 'workspace/input';
export const inputRel = (root, inputSlug) => isProject(root) ? 'input' : `workspace/input/${inputSlug}`;
export const outputRel = (root, slug) => isProject(root) ? 'output' : `workspace/output/${slug}`;
export const runtimeRel = (root, slug) => `${outputRel(root, slug)}/manager`;
// The command a person types to open this session's Builder.
export const builderCommand = (root, slug) => isProject(root) ? 'ds-create builder' : `ds-create builder --slug ${slug}`;
