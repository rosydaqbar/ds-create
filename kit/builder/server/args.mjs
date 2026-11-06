// Arguments of kit/builder/server/index.mjs: [port] [prefer] [--output <dir>], in any order.
export function parseServerArgs(argv) {
  const out = { output: undefined, port: 0, prefer: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--output') {
      const value = argv[++i];
      if (!value || value.startsWith('--') || value === 'prefer' || /^\d+$/.test(value)) throw new Error('--output needs a folder.');
      out.output = value;
    } else if (a === 'prefer') out.prefer = true;
    else if (/^\d+$/.test(a)) out.port = Number(a);
    else throw new Error(`Unknown argument ${a}.`);
  }
  return out;
}
