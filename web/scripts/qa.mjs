/**
 * Explorer QA: opens every page and every component tab in each supported color mode (Light and Dark,
 * or Light only when ds.config `modes` or tokens/accepted.json says so) and checks
 *   - no console errors or uncaught exceptions
 *   - no horizontal overflow at desktop (1440) and phone (390) widths
 *   - axe-core WCAG 2.2 AA (+ best practice) finds no violations
 * Web and App products (ds.config `product: 'both'`) are checked in Web and App preview.
 * Usage:
 *   npm run qa                      builds, serves dist/ on :4319 and checks it
 *   npm run qa -- --url http://localhost:5173/    checks a running dev server instead
 * A browser is needed once: `npx playwright install chromium` (or set PW_CHROMIUM_PATH).
 * Exits 1 on any failure and writes qa-report.json.
 */
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const argUrl = process.argv.indexOf('--url');
let base = argUrl > 0 ? process.argv[argUrl + 1] : null;
let server;
if (!base) {
  server = spawn('npx', ['vite', 'preview', '--port', '4319', '--strictPort'], { stdio: 'ignore' });
  base = 'http://localhost:4319/';
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

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let where = '';
page.on('pageerror', (e) => fail(where, `exception: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && fail(where, `console: ${m.text().slice(0, 200)}`));

await page.goto(base);
await page.waitForTimeout(500);
const pages = await page.$$eval('nav[aria-label="Design system"] a', (as) => as.map((a) => a.getAttribute('href').replace(/^#/, '')));
const tabsOf = async () => page.$$eval('[role=tablist] [role=tab]', (ts) => ts.map((t) => t.id.split('-tab-')[1]));

const routes = ['/'];
for (const p of pages) {
  await page.goto(base + '#' + p);
  await page.waitForTimeout(250);
  const tabs = await tabsOf();
  routes.push(p, ...tabs.slice(1).map((t) => `${p}?tab=${t}`));
  // Web and App products: every tab again in App preview (React Native via react-native-web).
  if (await page.$('[role=group][aria-label=Preview]')) routes.push(`${p}?platform=app`, ...tabs.slice(1).map((t) => `${p}?platform=app&tab=${t}`));
}

/** Wait for lazy pages and every running animation (page and tab fades, popups) to finish. */
async function settle() {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(150);
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
}

let views = 0;
for (const theme of themes) {
  await page.evaluate((t) => localStorage.setItem('ds-theme', t), theme);
  for (const r of routes) {
    where = `${theme} ${r}`;
    await page.goto(base + '#' + r);
    await page.reload();
    await settle();
    await page.addScriptTag({ content: axe });
    const { v, approved } = await page.evaluate(
      async ({ exc, pairs }) => {
        const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        const approved = [];
        const isApproved = (x, n) => {
          if (x.id !== 'color-contrast') return false;
          const d = n.any?.[0]?.data ?? {};
          const hit = pairs.find((p) => p.fg === String(d.fgColor).toLowerCase() && p.bg === String(d.bgColor).toLowerCase());
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
    v.forEach((x) => fail(where, `axe ${x}`));
    approved.forEach((p) => (approvedHits[p] = (approvedHits[p] ?? 0) + 1));
    views++;
  }
}

// Phone width: overflow on every page.
await page.setViewportSize({ width: 390, height: 844 });
for (const r of routes) {
  where = `390px ${r}`;
  await page.goto(base + '#' + r);
  await page.reload();
  await settle();
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ov > 0) fail(where, `horizontal overflow ${ov}px`);
}

await browser.close();
server?.kill();

/**
 * Design detector (Impeccable): the anti-AI-slop and design-quality rules over the site source.
 * Uses the project-installed engine (`.claude/skills/impeccable`, found by walking up from here), or `npx impeccable`.
 * Every finding fails QA. A finding that comes from the brand's frozen Figma values is recorded as a
 * build-level exception in this project's `.impeccable/config.json` (`npx impeccable ignores add-value …
 * --reason …`), never in the ds-create repo.
 */
const design = (() => {
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
fs.writeFileSync('qa-report.json', JSON.stringify({ base, routes: routes.length, themes, views, exceptions, approvedContrast: approvedHits, failures }, null, 1));
if (Object.keys(approvedHits).length) console.log(`approved brand contrast pairs (documented exceptions): ${Object.entries(approvedHits).map(([p, n]) => `${p} ×${n}`).join('; ')}`);
console.log(`qa: ${routes.length} routes × ${themes.length} theme(s) = ${views} views, phone overflow on ${routes.length} routes → ${failures.length} problems`);
for (const f of failures.slice(0, 40)) console.log(`  ✕ ${f.where}: ${f.what}`);
if (failures.length > 40) console.log(`  … ${failures.length - 40} more in qa-report.json`);
process.exit(failures.length ? 1 : 0);
