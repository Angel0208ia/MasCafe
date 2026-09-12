import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getOrderCooldownUntil, ORDER_COOLDOWN_MS } from '../src/lib/orderCooldown.ts';

test('la cancelación libera la espera normal y el pedido nuevo vuelve a aplicar 30 minutos', () => {
  assert.equal(getOrderCooldownUntil(), 0);
  assert.equal(getOrderCooldownUntil({ status: 'cancelled', createdAt: 1000 }), 0);
  for (const status of ['received', 'preparing', 'ready', 'delivered']) {
    assert.equal(getOrderCooldownUntil({ status, createdAt: 1000 }), 1000 + ORDER_COOLDOWN_MS);
  }
});

test('la sanción de dos horas sigue prevaleciendo tras otra cancelación', () => {
  const blockedUntil = Date.now() + 2 * 60 * 60 * 1000;
  const regularUntil = getOrderCooldownUntil({ status: 'cancelled', createdAt: Date.now() });
  assert.equal(Math.max(regularUntil, blockedUntil), blockedUntil);
});
