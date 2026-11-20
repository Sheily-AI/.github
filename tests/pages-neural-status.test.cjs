'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/neural-status.json'), 'utf8'));
test('snapshot declares ANC honestly', () => {
  const s = data.anc.status;
  assert.equal(data.kind, 'static-snapshot');
  assert.equal(s.integrated, true);
  assert.equal(s.activated, false);
  assert.equal(s.certified, false);
  assert.equal(s.benefitDemonstrated, false);
  assert.ok(data.anc.pipeline.length >= 5);
  assert.match(data.anc.caveats.join(' '), /no está demostrado que se encuentre activo/);
  assert.match(data.anc.caveats.join(' '), /25 sistemas/);
  assert.match(data.anc.caveats.join(' '), /shei\.neural\.anc/);
});

test('public connectome exposes current history and architecture controls', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8');
  assert.match(html, /id="connectome-latest-only"/);
  assert.match(html, /id="connectome-show-architecture"/);
  assert.match(js, /connectome-show-architecture/);
  assert.match(js, /edge\.in_latest_turn === true/);
});
test('index loads one system panel and a notice that transport can update', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /neural-status\.js/);
  const m = html.match(/<div id="sheily-pages-status"[\s\S]*?<\/div>\s*<\/div>/);
  assert.ok(m && /<strong>/.test(m[0]) && /<p>/.test(m[0]));
  assert.doesNotMatch(html, /style="position:fixed;z-index:999999/);
  const js = fs.readFileSync(path.join(root, 'assets/neural-status.js'), 'utf8');
  assert.match(js, /title\.id = 'anc-system-title'/);
  assert.match(js, /system\.after\(panel\)/);
  assert.doesNotMatch(js, /cloneNode/);
});
