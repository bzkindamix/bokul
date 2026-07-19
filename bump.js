/* BOKUL — Sürüm yükseltme yardımcısı
 * Kullanım: node bump.js 0.37 "Kısa açıklama"
 * Tek komutla 4 yeri günceller: version.json, main.js B.VERSION,
 * index.html splash notu ve tüm ?v= cache-busting etiketleri.
 * Ardından: node build.js  (ve git commit/push). */
const fs = require('fs');
const path = require('path');
const V = process.argv[2];
const DESC = process.argv[3] || '';
if (!V || !/^\d+\.\d+$/.test(V)) {
  console.error('Kullanım: node bump.js <sürüm> "açıklama"   (ör. node bump.js 0.37 "Yeni özellik")');
  process.exit(1);
}
const root = __dirname;
const rd = p => fs.readFileSync(path.join(root, p), 'utf8');
const wr = (p, s) => fs.writeFileSync(path.join(root, p), s);

wr('version.json', '{ "version": "' + V + '" }\n');

let main = rd('src/main.js').replace(/B\.VERSION = '[^']*'/, "B.VERSION = '" + V + "'");
wr('src/main.js', main);

let html = rd('index.html')
  .replace(/\?v=[0-9.]+/g, '?v=' + V)
  .replace(/<div class="splash-note">[^<]*<\/div>/, '<div class="splash-note">v' + V + (DESC ? ' — ' + DESC : '') + '</div>');
wr('index.html', html);

console.log('✔ ' + V + ' sürümüne yükseltildi (version.json, main.js, index.html ?v + splash).');
console.log('  Sıradaki: node build.js  →  git add -A && commit && push');
