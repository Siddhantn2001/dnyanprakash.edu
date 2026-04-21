/*
 * Fix self-referential nav links inside each subdirectory.
 *   file at /{dir}/*.html with href="{dir}/…" → href="…"
 *
 * Already run on /admission/ last turn. This covers the remaining four dirs.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['about', 'academics', 'campus-life', 'news'];

let totalFiles = 0, totalFixed = 0;
for (const dir of DIRS) {
  const absDir = path.join(ROOT, dir);
  for (const f of fs.readdirSync(absDir)) {
    if (!f.endsWith('.html')) continue;
    const fp = path.join(absDir, f);
    const before = fs.readFileSync(fp, 'utf8');
    const pattern = new RegExp(`href="${dir}/`, 'g');
    const after = before.replace(pattern, 'href="');
    const changes = (before.match(pattern) || []).length;
    if (changes > 0) {
      fs.writeFileSync(fp, after);
      console.log(`  ${dir}/${f}: ${changes}`);
      totalFixed += changes;
    }
    totalFiles++;
  }
}
console.log(`\n${totalFiles} files checked, ${totalFixed} broken links fixed.`);
