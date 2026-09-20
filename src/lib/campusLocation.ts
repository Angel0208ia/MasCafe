import * as Location from 'expo-location';
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

export async function verifyCampusLocation(): Promise<CampusLocationResult> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        reason: 'services-disabled',
        message: 'Activa la ubicación de tu dispositivo para confirmar que estás dentro del campus.',
      };
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return {
        success: false,
        reason: 'permission-denied',
        message: 'Necesitamos permiso de ubicación mientras usas la app para permitir pedidos dentro del campus.',
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

    const accuracy = position.coords.accuracy;
    if (accuracy === null || accuracy > MAX_LOCATION_ACCURACY_METERS) {
      return {
        success: false,
        reason: 'low-accuracy',
        message: 'La ubicación no tiene suficiente precisión. Acércate a una ventana o activa la ubicación precisa e inténtalo nuevamente.',
      };
    }

    const location: OrderLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy,
    };

    if (!isInsideTecmilenioCancun(location)) {
      return {
        success: false,
        reason: 'outside-campus',
        message: `Debes encontrarte dentro de ${CAMPUS_NAME} para realizar pedidos.`,
      };
    }

    return { success: true, location };
  } catch {
    return {
      success: false,
      reason: 'unavailable',
      message: 'No pudimos obtener tu ubicación. Comprueba la señal de ubicación e inténtalo nuevamente.',
    };
  }
}
