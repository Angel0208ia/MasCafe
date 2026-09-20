import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNewlyReadyOrders } from '../src/lib/readyNotifications.ts';

const order = (id, status) => ({ id, number: id, status, items: [], total: 0, createdAt: 0, statusEvents: [] });

test('avisa únicamente cuando un pedido entra al estado listo', () => {
  const previous = [order('001', 'preparing'), order('002', 'ready'), order('003', 'received')];
  const current = [order('001', 'ready'), order('002', 'ready'), order('003', 'preparing')];

  assert.deepEqual(getNewlyReadyOrders(previous, current).map(item => item.id), ['001']);
});

test('detecta un pedido listo recuperado al volver a abrir la app', () => {
  assert.deepEqual(getNewlyReadyOrders([], [order('004', 'ready')]).map(item => item.id), ['004']);
});
