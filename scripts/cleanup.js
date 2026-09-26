// Usage:
//   node scripts/cleanup.js          -> dry run (report only)
//   node scripts/cleanup.js --apply  -> delete safe files
//   node scripts/cleanup.js --apply --force -> also delete differing -2 copies
import { readdirSync, readFileSync, statSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

const root = process.cwd();
const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const SKIP = new Set(['node_modules', '.git', 'dist', '.agents', '.cache']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(root, p);
const all = walk(root);
const sources = all.filter((f) => /\.(m?js|jsx|ts|tsx|json)$/.test(f));
const toDelete = [];
const review = [];

// 1. Root strays from mis-executed commands
for (const name of readdirSync(root)) {
  if (
    name === 'process.env.PORT' ||
    name === 'App.jsx' ||
    /^file\d+\.(js|jsx|json|txt)$/.test(name)
  ) {
    toDelete.push({ file: path.join(root, name), why: 'stray root file' });
  }
}

// 2. "-2" duplicates
const dupRe = /^(.*)-2(\.[^/\\]+)$/;
for (const f of all) {
  const base = path.basename(f);
  const m = base.match(dupRe);
  if (!m) continue;
  const original = path.join(path.dirname(f), m[1] + m[2]);
  const stem = m[1] + '-2';
  const importers = sources.filter(
    (s) => s !== f && !toDelete.some((d) => d.file === s) &&
      new RegExp(`['"/]${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.[a-z]+)?['"]`).test(readFileSync(s, 'utf8'))
  );
  if (importers.length) {
    review.push({ file: f, why: `imported by ${importers.map(rel).join(', ')} — fix import first` });
    continue;
  }
  if (!existsSync(original)) {
    review.push({ file: f, why: `no original ${rel(original)} — rename instead of deleting` });
    continue;
  }
  const same = readFileSync(f, 'utf8').trim() === readFileSync(original, 'utf8').trim();
  if (same || FORCE) toDelete.push({ file: f, why: same ? 'identical to original' : 'differs (forced)' });
  else review.push({ file: f, why: `differs from ${rel(original)} — diff and merge manually` });
}

// 3. Wiring checks
const warnings = [];
const idx = path.join(root, 'server/index.js');
if (existsSync(idx)) {
  const s = readFileSync(idx, 'utf8') + (existsSync(path.join(root, 'server/app.js')) ? readFileSync(path.join(root, 'server/app.js'), 'utf8') : '');
  if (!s.includes('process.env.PORT')) warnings.push('server does not read process.env.PORT');
  if (!s.includes('0.0.0.0')) warnings.push("server does not bind to '0.0.0.0'");
  if (!/routes\/features(\.js)?['"]/.test(s)) warnings.push('routes/features.js is not mounted');
  if (!/client[/'", ]+dist|dist['"]/.test(s)) warnings.push('production build (client/dist) SPA fallback not found');
  const rawIdx = s.indexOf('express.raw');
  const jsonIdx = s.indexOf('express.json');
  if (jsonIdx !== -1 && (rawIdx === -1 || rawIdx > jsonIdx))
    warnings.push('express.raw() for Stripe webhook must be registered before express.json()');
}
const schema = path.join(root, 'server/db/schema.js');
if (existsSync(schema)) {
  const s = readFileSync(schema, 'utf8');
  for (const t of ['gift_cards', 'deposits', 'audit_logs', 'manage_tokens'])
    if (!s.includes(`'${t}'`) && !s.includes(`"${t}"`)) warnings.push(`schema.js missing Drizzle table ${t}`);
}

// Report
console.log(`\n== ${APPLY ? 'Deleting' : 'Would delete'} (${toDelete.length}) ==`);
for (const d of toDelete) {
  console.log(`  ${rel(d.file)}  [${d.why}]`);
  if (APPLY) unlinkSync(d.file);
}
console.log(`\n== Needs manual review (${review.length}) ==`);
for (const r of review) console.log(`  ${rel(r.file)}  [${r.why}]`);
console.log(`\n== Wiring warnings (${warnings.length}) ==`);
for (const w of warnings) console.log(`  ! ${w}`);
if (!APPLY) console.log('\nDry run. Re-run with --apply to delete.');
process.exitCode = warnings.length ? 1 : 0;
