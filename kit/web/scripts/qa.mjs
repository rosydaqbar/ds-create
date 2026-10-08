/**
 * Explorer QA: opens every page and every component tab in each supported color mode (Light and Dark,
 * or Light only when ds.config `modes` or tokens/accepted.json says so) and checks
 *   - no console errors or uncaught exceptions
 *   - no horizontal overflow at desktop (1440) and phone (390) widths
 *   - axe-core WCAG 2.2 AA (+ best practice) finds no violations
 * Web and App products (ds.config `product: 'both'`) are checked in Web and App preview.
 * QA runs on call (workflow/INITIATOR.md Part B, *QA on call*): when the user asks, or before a publish they asked for.
 * Usage:
 *   npm run qa                      builds, serves dist/ on a free port and checks it
 *   npm run qa -- --url http://localhost:5173/    checks a running dev server instead
 *   --pages 2.1,3.2                 only these pages (by id or route prefix), plus their tabs
 *   --quick                         errors and overflow only: no axe, no design detector
 *   --workers 6                     browser tabs in parallel (default 4)
 *   --baseline                      saves the current failures as known (qa-baseline.json); later runs
 *                                   list known failures apart and fail only on new ones
 * A browser is needed once: `npx playwright install chromium` (or set PW_CHROMIUM_PATH).
 * Exits 1 on any new failure and writes qa-report.json. The preview server is always stopped.
 */
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const argv = process.argv.slice(2);
const opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
let base = opt('--url') ?? null;
const onlyPages = (opt('--pages') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const quick = argv.includes('--quick');
const workers = Math.max(1, Number(opt('--workers') ?? 4));
const saveBaseline = argv.includes('--baseline');
const t0 = Date.now();
let server;
// A preview server left running blocks the port for the next run: stop it however the script ends.
const stopServer = () => server?.kill();
process.on('exit', stopServer);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
if (!base) {
  // A free port, so a server left over from another run is never checked by mistake.
  const port = await new Promise((res) => { const srv = net.createServer().listen(0, () => { const p = srv.address().port; srv.close(() => res(p)); }); });
  server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
  base = `http://localhost:${port}/`;
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(base);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const failures = [];
/**
 * Documented exceptions: excluded from the axe run, listed in the report.
 * Facebook's brand rules fix its button colour (white on #1877F2 = 4.23:1); see 1.8 Brand assets and 3.7 Social button.
 */
const exceptions = [{ rule: 'color-contrast', selector: '.bg-social-button-facebook-fill', reason: 'Facebook brand colour (4.23:1), set by Facebook; documented on 1.8 and 3.7' }];
const fail = (where, what) => failures.push({ where, what });

/** What the owner approved for this system (tokens/accepted.json, copied from the build ledger). Absent in the template. */
const accFile = new URL('../tokens/accepted.json', import.meta.url);
const accepted = fs.existsSync(accFile) ? JSON.parse(fs.readFileSync(accFile, 'utf8')) : {};

/**
 * Color modes to check: those `ds.config.ts` lists (`modes`), minus any the owner approved as not
 * supported. A Light-only system is checked in Light only; the site hides its Dark toggle.
 */
const cfgSrc = fs.readFileSync(new URL('../src/ds.config.ts', import.meta.url), 'utf8');
const configModes = (cfgSrc.match(/modes:\s*\[([^\]]*)\]/)?.[1] ?? "'Light', 'Dark'").match(/'([^']+)'/g)?.map((m) => m.slice(1, -1)) ?? ['Light', 'Dark'];
const hasDark = configModes.includes('Dark') && !(accepted.unsupportedModes?.Color ?? []).includes('Dark');
const themes = hasDark ? ['light', 'dark'] : ['light'];

/**
 * Brand contrast pairs the owner approved (`contrast` in tokens/accepted.json). Inside the brand's own
 * components and color specimens they are documented exceptions, not failures. They are matched by their
 * resolved colors in each theme, because react-native-web previews have generated class names, and counted
 * in the report (`approvedContrast`). The site chrome never relies on them.
 */
