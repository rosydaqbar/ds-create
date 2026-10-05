/** WCAG 2.2 contrast between two token colors (#rrggbb or #rrggbbaa), translucent colors composited over `base`. */

type RGBA = [number, number, number, number];

function parse(hex: string): RGBA {
  const h = hex.replace('#', '');
  const full = h.length === 3 || h.length === 4 ? h.split('').map((ch) => ch + ch).join('') : h;
  const channel = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
  return [channel(0), channel(2), channel(4), full.length >= 8 ? channel(6) : 1];
}

function over(top: RGBA, under: RGBA): RGBA {
  const a = top[3];
  return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1];
}

function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(foreground: string, background: string, base: string): number {
  const bg = over(parse(background), parse(base));
  const fg = over(parse(foreground), bg);
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}
