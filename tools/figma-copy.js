// tools/figma-copy.js · the Figma side of the page copy files (workflow/COPY.md).
//
// Four modes, one page per call:
//   extract  read-only. Returns every prose text in the page's doc frames, grouped by frame and by
//            container (Topic · X, Block · X, Example · X, the When to use cards), with node ids:
//            the raw material for a copy file and its `figma:` source comments.
//   diff     read-only. Compares the frames with one page's copy (figma surface) and lists every
//            difference.
//   verify   read-only and compact. Takes the page's fingerprints (web/scripts/build-copy.mjs --fingerprints)
//            and returns only the targets whose roles or text differ (GOTCHAS.md G40). Use it for many pages.
//   apply    writes text only. Sets the frames' text from the copy, by the node ids in its source
//            comments. A container whose number of paragraphs, captions, items or do / don't
//            reasons differs from the copy is skipped and reported: rebuild that page with the doc
//            builder instead (GOTCHAS.md G27).
//
// The copy for one page and one surface comes from the docs site's parser:
//   node web/scripts/build-copy.mjs --dir output/{slug}/copy --page 2.1 --surface figma
//
// Call (cache it like tools/figma-audit.js, or paste it):
//   const r = await figmaCopy(figma, 'extract', '2.1 Button');
//   const r = await figmaCopy(figma, 'diff', '2.1 Button', COPY);
//   const r = await figmaCopy(figma, 'apply', '2.1 Button', COPY);
//   const r = await figmaCopy(figma, 'verify', '2.1 Button', ROWS);   // ROWS = fingerprints['2.1 Button']
// Values are never touched: only TEXT characters and the text properties of Doc kit instances.
const figmaCopy = async (figma, MODE, PAGE, COPY) => {
  const page = figma.root.children.find((p) => p.name === PAGE);
  if (!page) return { error: 'No page named "' + PAGE + '"' };
  await page.loadAsync();

  // Prose roles by layer name (DOCFRAMES.md, templates/structure.md). Other text is a visual label.
  const TEXT_ROLE = { Paragraph: '', 'Connecting paragraph': '', Purpose: '', 'What it means': '', 'In this file': '', Meaning: '', Use: '', Caption: 'caption', Note: 'caption', Item: 'item' };
  // Doc kit instances whose text property is prose, and the role it plays.
  const KIT_PROP = { 'Doc/Block note': ['Description', ''], 'Doc/Row note': ['Body', ''], 'Doc/Family header': ['Description', ''], 'Doc/Do-dont': ['Reason', null] };
  const CONTAINER = /^(Topic|Block|Example) · (.+)$/;
  const isContainer = (n) => n.type === 'FRAME' && (CONTAINER.test(n.name) || n.name === 'When to use' || n.name === 'When not to use');
  const titleOf = (n) => { const m = n.name.match(CONTAINER); return m ? m[2] : n.name; };
  const kitName = (i) => { try { const mc = i.mainComponent; return mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name) : ''; } catch (e) { return ''; } };
  const propKey = (i, name) => Object.keys(i.componentProperties || {}).find((k) => k.split('#')[0] === name);
  const stripBullet = (s) => s.replace(/^(•|\d+\.)\s+/, '');

  // Prose slots directly inside a container, in reading order; nested containers are their own.
  // Main components shown in a frame are never read or written (their text is the component's),
  // and a text that still reads as its own layer name is a placeholder, not prose.
  const slotsIn = (root) => {
    const out = [];
    const walk = (n) => {
      for (const c of n.children || []) {
        if (c.visible === false) continue;
        if (isContainer(c)) continue;
        if (c.type === 'COMPONENT' || c.type === 'COMPONENT_SET') continue;
        if (c.type === 'TEXT' && c.name in TEXT_ROLE && c.characters.trim() !== c.name) {
          const role = TEXT_ROLE[c.name];
          out.push({ role, text: role === 'item' ? stripBullet(c.characters) : c.characters, node: c.id, bullet: role === 'item' ? (c.characters.match(/^(•|\d+\.)\s+/) || [''])[0] : '' });
        } else if (c.type === 'INSTANCE') {
          const k = KIT_PROP[kitName(c)];
          if (k) {
            const key = propKey(c, k[0]);
            if (key) {
              let role = k[1];
              if (role === null) role = /don/i.test(c.mainComponent ? c.mainComponent.name : '') ? "don't" : 'do';
              out.push({ role, text: String(c.componentProperties[key].value), node: c.id, prop: key });
            }
          }
        } else if ('children' in c) walk(c);
      }
    };
    walk(root);
    return out;
  };
  const headerOf = (frame) => {
    const h = frame.children.find((c) => c.type === 'INSTANCE' && kitName(c) === 'Doc/Header');
    const key = h && propKey(h, 'Description');
    return key ? { role: '', text: String(h.componentProperties[key].value), node: h.id, prop: key } : null;
  };
  const frames = page.children.filter((n) => n.type === 'FRAME' && n.name.startsWith(PAGE + ' · '));

  if (MODE === 'extract') {
    return {
      page: PAGE,
      pageId: page.id,
      frames: frames.map((f) => {
        const items = f.findAll(isContainer).map((c) => ({ title: titleOf(c), kind: (c.name.match(CONTAINER) || [, 'Card'])[1], id: c.id, lines: slotsIn(c).map((s) => ({ role: s.role, text: s.text })) })).filter((i) => i.lines.length);
        const h = headerOf(f);
        return { frame: f.name.slice(PAGE.length + 3), id: f.id, header: h ? h.text : '', items };
      }),
    };
  }

  if (MODE === 'verify') {
    if (!Array.isArray(COPY)) return { error: 'verify takes the page rows from build-copy.mjs --fingerprints' };
    const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
    const ids = new Set(frames.map((f) => f.id));
    const bad = [];
    for (const [id, roles, hAll, hHead] of COPY) {
      const node = await figma.getNodeByIdAsync(id);
      if (!node) { bad.push({ id, problem: 'missing' }); continue; }
      if (ids.has(id)) { const h = headerOf(node); if (!h || fnv(h.text) !== hHead) bad.push({ id, problem: 'header', figma: h ? h.text.slice(0, 100) : '' }); continue; }
      const s = slotsIn(node); const r = s.map((x) => x.role || 'p').join(',');
      if (r !== roles) { bad.push({ id, problem: 'roles', figma: r, copy: roles }); continue; }
      if (fnv(s.map((x) => x.text).join('\u0001')) !== hAll) bad.push({ id, problem: 'text', figma: s.map((x) => x.text.slice(0, 60)) });
    }
    return { page: PAGE, mode: MODE, checked: COPY.length, mismatches: bad.length, bad: bad.slice(0, 20) };
  }

  if (MODE !== 'diff' && MODE !== 'apply') return { error: 'MODE is extract, verify, diff or apply' };
  if (!COPY || !COPY.sections) return { error: 'COPY is one page from build-copy.mjs --surface figma' };
  const fonts = async (t) => { if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName); else for (const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName); };
  const setSlot = async (slot, text) => {
    const n = await figma.getNodeByIdAsync(slot.node);
    if (slot.prop) { for (const t of n.findAll((x) => x.type === 'TEXT')) await fonts(t); n.setProperties({ [slot.prop]: text }); }
    else { await fonts(n); n.characters = (slot.bullet || '') + text; }
  };
  const diffs = [], skipped = [];
  let changed = 0;
  const targets = [];
  for (const s of COPY.sections) {
    if (s.figma && s.lines.length) targets.push({ where: s.name, id: s.figma, lines: s.lines, header: true });
    for (const it of s.items) if (it.figma && it.lines.length) targets.push({ where: s.name + ' › ' + it.title, id: it.figma, lines: it.lines });
  }
  for (const t of targets) {
    const node = await figma.getNodeByIdAsync(t.id);
    if (!node) { skipped.push(t.where + ': node ' + t.id + ' not found'); continue; }
    // A doc frame id takes its header description; any other id is a container.
    const isFrame = frames.some((f) => f.id === node.id);
    const slots = isFrame ? [headerOf(node)].filter(Boolean) : slotsIn(node);
    const want = isFrame ? [{ role: '', text: t.lines.filter((l) => l.role === '').map((l) => l.text).join(' ') }] : t.lines.map((l) => ({ role: l.role, text: l.text }));
    const roles = (a) => a.map((x) => x.role || 'p').join(',');
    if (roles(slots) !== roles(want)) { skipped.push(t.where + ': frame has [' + roles(slots) + '], copy has [' + roles(want) + ']'); continue; }
    for (let i = 0; i < want.length; i++) {
      if (slots[i].text === want[i].text) continue;
      diffs.push({ where: t.where, role: want[i].role || 'paragraph', figma: slots[i].text.slice(0, 160), copy: want[i].text.slice(0, 160) });
      if (MODE === 'apply') { await setSlot(slots[i], want[i].text); changed++; }
    }
  }
  return { page: PAGE, mode: MODE, checked: targets.length, differences: diffs.length, changed, diffs: diffs.slice(0, 40), skipped };
};