const approvedPairs = (() => {
  if (!(accepted.contrast ?? []).length) return { light: [], dark: [] };
  const vars = JSON.parse(fs.readFileSync(new URL('../tokens/figma-variables.json', import.meta.url), 'utf8')).variables;
  const byName = new Map(vars.map((v) => [v.name, v]));
  const hex = (name, mode, depth = 0) => {
    const v = byName.get(name);
    if (!v || depth > 10) return null;
    const val = v.values[mode] ?? v.values.Value ?? Object.values(v.values)[0];
    if (val && typeof val === 'object' && val.alias) return hex(val.alias, mode, depth + 1);
    return typeof val === 'string' && val.startsWith('#') ? val.slice(0, 7).toLowerCase() : null;
  };
  const resolve = (mode) =>
    accepted.contrast
      .map((pair) => {
        const [fg, bg] = pair.split(' on ');
        return { pair, fg: hex(fg, mode), bg: hex(bg, mode) };
      })
      .filter((x) => x.fg && x.bg);
  return { light: resolve('Light'), dark: resolve('Dark') };
})();
const approvedHits = {};

/** One browser tab with its own error listeners; `where` names what it is checking. */
async function tab() {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.where = '';
  p.on('pageerror', (e) => fail(p.where, `exception: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && fail(p.where, `console: ${m.text().slice(0, 200)}`));
  return p;
}
/** Runs `fn` over `items` with `workers` tabs in parallel. */
async function pool(items, fn) {
  const tabs = await Promise.all(Array.from({ length: Math.min(workers, items.length || 1) }, tab));
  let i = 0;
  await Promise.all(tabs.map(async (p) => { while (i < items.length) await fn(p, items[i++]); }));
  await Promise.all(tabs.map((p) => p.close()));
}

/** Wait for lazy pages and every running animation (page and tab fades, popups) to finish. Never a fixed delay (GOTCHAS G33). */
async function settle(p) {
  await p.waitForLoadState('networkidle');
  await p.waitForSelector('main', { timeout: 10000 }).catch(() => {});
  await p.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
}

const first = await tab();
await first.goto(base);
await settle(first);
let pages = await first.$$eval('nav[aria-label="Design system"] a', (as) => as.map((a) => a.getAttribute('href').replace(/^#/, '')));
await first.close();
// Routes look like /parts/2.1-button: match the page id (2.1) or the whole last segment.
if (onlyPages.length) pages = pages.filter((p) => { const seg = p.split('/').pop(); return onlyPages.some((id) => seg === id || seg.startsWith(id + '-')); });

const routes = onlyPages.length ? [] : ['/'];
const found = {};
await pool(pages, async (p, route) => {
  p.where = `discover ${route}`;
  await p.goto(base + '#' + route);
  await settle(p);
  const tabs = await p.$$eval('[role=tablist] [role=tab]', (ts) => ts.map((t) => t.id.split('-tab-')[1]));
  const list = [route, ...tabs.slice(1).map((t) => `${route}?tab=${t}`)];
  // Web and App products: every tab again in App preview (React Native via react-native-web).
  if (await p.$('[role=group][aria-label=Preview]')) list.push(`${route}?platform=app`, ...tabs.slice(1).map((t) => `${route}?platform=app&tab=${t}`));
  found[route] = list;
});
for (const p of pages) routes.push(...(found[p] ?? []));

// One pass per route: each theme at desktop width (errors, axe), then phone width for overflow, in the same tab.
let views = 0;
await pool(routes, async (p, r) => {
  for (const [ti, theme] of themes.entries()) {
    p.where = `${theme} ${r}`;
    await p.goto(base + '#' + r);
    await p.evaluate((t) => localStorage.setItem('ds-theme', t), theme);
    await p.reload();
    await settle(p);
    if (!quick) {
      await p.addScriptTag({ content: axe });
      const { v, approved } = await p.evaluate(
        async ({ exc, pairs }) => {
          const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
          const approved = [];
          const isApproved = (x, n) => {
            if (x.id !== 'color-contrast') return false;
            const d = n.any?.[0]?.data ?? {};
            const hit = pairs.find((q) => q.fg === String(d.fgColor).toLowerCase() && q.bg === String(d.bgColor).toLowerCase());
            if (hit) approved.push(hit.pair);
            return !!hit;
          };
          const v = res.violations
            .map((x) => ({ ...x, nodes: x.nodes.filter((n) => !isApproved(x, n) && !exc.some((e) => e.rule === x.id && n.target.some((t) => document.querySelector(t)?.closest(e.selector)))) }))
            .filter((x) => x.nodes.length)
            .map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(' ')} — ${x.nodes[0].failureSummary?.split('\n')[1]?.trim() ?? ''}`);
          return { v, approved };
        },
        { exc: exceptions, pairs: approvedPairs[theme] },
      );
      v.forEach((x) => fail(p.where, `axe ${x}`));
      approved.forEach((q) => (approvedHits[q] = (approvedHits[q] ?? 0) + 1));
    }
    views++;
    if (ti === 0) {
      // Phone width, same load: no second pass over every route.
      p.where = `390px ${r}`;
      await p.setViewportSize({ width: 390, height: 844 });
      await settle(p);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ov > 0) fail(p.where, `horizontal overflow ${ov}px`);
      await p.setViewportSize({ width: 1440, height: 900 });
    }
  }
});

