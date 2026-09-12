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
