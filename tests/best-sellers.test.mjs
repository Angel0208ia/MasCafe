import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

test('ranking comparte peticiones, conserva referencias y no consulta en cada refresco', async () => {
  const source = await readFile(new URL('../src/lib/bestSellersApi.ts', import.meta.url), 'utf8');
  const mocked = source.replace("import { getSupabaseClient } from './supabase';", `
    export let calls = 0;
    const supabase = { rpc(name) {
      if (name !== 'get_weekly_best_sellers') throw new Error('RPC incorrecta');
      calls++;
      return { async abortSignal() {
        await Promise.resolve();
        return { data: [{ product_id: '17', quantity: 19 }], error: null };
      } };
    } };
    const getSupabaseClient = () => supabase;
  `);
  const code = stripTypeScriptTypes(mocked);
  const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const first = api.loadWeeklyBestSellers();
  assert.equal(first, api.loadWeeklyBestSellers());
  const ranking = await first;
  assert.deepEqual(ranking, [{ product_id: '17', quantity: 19 }]);
  assert.equal(await api.loadWeeklyBestSellers(), ranking);
  assert.equal(api.calls, 1);
});
