function words(value: string): string[] {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX').match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Distancia de edición con intercambio de dos letras vecinas (agau → agua). */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
  }
  return rows[a.length][b.length];
}

export function filterMenuByName<T extends { name: string }>(products: T[], query: string): T[] {
  const terms = words(query);
  if (!terms.length) return products;
  const indexed = products.map(product => ({ product, tokens: words(product.name) }));
  const find = (match: (term: string, word: string) => boolean) => indexed.filter(item => terms.every(term => item.tokens.some(word => match(term, word)))).map(item => item.product);
  // Una palabra completa nunca se mezcla con sugerencias aproximadas.
  const exact = find((term, word) => term === word);
  if (exact.length) return exact;
  const prefixes = find((term, word) => word.startsWith(term));
  if (prefixes.length) return prefixes;
  return find((term, word) => {
    if (term === word) return true;
    if (term.length < 3 || /\d/.test(term)) return false;
    const tolerance = term.length >= 7 ? 2 : 1;
    return Math.abs(term.length - word.length) <= tolerance && distance(term, word) <= tolerance;
  });
}
