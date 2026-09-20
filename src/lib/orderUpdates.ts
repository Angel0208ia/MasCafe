import { getTrackingTokens } from './ordersApi';
import { getSupabaseClient } from './supabase';

type StatusListener = () => void;

let listener: StatusListener | undefined;
const channels = new Map<string, ReturnType<ReturnType<typeof getSupabaseClient>['channel']>>();

function subscribe(token: string): void {
  if (channels.has(token)) return;
  const channel = getSupabaseClient()
    .channel(`order:${token}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'order-status' }, () => listener?.())
    .subscribe();
  channels.set(token, channel);
}

export function refreshOrderUpdateSubscriptions(): void {
  getTrackingTokens().forEach(subscribe);
}

export function startOrderUpdateSubscription(onStatusChange: StatusListener): () => void {
  listener = onStatusChange;
  refreshOrderUpdateSubscriptions();
  return () => {
    listener = undefined;
    const client = getSupabaseClient();
    channels.forEach((channel) => { void client.removeChannel(channel); });
    channels.clear();
  };
}
