// node tests/ui/build.mjs OUTDIR  -> OUTDIR/index.html + demo.js + style.css (the UI demo, never dist/)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '../..');
const outdir = process.argv[2];
if (!outdir) { console.error('usage: node tests/ui/build.mjs OUTDIR'); process.exit(1); }
fs.mkdirSync(outdir, { recursive: true });
await build({
  entryPoints: [path.join(here, 'demo/main.js')], bundle: true, format: 'esm', target: 'es2022', outfile: path.join(outdir, 'demo.js'),
  loader: { '.hdr': 'binary', '.exr': 'binary', '.jpg': 'binary', '.png': 'binary', '.glb': 'binary', '.bin': 'binary', '.ktx2': 'binary', '.webp': 'binary' }, sourcemap: 'inline', logLevel: 'warning',
  nodePaths: [path.join(root, 'node_modules')],
});
fs.copyFileSync(path.join(root, 'style.css'), path.join(outdir, 'style.css'));
fs.writeFileSync(path.join(outdir, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><title>Bastion Isle UI demo</title></head><body><div id="ui"></div><script type="module" src="demo.js"></script></body></html>');
console.log('built', path.join(outdir, 'index.html'));
