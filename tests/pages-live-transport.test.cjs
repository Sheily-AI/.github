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
      return {status, ok: true, headers: new Headers(), body: null};
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
  assert.equal(calls[0].options.headers.has('x-console-token'), false);
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.redirect, 'error');
});

test('owner token is validated by real session endpoint and remains in memory only', async () => {
  const {calls, sandbox} = build();
  const password = 'PrivatePass2026Secure';
  await sandbox.fetch('/api/auth/session', {method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify({token:password})});
  assert.equal(sandbox.SheilyPagesTransport.isAuthenticated(), true);
  await sandbox.fetch('/api/conversations/abc');
  assert.equal(calls[1].options.headers.get('x-console-token'), password);
  assert.equal(calls[1].url, 'https://yo-venus-series.tail2ed060.ts.net:8443/api/conversations/abc');
  assert.equal(calls[1].options.headers.has('authorization'), false);
  assert.equal(Object.hasOwn(sandbox.SheilyPagesTransport,'ownerPassword'), false);
  await sandbox.fetch('/api/auth/session', {method:'DELETE'});
  assert.equal(sandbox.SheilyPagesTransport.isAuthenticated(), false);
  await sandbox.fetch('/api/chat', {method:'POST',body:'{}'});
  assert.equal(calls.at(-1).options.headers.has('x-console-token'), false);
});

test('private administration, vault, arbitrary endpoints and setup are blocked', async () => {
  const {calls, sandbox} = build();
  for (const path of ['/api/admin/health','/api/vault/items','/api/tidex/status','/api/auth/setup','/api/workspace/closure','/api/shell']) {
    await assert.rejects(sandbox.fetch(path),/no está habilitada/);
  }
  assert.equal(calls.length,0);
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
  assert.equal(calls[0].options.headers.has('x-console-token'),false);
  source.close();
  assert.equal(source.readyState,2);
});
