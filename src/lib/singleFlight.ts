/** Comparte una consulta en curso; nunca cachea un error ni un resultado antiguo. */
export function singleFlight<T>(request: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    if (!pending) pending = Promise.resolve().then(request).finally(() => { pending = undefined; });
    return pending;
  };
}
