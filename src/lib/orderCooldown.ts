import type { Order } from '../types/product';

export const ORDER_COOLDOWN_MS = 30 * 60 * 1000;

export function getOrderCooldownUntil(latestOrder?: Pick<Order, 'status' | 'createdAt'>): number {
  // La sanción por reincidencia es independiente y tiene prioridad en el store.
  return latestOrder && latestOrder.status !== 'cancelled'
    ? latestOrder.createdAt + ORDER_COOLDOWN_MS
    : 0;
}