await browser.close();
stopServer();

/**
 * Design detector (Impeccable): the anti-AI-slop and design-quality rules over the site source.
 * Uses the project-installed engine (`.claude/skills/impeccable`, found by walking up from here), or `npx impeccable`.
 * Every finding fails QA. A finding that comes from the brand's frozen Figma values is recorded as a
 * build-level exception in this project's `.impeccable/config.json` (`npx impeccable ignores add-value …
 * --reason …`), never in the ds-create repo.
 */
const design = quick ? [] : (() => {
  let dir = process.cwd(), bin = null;
  for (let i = 0; i < 8 && !bin; i++) {
    const cand = `${dir}/.claude/skills/impeccable/scripts/impeccable`;
    if (fs.existsSync(cand)) bin = cand;
    const up = dir.replace(/\/[^/]+$/, '');
    if (up === dir) break;
    dir = up;
  }
  const targets = ['src', 'react-native'].filter((t) => fs.existsSync(t));
  const [cmd, args] = bin ? [bin, ['detect', '--json', ...targets]] : ['npx', ['-y', 'impeccable', 'detect', '--json', ...targets]];
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  try {
    return JSON.parse(r.stdout || '[]');
  } catch {
    fail('design detector', `could not run Impeccable detect: ${(r.stderr || r.error?.message || '').trim().split('\n').pop()}`);
    return [];
  }
})();
for (const f of design) fail('design', `${f.antipattern} ${String(f.file).replace(process.cwd() + '/', '')}:${f.line} (${f.snippet ?? ''}): ${f.name}`);
console.log(`design detector: ${design.length} finding(s)`);
// Known failures (qa-baseline.json, written by --baseline) are listed apart; only new ones fail the run.
const key = (f) => `${f.where} | ${f.what}`;
const baseFile = 'qa-baseline.json';
if (saveBaseline) fs.writeFileSync(baseFile, JSON.stringify(failures.map(key).sort(), null, 1) + '\n');
const known = new Set(!saveBaseline && fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : []);
const fresh = failures.filter((f) => !known.has(key(f)));
const secs = Math.round((Date.now() - t0) / 1000);
fs.writeFileSync('qa-report.json', JSON.stringify({ base, pages: onlyPages.length ? onlyPages : 'all', quick, routes: routes.length, themes, views, seconds: secs, exceptions, approvedContrast: approvedHits, known: failures.length - fresh.length, failures: fresh }, null, 1));
if (Object.keys(approvedHits).length) console.log(`approved brand contrast pairs (documented exceptions): ${Object.entries(approvedHits).map(([p, n]) => `${p} ×${n}`).join('; ')}`);
console.log(`qa${quick ? ' (quick)' : ''}: ${routes.length} routes × ${themes.length} theme(s) = ${views} views and phone overflow, ${workers} tabs, ${secs} s → ${fresh.length} new problem(s)${known.size ? `, ${failures.length - fresh.length} known (qa-baseline.json)` : ''}${saveBaseline ? `; baseline saved: ${failures.length}` : ''}`);
for (const f of fresh.slice(0, 40)) console.log(`  ✕ ${f.where}: ${f.what}`);
if (fresh.length > 40) console.log(`  … ${fresh.length - 40} more in qa-report.json`);
process.exit(fresh.length && !saveBaseline ? 1 : 0);
