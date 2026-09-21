import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { Order } from '../types/product';
import { readStorageItem, writeStorageItem } from './storageAccess';

const READY_CHANNEL = 'orders';
const NOTIFIED_ORDERS_KEY = 'mascafe-ready-notified-orders';
type ExpoNotifications = typeof import('expo-notifications');
let notificationsPromise: Promise<ExpoNotifications | null> | null = null;
let notificationHandlerConfigured = false;

function supportsNativeNotifications(): boolean {
  return Platform.OS !== 'web'
    && !(Platform.OS === 'android'
      && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);
}

async function getNativeNotifications(): Promise<ExpoNotifications | null> {
  if (!supportsNativeNotifications()) return null;
  notificationsPromise ??= import('expo-notifications').catch(() => null);
  return notificationsPromise;
}

function configureNotificationHandler(notifications: ExpoNotifications): void {
  if (notificationHandlerConfigured) return;
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

function getNotifiedOrderIds(): Set<string> {
  try {
    const value: unknown = JSON.parse(readStorageItem(NOTIFIED_ORDERS_KEY) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function markOrderNotified(orderId: string): void {
  const ids = getNotifiedOrderIds();
  ids.add(orderId);
  writeStorageItem(NOTIFIED_ORDERS_KEY, JSON.stringify([...ids].slice(-50)));
}

async function ensureAndroidChannel(notifications: ExpoNotifications): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifications.setNotificationChannelAsync(READY_CHANNEL, {
    name: 'Estado de pedidos',
    description: 'Avisos cuando tu pedido está listo para recoger.',
    importance: notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#432417',
    sound: 'default',
  });
}

export async function initializeCustomerNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const notifications = await getNativeNotifications();
    if (!notifications) return;
    configureNotificationHandler(notifications);
    await ensureAndroidChannel(notifications);
  } catch {
    // El seguimiento del pedido continúa aunque el sistema no permita configurar avisos.
  }
}

export async function requestCustomerNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  }

  try {
    const notifications = await getNativeNotifications();
    if (!notifications) return false;
    configureNotificationHandler(notifications);
    await ensureAndroidChannel(notifications);
    const current = await notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

async function notifyOnWeb(order: Order): Promise<boolean> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const notification = new Notification('¡Tu pedido está listo!', {
      body: `Tu pedido ${order.number} ya está listo. Puedes pasar por él a la cafetería.`,
      tag: `mascafe-order-ready-${order.id}`,
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign(`/orders/${order.id}`);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

async function notifyOnNative(order: Order): Promise<boolean> {
  try {
    const notifications = await getNativeNotifications();
    if (!notifications) return false;
    configureNotificationHandler(notifications);
    const permission = await notifications.getPermissionsAsync();
    if (!permission.granted) return false;
    await ensureAndroidChannel(notifications);
    await notifications.scheduleNotificationAsync({
      content: {
        title: '¡Tu pedido está listo!',
        body: `Tu pedido ${order.number} ya está listo. Puedes pasar por él a la cafetería.`,
        sound: 'default',
        data: { orderId: order.id, url: `/orders/${order.id}` },
      },
      trigger: Platform.OS === 'android'
        ? {
            type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            channelId: READY_CHANNEL,
          }
        : null,
    });
    return true;
  } catch {
    return false;
  }
}

export async function notifyOrderReady(order: Order): Promise<void> {
  if (getNotifiedOrderIds().has(order.id)) return;
  const notified = Platform.OS === 'web'
    ? await notifyOnWeb(order)
    : await notifyOnNative(order);
  if (notified) markOrderNotified(order.id);
}
