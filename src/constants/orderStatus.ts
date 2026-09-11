import type { OrderStatus } from '../types/product';

export type OrderTimelineStep = {
  status: Exclude<OrderStatus, 'cancelled'>;
  title: string;
  description: string;
};

export const ORDER_TIMELINE: readonly OrderTimelineStep[] = [
  {
    status: 'received',
    title: 'Pedido recibido',
    description: 'Más Café recibió correctamente tu pedido.',
  },
  {
    status: 'preparing',
    title: 'En preparación',
    description: 'La cafetería está preparando tus productos.',
  },
  {
    status: 'ready',
    title: 'Listo para recoger',
    description: 'Ya puedes pasar por tu pedido a la cafetería.',
  },
  {
    status: 'delivered',
    title: 'Pedido entregado',
    description: 'Tu pedido fue recogido y finalizado.',
  },
];

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    received: 'Recibido',
    preparing: 'En preparación',
    ready: 'Listo para recoger',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return labels[status];
}

export function getOrderStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    received: 'Recibimos tu pedido',
    preparing: 'Estamos preparando tu pedido',
    ready: 'Tu pedido está listo',
    delivered: 'Pedido entregado',
    cancelled: 'Pedido cancelado',
  };
  return messages[status];
}

export function getOrderProgressIndex(status: OrderStatus): number {
  if (status === 'cancelled') return 0;
  return ORDER_TIMELINE.findIndex((step) => step.status === status);
}

