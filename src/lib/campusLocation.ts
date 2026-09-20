import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { OrderLocation } from '../types/product';

export const CAMPUS_NAME = 'Tecmilenio Campus Cancún';
export const MAX_LOCATION_ACCURACY_METERS = 100;

type Coordinate = {
  latitude: number;
  longitude: number;
};

// Perímetro de Universidad Tecmilenio, Av. Bonampak 371.
// Fuente: OpenStreetMap way 1282955398, consultado el 20/09/2026.
export const TECMILENIO_CANCUN_BOUNDARY: readonly Coordinate[] = [
  { latitude: 21.1317622, longitude: -86.8272884 },
  { latitude: 21.1313783, longitude: -86.8266301 },
  { latitude: 21.1309755, longitude: -86.8259394 },
  { latitude: 21.1325966, longitude: -86.8251115 },
  { latitude: 21.1328423, longitude: -86.8256702 },
  { latitude: 21.1331620, longitude: -86.8263781 },
  { latitude: 21.1332158, longitude: -86.8265071 },
  { latitude: 21.1331615, longitude: -86.8265349 },
  { latitude: 21.1330111, longitude: -86.8266155 },
  { latitude: 21.1327260, longitude: -86.8267682 },
  { latitude: 21.1327003, longitude: -86.8267819 },
  { latitude: 21.1326576, longitude: -86.8268050 },
] as const;

export type CampusLocationFailureReason =
  | 'permission-denied'
  | 'services-disabled'
  | 'unavailable'
  | 'low-accuracy'
  | 'outside-campus'
  | 'mocked';

export type CampusLocationResult =
  | { success: true; location: OrderLocation }
  | { success: false; reason: CampusLocationFailureReason; message: string };

function isPointOnSegment(point: Coordinate, first: Coordinate, second: Coordinate): boolean {
  const cross = (point.longitude - first.longitude) * (second.latitude - first.latitude)
    - (point.latitude - first.latitude) * (second.longitude - first.longitude);
  if (Math.abs(cross) > 1e-10) return false;

  const dot = (point.longitude - first.longitude) * (second.longitude - first.longitude)
    + (point.latitude - first.latitude) * (second.latitude - first.latitude);
  if (dot < 0) return false;

  const squaredLength = (second.longitude - first.longitude) ** 2
    + (second.latitude - first.latitude) ** 2;
  return dot <= squaredLength;
}

export function isInsideTecmilenioCancun(point: Coordinate): boolean {
  let inside = false;

  for (
    let currentIndex = 0, previousIndex = TECMILENIO_CANCUN_BOUNDARY.length - 1;
    currentIndex < TECMILENIO_CANCUN_BOUNDARY.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = TECMILENIO_CANCUN_BOUNDARY[currentIndex];
    const previous = TECMILENIO_CANCUN_BOUNDARY[previousIndex];

    if (isPointOnSegment(point, previous, current)) return true;

    const crossesLatitude = current.latitude > point.latitude !== previous.latitude > point.latitude;
    const longitudeAtCrossing = (previous.longitude - current.longitude)
      * (point.latitude - current.latitude)
      / (previous.latitude - current.latitude)
      + current.longitude;

    if (crossesLatitude && point.longitude < longitudeAtCrossing) inside = !inside;
  }

  return inside;
}

async function getCurrentPositionWithTimeout(): Promise<Location.LocationObject> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('location-timeout')), 20_000);
  });

  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      timeout,
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getPermissionDeniedMessage(): string {
  if (Platform.OS === 'web') {
    return 'No podemos confirmar que estás dentro del campus porque el navegador no tiene acceso a tu ubicación. Haz clic en el icono de permisos o candado junto a la dirección, permite la ubicación para este sitio y vuelve a intentarlo.';
  }

  if (Platform.OS === 'ios') {
    return 'No podemos confirmar que estás dentro del campus porque Más Café no tiene permiso de ubicación. Abre Configuración > Privacidad y seguridad > Localización > Más Café (o Expo Go), elige “Al usar la app” y activa “Ubicación precisa”.';
  }

  return 'No podemos confirmar que estás dentro del campus porque Más Café no tiene permiso de ubicación. Abre Ajustes > Aplicaciones > Más Café (o Expo Go) > Permisos > Ubicación y elige “Mientras se usa la app”.';
}

function getServicesDisabledMessage(): string {
  if (Platform.OS === 'web') {
    return 'La ubicación está desactivada en el navegador o en tu dispositivo. Actívala, permite la ubicación para este sitio desde el icono junto a la dirección y vuelve a intentarlo.';
  }

  return 'La ubicación de tu dispositivo está desactivada. Actívala desde los ajustes rápidos o Configuración para confirmar que estás dentro del campus.';
}

export async function verifyCampusLocation(): Promise<CampusLocationResult> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        reason: 'services-disabled',
        message: getServicesDisabledMessage(),
      };
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return {
        success: false,
        reason: 'permission-denied',
        message: getPermissionDeniedMessage(),
      };
    }

    const position = await getCurrentPositionWithTimeout();
    if (position.mocked) {
      return {
        success: false,
        reason: 'mocked',
        message: 'No pudimos validar esta ubicación. Desactiva las ubicaciones simuladas e inténtalo nuevamente.',
      };
    }

    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    if (!isInsideTecmilenioCancun(coordinates)) {
      return {
        success: false,
        reason: 'outside-campus',
        message: `Tu ubicación actual está fuera de ${CAMPUS_NAME}. Solo puedes generar pedidos cuando te encuentres dentro del plantel.`,
      };
    }

    const accuracy = position.coords.accuracy;
    if (accuracy === null || accuracy > MAX_LOCATION_ACCURACY_METERS) {
      return {
        success: false,
        reason: 'low-accuracy',
        message: 'Parece que estás cerca o dentro del campus, pero la ubicación no tiene suficiente precisión para autorizar el pedido. Activa la ubicación precisa y vuelve a intentarlo.',
      };
    }

    const location: OrderLocation = { ...coordinates, accuracy };

    return { success: true, location };
  } catch {
    return {
      success: false,
      reason: 'unavailable',
      message: 'No pudimos obtener tu ubicación. Comprueba la señal de ubicación e inténtalo nuevamente.',
    };
  }
}
