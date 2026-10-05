/**
 * Explorer QA: opens every page and every component tab in Light and Dark and checks
 *   - no console errors or uncaught exceptions
 *   - no horizontal overflow at desktop (1440) and phone (390) widths
 *   - axe-core WCAG 2.2 AA (+ best practice) finds no violations
 * Usage:
 *   npm run qa                      builds, serves dist/ on :4319 and checks it
 *   npm run qa -- --url http://localhost:5173/    checks a running dev server instead
 * A browser is needed once: `npx playwright install chromium` (or set PW_CHROMIUM_PATH).
 * Exits 1 on any failure and writes qa-report.json.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
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
}

/** Wait for lazy pages and every running animation (page and tab fades, popups) to finish. */
async function settle() {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(150);
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
}

let views = 0;
for (const theme of ['light', 'dark']) {
  await page.evaluate((t) => localStorage.setItem('ds-theme', t), theme);
  for (const r of routes) {
    where = `${theme} ${r}`;
    await page.goto(base + '#' + r);
    await page.reload();
    await settle();
    await page.addScriptTag({ content: axe });
    const v = await page.evaluate(async (exc) => {
      const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
      return res.violations
        .map((x) => ({ ...x, nodes: x.nodes.filter((n) => !exc.some((e) => e.rule === x.id && n.target.some((t) => document.querySelector(t)?.closest(e.selector)))) }))
        .filter((x) => x.nodes.length)
        .map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(' ')} — ${x.nodes[0].failureSummary?.split('\n')[1]?.trim() ?? ''}`);
    }, exceptions);
    v.forEach((x) => fail(where, `axe ${x}`));
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
fs.writeFileSync('qa-report.json', JSON.stringify({ base, routes: routes.length, views, exceptions, failures }, null, 1));
console.log(`qa: ${routes.length} routes × 2 themes = ${views} views, phone overflow on ${routes.length} routes → ${failures.length} problems`);
for (const f of failures.slice(0, 40)) console.log(`  ✕ ${f.where}: ${f.what}`);
if (failures.length > 40) console.log(`  … ${failures.length - 40} more in qa-report.json`);
process.exit(failures.length ? 1 : 0);
