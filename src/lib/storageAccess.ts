// Expo también evalúa el catálogo/estado al renderizar web en el servidor.
// No se crea almacenamiento global de respaldo: compartiría datos entre clientes.
export function readStorageItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    // Algunos navegadores bloquean almacenamiento en modo privado o por permisos.
    return null;
  }
}

export function writeStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // La aplicación sigue funcionando si el almacenamiento está bloqueado.
  }
}

export function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // La aplicación sigue funcionando si el almacenamiento está bloqueado.
  }
}
