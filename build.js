/* BOKUL — Tek Dosya Paketleyici
 * Sıfır bağımlılık. Çalıştır: node build.js  →  dist/bokul.html
 * index.html şablonundaki <link> ve <script src> etiketlerini içerikle değiştirir,
 * content/*.json dosyalarını gömülü bloklar olarak ekler.
 * Çıktı dosyası file:// ile çift tıklayınca çalışır. */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* Deterministik yükleme sırası (index.html ile birebir aynı) */
const CSS = [
  'src/styles/base.css',
  'src/styles/components.css',
  'src/styles/screens.css',
];
const JS = [
  'src/core/events.js',
  'src/core/event-bus.js',
  'src/core/game-state.js',
  'src/core/auth.js',
  'src/core/curriculum.js',
  'src/core/save-manager.js',
  'src/core/cloud-sync.js',
  'src/core/auth-cloud.js',
  'src/core/consent.js',
  'src/core/perms.js',
  'src/core/items.js',
  'src/core/content-registry.js',
  'src/engines/audio-manager.js',
  'src/engines/dialogue-manager.js',
  'src/engines/progress-manager.js',
  'src/engines/reward-engine.js',
  'src/engines/question-engine.js',
  'src/engines/lesson-engine.js',
  'src/engines/chest-engine.js',
  'src/engines/quest-engine.js',
  'src/engines/wish-engine.js',
  'src/interactions/long-division/logic.js',
  'src/interactions/long-division/teach-models.js',
  'src/interactions/long-division/view.js',
  'src/interactions/multiple-choice/logic.js',
  'src/interactions/multiple-choice/view.js',
  'src/interactions/arithmetic/logic.js',
  'src/interactions/arithmetic/view.js',
  'src/ui/animation-engine.js',
  'src/ui/components/timer.js',
  'src/ui/components/svg-art.js',
  'src/ui/components/avatar.js',
  'src/ui/components/commander.js',
  'src/ui/components/chest-ui.js',
  'src/ui/ui-manager.js',
  'src/ui/screens/home-screen.js',
  'src/ui/screens/world-screen.js',
  'src/ui/screens/map-screen.js',
  'src/ui/screens/mission-screen.js',
  'src/ui/screens/boss-screen.js',
  'src/ui/screens/locker-screen.js',
  'src/ui/screens/evim-screen.js',
  'src/ui/screens/store-screen.js',
  'src/ui/screens/quests-screen.js',
  'src/ui/screens/intro-screen.js',
  'src/ui/screens/creator-screen.js',
  'src/ui/screens/login-screen.js',
  'src/ui/screens/wishes-screen.js',
  'src/ui/screens/admin-screen.js',
  'src/ui/screens/interests-screen.js',
  'src/core/game-engine.js',
  'src/main.js',
];
const CONTENT = [
  'config',
  'dialogues',
  'rewards',
  'story',
  'quests',
  'legal',
  'items',
  'lessons/math-core',
  'lessons/eng-101',
  'lessons/ai-101',
  'lessons/care-101',
  'lessons/philo-101',
];

let html = read('index.html');

/* 1) CSS'leri tek <style> bloğuna göm */
const cssBundle = CSS.map(f => '/* === ' + f + ' === */\n' + read(f)).join('\n');
html = html.replace(/<link rel="stylesheet"[^>]*>\s*/g, '');
html = html.replace('</head>', '<style>\n' + cssBundle + '\n</style>\n</head>');

/* 2) JSON içerikleri gömülü bloklar olarak ekle (script'lerden ÖNCE gelmeli) */
const contentBundle = CONTENT.map(name => {
  const json = read('content/' + name + '.json');
  // JSON içinde </script> geçmesi ihtimaline karşı kaçır
  const safe = json.replace(/<\//g, '<\\/');
  return '<script type="application/json" id="bokul-content-' + name.replace(/\//g, '-') + '">\n' + safe + '\n</script>';
}).join('\n');

/* 3) JS'leri tek <script> bloğuna göm */
const jsBundle = JS.map(f => '/* === ' + f + ' === */\n' + read(f)).join('\n');
html = html.replace(/<script src="[^"]*"><\/script>\s*/g, '');
html = html.replace('</body>', contentBundle + '\n<script>\n' + jsBundle + '\n</script>\n</body>');

/* 4) Yaz ve raporla */
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'bokul.html');
fs.writeFileSync(out, html);
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log('✔ dist/bokul.html üretildi (' + kb + ' KB) — çift tıkla ve oyna!');
