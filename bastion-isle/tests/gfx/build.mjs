// node tests/gfx/build.mjs path/to/demo-entry.js OUTDIR   -> OUTDIR/demo.js + OUTDIR/index.html
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const [entry, outdir] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
await build({
  entryPoints: [entry], bundle: true, format: 'esm', target: 'es2022', outfile: path.join(outdir, 'demo.js'),
  loader: { '.hdr': 'binary', '.exr': 'binary', '.jpg': 'binary', '.png': 'binary', '.glb': 'binary' }, sourcemap: 'inline', logLevel: 'warning',
  nodePaths: [path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../node_modules')],
});
fs.writeFileSync(path.join(outdir, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body><script type="module" src="demo.js"></script></body></html>');
console.log('built', path.join(outdir, 'index.html'));
