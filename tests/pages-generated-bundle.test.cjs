'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('published bundle identifies its canonical source and contains no static runtime snapshot', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const site = fs.readFileSync('assets/site.js', 'utf8');
  const provenance = JSON.parse(fs.readFileSync('assets/build-provenance.json', 'utf8'));
  assert.equal(provenance.schema, 'sheily.pages.build-provenance/v1');
  assert.equal(provenance.source_repository, 'Sheily-AI/SHEILY-COGNITIVA');
  assert.match(provenance.source_sha, /^[0-9a-f]{40}$/);
  assert.match(html, /id="connectome-mode-live"[^>]+checked/);
  assert.match(site, /Sin ejecución verificada en curso/);
  assert.doesNotMatch(html, /neural-status|static-snapshot/);
  assert.equal(fs.existsSync('assets/neural-status.json'), false);
  assert.equal(fs.existsSync('assets/neural-status.js'), false);
});
