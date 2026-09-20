import type { CancelOrderResult, CartItem, Order, OrderLocation, OrderStatus, SelectedCustomization } from '../types/product';
import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from './supabase';
import { readStorageItem, removeStorageItem, writeStorageItem } from './storageAccess';

const TRACKING_TOKENS_KEY = 'mascafe-tracking-tokens';
const TRACKED_ORDERS_KEY = 'mascafe-tracked-orders';
const CLIENT_TOKEN_KEY = 'mascafe-client-token';
const ORDERING_BLOCKED_UNTIL_KEY = 'mascafe-ordering-blocked-until';
// Los estados finales no pueden cambiar según las transiciones del servidor.
const completedOrders = new Map<string, Order>();

type CreatedOrderRow = {
  order_id: string;
  pickup_code: string;
  tracking_token: string;
  status: OrderStatus;
  total: number | string;
  anonymous_client_token: string;
};

type CancelledOrderRow = {
  cancelled_order_id: string;
  cancelled_status: OrderStatus;
  anonymous_client_token: string;
  total_cancellations: number;
  ordering_blocked_until: string | null;
};

type RemoteOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  createdAt: string;
  total: number | string;
  statusEvents?: {
    status: OrderStatus;
    createdAt: string;
  }[];
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number | string;
    selections: SelectedCustomization[];
    notes: string;
    image?: string;
  }[];
};

export function getTrackingTokens(): string[] {
  try {
    const stored = readStorageItem(TRACKING_TOKENS_KEY);
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
  writeStorageItem(TRACKING_TOKENS_KEY, JSON.stringify(tokens));
}

function getTrackedOrderTokens(): Record<string, string> {
  try {
    const stored = readStorageItem(TRACKED_ORDERS_KEY);
    const value: unknown = stored ? JSON.parse(stored) : {};
    return typeof value === 'object' && value !== null
      ? value as Record<string, string>
      : {};
  } catch {
    return {};
  }
}

function saveTrackedOrderToken(orderId: string, trackingToken: string): void {
  const trackedOrders = getTrackedOrderTokens();
  writeStorageItem(TRACKED_ORDERS_KEY, JSON.stringify({
    ...trackedOrders,
    [orderId]: trackingToken,
  }));
}

function getClientToken(): string | null {
  return readStorageItem(CLIENT_TOKEN_KEY);
}

function saveClientToken(token: string): void {
  writeStorageItem(CLIENT_TOKEN_KEY, token);
}

function ensureClientToken(): string {
  const stored = getClientToken();
  if (stored) return stored;
  const token = Crypto.randomUUID();
  saveClientToken(token);
  return token;
}

function saveOrderingBlockedUntil(timestamp: number): void {
  if (timestamp > Date.now()) {
    writeStorageItem(ORDERING_BLOCKED_UNTIL_KEY, String(timestamp));
  } else {
    removeStorageItem(ORDERING_BLOCKED_UNTIL_KEY);
  }
}

export function getOrderingBlockedUntil(): number {
  const timestamp = Number(readStorageItem(ORDERING_BLOCKED_UNTIL_KEY) ?? 0);
  return Number.isFinite(timestamp) && timestamp > Date.now() ? timestamp : 0;
}

function toOrder(order: RemoteOrder): Order {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    total: Number(order.total),
    createdAt: new Date(order.createdAt).getTime(),
    statusEvents: (order.statusEvents ?? []).map((event) => ({
      status: event.status,
      createdAt: new Date(event.createdAt).getTime(),
    })),
    items: order.items.map((item) => ({
      cartItemId: `${order.id}-${item.productId}`,
      productId: item.productId,
      name: item.name,
      image: item.image ?? '',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      selections: item.selections ?? [],
      notes: item.notes ?? '',
    })),
  };
}

export async function createAnonymousOrder(items: CartItem[], location: OrderLocation): Promise<Order> {
  const supabase = getSupabaseClient();
  const payload = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    notes: item.notes,
    selections: item.selections,
  }));

  const { data, error } = await supabase.rpc('create_anonymous_order_with_client', {
    p_items: payload,
    p_client_token: ensureClientToken(),
    p_latitude: location.latitude,
    p_longitude: location.longitude,
    p_accuracy: location.accuracy,
  });
  if (error) throw error;

  const created = Array.isArray(data) ? (data[0] as CreatedOrderRow | undefined) : undefined;
  if (!created) throw new Error('El servidor no devolvió el pedido creado.');

  saveTrackingToken(created.tracking_token);
  saveTrackedOrderToken(created.order_id, created.tracking_token);
  saveClientToken(created.anonymous_client_token);

  const createdAt = Date.now();
  return {
    id: created.order_id,
    number: created.pickup_code,
    status: created.status,
    total: Number(created.total),
    createdAt,
    statusEvents: [{ status: created.status, createdAt }],
    items: items.map((item) => ({ ...item })),
  };
}

export async function fetchTrackedOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const responses = await Promise.all(
    getTrackingTokens().map(async (token) => {
      const completed = completedOrders.get(token);
      if (completed) return completed;
      const { data, error } = await supabase.rpc('get_anonymous_order', {
        p_tracking_token: token,
      });
      if (error) throw error; // No borrar pedidos visibles por un fallo temporal.
      if (!data) return null;
      const order = toOrder(data as RemoteOrder);
      if (getTrackedOrderTokens()[order.id] !== token) saveTrackedOrderToken(order.id, token);
      if (order.status === 'delivered' || order.status === 'cancelled') completedOrders.set(token, order);
      return order;
    })
  );

  return responses
    .filter((order): order is Order => order !== null)
    .sort((first, second) => second.createdAt - first.createdAt);
}

export async function cancelAnonymousOrder(orderId: string): Promise<CancelOrderResult> {
  const supabase = getSupabaseClient();
  const trackingToken = getTrackedOrderTokens()[orderId];
  if (!trackingToken) {
    return { success: false, message: 'No encontramos la autorización para cancelar este pedido.' };
  }

  const { data, error } = await supabase.rpc('cancel_anonymous_order', {
    p_tracking_token: trackingToken,
    p_client_token: getClientToken(),
  });
  if (error) return { success: false, message: error.message };

  const cancelled = Array.isArray(data) ? data[0] as CancelledOrderRow | undefined : undefined;
  if (!cancelled) {
    return { success: false, message: 'El servidor no confirmó la cancelación.' };
  }

  saveClientToken(cancelled.anonymous_client_token);
  const blockedUntil = cancelled.ordering_blocked_until
    ? new Date(cancelled.ordering_blocked_until).getTime()
    : 0;
  saveOrderingBlockedUntil(blockedUntil);

  return {
    success: true,
    orderId: cancelled.cancelled_order_id,
    blockedUntil,
    cancellationCount: Number(cancelled.total_cancellations),
  };
}
