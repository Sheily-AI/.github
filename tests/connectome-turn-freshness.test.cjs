'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'site.js'), 'utf8');
const start = source.indexOf('function connectomeTurnTiming(');
const end = source.indexOf('\nfunction renderObservedConnectome(', start);
assert.ok(start >= 0 && end > start, 'render timing helper must exist');
const context = {};
vm.runInNewContext(source.slice(start, end), context);
const now = Date.parse('2026-11-18T20:00:00Z');
const observed = (terminal_status, ended_at, started_at) => ({
  latest_turn: {terminal_status, ended_at, started_at},
});
assert.equal(context.connectomeTurnTiming(observed('COMMITTED', '2026-11-17T21:18:27Z'), now).running, false,
  'historical COMMITTED turns must not animate');
assert.equal(context.connectomeTurnTiming(observed('COMMITTED', '2026-11-18T19:59:58Z'), now).running, false,
  'even a recent COMMITTED turn must not be presented as running');
assert.equal(context.connectomeTurnTiming(observed('RUNNING', undefined, '2026-11-18T19:59:50Z'), now).running, true,
  'recent running turns may animate');
assert.equal(context.connectomeTurnTiming(observed('RUNNING', undefined, '2026-11-18T19:00:00Z'), now).running, false,
  'stalled running turns must not animate indefinitely');
assert.equal(context.connectomeTurnTiming(observed('RUNNING', undefined, undefined), now).running, false,
  'missing timestamps never certify liveness');
console.log('connectome-turn-freshness: 5 assertions passed');
