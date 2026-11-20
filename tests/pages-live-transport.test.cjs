'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function build() {
  const calls = [];
  const sandbox = {
    location: {origin:'https://sheily-ai.github.io', href:'https://sheily-ai.github.io/.github/'},
    Headers, AbortController, TextDecoder, URL, Promise, console,
    fetch: async (url, options = {}) => {
      calls.push({url, options});
      const status = String(url).endsWith('/api/auth/session') ? 204 : 200;
      const headers = new Headers();
      if (String(url).endsWith('/api/auth/session') && String(options.method).toUpperCase() === 'POST') headers.set('X-Sheily-Bridge-Session', 'x'.repeat(43));
      return {status, ok: true, headers, body: null};
    }
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync('assets/pages-live-transport.js','utf8'), sandbox);
  return {calls, sandbox};
}

test('no initial password; requests route to pinned HTTPS only', async () => {
  const {calls, sandbox} = build();
  await sandbox.fetch('/api/conversations');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://yo-venus-series.tail2ed060.ts.net:8443/api/conversations');
  assert.equal(calls[0].options.headers.has('x-sheily-bridge-session'), false);
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.redirect, 'error');
});

test('owner password is used once then only an opaque server ticket is sent', async () => {
  const {calls, sandbox} = build();
  const password = 'PrivatePass2026Secure';
  await sandbox.fetch('/api/auth/session', {method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify({token:password})});
  assert.equal(sandbox.SheilyPagesTransport.isAuthenticated(), true);
  await sandbox.fetch('/api/conversations/abc');
  assert.equal(calls[1].options.headers.get('x-sheily-bridge-session'), 'x'.repeat(43));
  assert.equal(calls[1].options.headers.has('x-console-token'), false);
  assert.equal(calls[0].options.body, JSON.stringify({token:password}));
  assert.equal(calls[1].options.body, undefined);
  assert.equal(calls[1].url, 'https://yo-venus-series.tail2ed060.ts.net:8443/api/conversations/abc');
  assert.equal(calls[1].options.headers.has('authorization'), false);
  assert.equal(Object.hasOwn(sandbox.SheilyPagesTransport,'ownerPassword'), false);
  assert.equal(JSON.stringify(calls[1].options).includes(password), false);
  await sandbox.fetch('/api/auth/session', {method:'DELETE'});
  assert.equal(calls[2].options.headers.get('x-sheily-bridge-session'), 'x'.repeat(43));
  assert.equal(sandbox.SheilyPagesTransport.isAuthenticated(), false);
  await sandbox.fetch('/api/chat', {method:'POST',body:'{}'});
  assert.equal(calls.at(-1).options.headers.has('x-sheily-bridge-session'), false);
});

test('owner production surfaces use the scoped ticket while arbitrary endpoints stay blocked', async () => {
  const {calls, sandbox} = build();
  for (const path of ['/api/auth/setup','/api/shell']) {
    await assert.rejects(sandbox.fetch(path),/no está habilitada/);
  }
  assert.equal(calls.length,0);
  await sandbox.fetch('/api/auth/session', {method:'POST', body:JSON.stringify({token:'SomeSecurePassword2026'})});
  for (const path of ['/api/vault/items','/api/admin/health','/api/tidex/status','/api/workspace/closure']) {
    await sandbox.fetch(path);
    const call = calls.at(-1);
    assert.equal(call.url, 'https://yo-venus-series.tail2ed060.ts.net:8443' + path);
    assert.equal(call.options.headers.get('x-sheily-bridge-session'), 'x'.repeat(43));
    assert.equal(call.options.credentials, 'omit');
  }
});

test('outside requests are not forwarded to SHEILY backend', async () => {
  const {calls, sandbox} = build();
  await sandbox.fetch('https://example.com/news');
  assert.equal(calls[0].url,'https://example.com/news');
  assert.equal(calls[0].options.headers, undefined);
});

test('SSE uses authenticated fetch, not URL credentials', async () => {
  const {calls, sandbox} = build();
  const source = new sandbox.EventSource('/api/control/turns/abc/events');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls[0].url,'https://yo-venus-series.tail2ed060.ts.net:8443/api/control/turns/abc/events');
  assert.equal(calls[0].options.headers.has('x-sheily-bridge-session'),false);
  source.close();
  assert.equal(source.readyState,2);
});

test('a login response without a valid opaque ticket fails closed', async () => {
  const {sandbox} = build();
  // Replace transport at boot to simulate an upstream that accepted login but issued no scoped ticket.
  const source = fs.readFileSync('assets/pages-live-transport.js', 'utf8');
  const broken = {
    location: sandbox.location, Headers, AbortController, TextDecoder, URL, Promise, console,
    fetch: async () => ({ status:204, ok:true, headers:new Headers(), body:null }),
  };
  broken.globalThis=broken;
  vm.runInNewContext(source, broken);
  await assert.rejects(broken.fetch('/api/auth/session', {
    method:'POST', body:JSON.stringify({token:'SomeSecurePassword2026'})
  }), /pasarela no entregó una sesión válida/);
  assert.equal(broken.SheilyPagesTransport.isAuthenticated(),false);
});

test('real console health and readiness require owner session and use protected aliases', async () => {
  const {calls, sandbox} = build();
  await sandbox.fetch('/health');
  await sandbox.fetch('/ready');
  assert.equal(calls[0].url, 'https://yo-venus-series.tail2ed060.ts.net:8443/api/bridge/health');
  assert.equal(calls[1].url, 'https://yo-venus-series.tail2ed060.ts.net:8443/api/bridge/ready');
  assert.equal(calls[0].options.headers.has('x-sheily-bridge-session'), false);
  assert.equal(calls[1].options.headers.has('x-sheily-bridge-session'), false);

  await sandbox.fetch('/api/auth/session', {method:'POST', body: JSON.stringify({token:'SomeSecurePassword2026'})});
  await sandbox.fetch('/health');
  await sandbox.fetch('/ready');
  assert.equal(calls[3].options.headers.get('x-sheily-bridge-session'), 'x'.repeat(43));
  assert.equal(calls[4].options.headers.get('x-sheily-bridge-session'), 'x'.repeat(43));
  assert.equal(calls[3].options.credentials, 'omit');
  assert.equal(calls[4].options.credentials, 'omit');
});

test('public system panel checks TIDEX through owner authentication and keeps readiness evidence-gated', () => {
  const site = fs.readFileSync('assets/site.js', 'utf8');
  assert.doesNotMatch(site, /Restringido en web pública/);
  assert.match(site, /tidexReachable = valueOrUnknown/);
  assert.match(site, /readiness\.value\.body\.ready === true/);
  assert.match(site, /health\.value\.body\.status === 'alive'/);
});
