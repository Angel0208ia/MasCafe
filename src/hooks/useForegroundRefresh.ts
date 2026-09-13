import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

/** Actualiza solo la pantalla enfocada y cuando la app/pestaña está visible. */
export function useForegroundRefresh(refresh: () => Promise<void>, intervalMs: number) {
  useFocusEffect(useCallback(() => {
    const tick = () => {
      if (AppState.currentState && AppState.currentState !== 'active') return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refresh();
    };
    tick();
    const timer = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') tick(); });
    const visible = () => tick();
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer); subscription.remove();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh, intervalMs]));
}
