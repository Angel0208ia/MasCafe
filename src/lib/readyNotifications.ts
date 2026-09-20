import type { Order } from '../types/product';

export function getNewlyReadyOrders(previous: Order[], current: Order[]): Order[] {
  const previousStatuses = new Map(previous.map((order) => [order.id, order.status]));
  return current.filter(
    (order) => order.status === 'ready' && previousStatuses.get(order.id) !== 'ready'
  );
}
