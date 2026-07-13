// Assemble le dossier www/ (webDir de Capacitor) a partir des fichiers du site.
// La source reste a la racine (pour la PWA / GitHub Pages) ; www/ est genere.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');

const ITEMS = ['index.html', 'sw.js', 'manifest.json', 'assets', 'icons'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const item of ITEMS) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(out, item), { recursive: true });
}

console.log('www/ genere avec :', ITEMS.join(', '));
