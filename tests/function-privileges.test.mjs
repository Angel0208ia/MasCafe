import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('la migración publica solo los RPC mínimos para cada rol', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/202609150001_harden_function_privileges.sql', import.meta.url),
    'utf8',
  );

  for (const fn of [
    'create_anonymous_order_with_client(jsonb, uuid)',
    'cancel_anonymous_order(uuid, uuid)',
    'get_anonymous_order(uuid)',
    'get_weekly_best_sellers()',
  ]) {
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn.replace(/[()]/g, '\\$&')} to anon;`, 'i'));
  }
  assert.doesNotMatch(sql, /grant execute[^;]+to anon, authenticated/i);
  assert.match(sql, /create_anonymous_order\(jsonb\)[\s\S]+from public, anon, authenticated;/i);
  assert.match(sql, /record_order_status_event\(\) security invoker;/i);
  assert.match(sql, /revoke execute on functions from public;/i);
});
