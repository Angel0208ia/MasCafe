import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { singleFlight } from '../src/lib/singleFlight.ts';

test('los refrescos simultáneos comparten una consulta y los posteriores traen datos nuevos', async () => {
  let calls = 0;
  let resolve;
  const refresh = singleFlight(() => { calls++; return new Promise(done => { resolve = done; }); });
  const a = refresh(), b = refresh();
  assert.equal(a, b);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve('actual');
  assert.equal(await a, 'actual');
  const next = refresh();
  await Promise.resolve();
  assert.equal(calls, 2);
  resolve('nuevo');
  assert.equal(await next, 'nuevo');
});
test('una consulta fallida permite reintentar', async () => {
  let calls = 0;
  const refresh = singleFlight(async () => { if (++calls === 1) throw new Error('sin red'); return 'ok'; });
  await assert.rejects(refresh(), /sin red/);
  assert.equal(await refresh(), 'ok');
});
test('Metro excluye otros proyectos y exportaciones, pero conserva la app y sus recursos', () => {
  const require = createRequire(import.meta.url);
  const config = require('../metro.config.js');
  const blocked = file => config.resolver.blockList.some(rule => rule.test(path.resolve(file)));
  for (const file of ['admin-panel/node_modules/react/index.js', 'work/ios-tabs-check/index.html', 'dist/index.html']) assert.equal(blocked(file), true, file);
  for (const file of ['src/app/_layout.tsx', 'assets/images/icon.png', 'node_modules/react/index.js']) assert.equal(blocked(file), false, file);
});
