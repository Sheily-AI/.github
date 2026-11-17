'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/site.js', 'utf8');
const from = source.indexOf('function systemObservationHint(');
const to = source.indexOf('async function loadSystemStatus()', from);
assert.ok(from >= 0 && to > from, 'diagnostic helpers must be isolated before loadSystemStatus');
const sandbox = {};
vm.runInNewContext(source.slice(from, to) + '\nthis.hint = systemObservationHint; this.readyHint = systemReadinessHint;', sandbox);

test('HTTP rejection is explained without exposing private response text', () => {
  const observation = { status: 'rejected', reason: {
    status: 503, code: 'MEMORY_BACKEND_INTERNAL', message: 'private-secret-should-not-surface',
  }};
  const result = sandbox.hint(observation);
  assert.match(result, /HTTP 503/);
  assert.doesNotMatch(result, /private-secret|MEMORY_BACKEND_INTERNAL/);
});

test('lost authentication gets precise safe recovery advice', () => {
  assert.match(sandbox.hint({status:'rejected',reason:{code:'AUTH_REQUIRED',status:401}}),/iniciar sesión/);
});

test('readiness flags name only failed dependencies', () => {
  const result = sandbox.readyHint({status:'fulfilled',value:{
    status:503, body:{ready:false,upstream_ready:false,inventory_complete:true,workspace_closure_complete:false,
                      private_path:'/mnt/DATOS_1TB/IA/private-path-DO-NOT-EXPOSE'}
  }});
  assert.match(result,/API cognitiva/);
  assert.match(result,/espacio de trabajo/);
  assert.doesNotMatch(result,/inventario/);
  assert.doesNotMatch(result,/DO-NOT-EXPOSE/);
});

test('200-ready confirmation produces no error reason', () => {
  assert.equal(sandbox.readyHint({status:'fulfilled',value:{status:200,body:{ready:true}}}), '');
});

test('network failure is not silently counted as verified', () => {
  assert.match(sandbox.hint({status:'rejected',reason:{message:'TLS error with personal content'}}),/no recibió una respuesta verificable/);
  assert.doesNotMatch(sandbox.hint({status:'rejected',reason:{message:'personal content'}}),/personal content/);
});

test('public TIDEX is excluded from verifiable count without being reclassified as successful', () => {
  assert.match(source,/const checkable = entries\.length - restricted/);
  assert.match(source,/result === 'restricted' \? 'Restringido en web pública'/);
  assert.match(source,/result === true \? 'Comprobado'/);
  assert.match(source,/notesReachable === true \? '' : notes\.status === 'rejected'/);
  assert.match(source,/sessionScoped === true \? '' : selection\.status === 'rejected'/);
});
