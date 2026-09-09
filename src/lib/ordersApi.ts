import type { CartItem, Order, OrderStatus, SelectedCustomization } from '../types/product';
import { supabase } from './supabase';

const TRACKING_TOKENS_KEY = 'mascafe-tracking-tokens';

type CreatedOrderRow = {
  order_id: string;
  pickup_code: string;
  tracking_token: string;
  status: OrderStatus;
  total: number | string;
};

type RemoteOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  createdAt: string;
  total: number | string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number | string;
    selections: SelectedCustomization[];
    notes: string;
  }>;
};

function getTrackingTokens(): string[] {
  try {
    const stored = localStorage.getItem(TRACKING_TOKENS_KEY);
    const tokens: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(tokens)
      ? tokens.filter((token): token is string => typeof token === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveTrackingToken(token: string): void {
  const tokens = [token, ...getTrackingTokens().filter((item) => item !== token)].slice(0, 10);
  localStorage.setItem(TRACKING_TOKENS_KEY, JSON.stringify(tokens));
}

function toOrder(order: RemoteOrder): Order {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    total: Number(order.total),
    createdAt: new Date(order.createdAt).getTime(),
    items: order.items.map((item) => ({
      cartItemId: `${order.id}-${item.productId}`,
      productId: item.productId,
      name: item.name,
      image: '',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      selections: item.selections ?? [],
      notes: item.notes ?? '',
    })),
  };
}

export async function createAnonymousOrder(items: CartItem[]): Promise<Order> {
  const payload = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    notes: item.notes,
    selections: item.selections,
  }));

  const { data, error } = await supabase.rpc('create_anonymous_order', { p_items: payload });
  if (error) throw error;

  const created = Array.isArray(data) ? (data[0] as CreatedOrderRow | undefined) : undefined;
  if (!created) throw new Error('El servidor no devolvió el pedido creado.');

  saveTrackingToken(created.tracking_token);

  return {
    id: created.order_id,
    number: created.pickup_code,
    status: created.status,
    total: Number(created.total),
    createdAt: Date.now(),
    items: items.map((item) => ({ ...item })),
  };
}

export async function fetchTrackedOrders(): Promise<Order[]> {
  const responses = await Promise.all(
    getTrackingTokens().map(async (token) => {
      const { data, error } = await supabase.rpc('get_anonymous_order', {
        p_tracking_token: token,
      });
      if (error || !data) return null;
      return toOrder(data as RemoteOrder);
    })
  );

  return responses
    .filter((order): order is Order => order !== null)
    .sort((first, second) => second.createdAt - first.createdAt);
}
