// Fails the build when a React effect can return something other than a cleanup function.
// An expression-bodied effect returns its expression: `useEffect(() => el.scrollTo(0, 0))`
// returns a Promise in newer browsers, and React then crashes on unmount ("destroy is not a function").
// Effects must use a block body and return nothing or a cleanup function.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f) && !f.endsWith('.gen.ts')) files.push(p);
  }
})(join(root, 'src'));

const problems = [];
const isFn = (n) => ts.isArrowFunction(n) || ts.isFunctionExpression(n);
for (const file of files) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const at = (n) => `${relative(root, file)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  (function visit(n) {
    if (ts.isCallExpression(n) && /(^|\.)use(Layout|Insertion)?Effect$/.test(n.expression.getText()) && n.arguments[0]) {
      const cb = n.arguments[0];
      if (isFn(cb) && cb.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) problems.push(`${at(n)}  async effect`);
      else if (ts.isArrowFunction(cb) && !ts.isBlock(cb.body) && !isFn(cb.body) && !ts.isIdentifier(cb.body)) problems.push(`${at(n)}  expression body returns \`${cb.body.getText().slice(0, 60)}\``);
      else if (isFn(cb) && ts.isBlock(cb.body)) {
        (function rets(x) {
          if (x !== cb && ts.isFunctionLike(x)) return;
          if (ts.isReturnStatement(x) && x.expression && !isFn(x.expression) && !ts.isIdentifier(x.expression)) problems.push(`${at(x)}  returns \`${x.expression.getText().slice(0, 60)}\``);
          ts.forEachChild(x, rets);
        })(cb.body);
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
}
if (problems.length) {
  console.error('Effects must return nothing or a cleanup function:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`effects: ${files.length} files checked`);
