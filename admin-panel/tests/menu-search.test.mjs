import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMenuByName } from '../src/lib/menu-search.ts';

const products = [
  { name: 'Americano', description: 'Espresso con agua caliente' },
  { name: 'Agua 500 ml' }, { name: 'Agua Fresca' },
  { name: 'Frappé de Fresa con Agua' }, { name: 'Aguacate' },
  { name: 'Cappuccino' },
];
const names = query => filterMenuByName(products, query).map(p => p.name);
test('palabra completa solo busca palabras del nombre, no descripciones ni prefijos', () => {
  assert.deepEqual(names('AGUA'), ['Agua 500 ml', 'Agua Fresca', 'Frappé de Fresa con Agua']);
});
test('tolera letras cambiadas, omitidas e intercambiadas', () => {
  for (const query of ['agau', 'agya', 'aua']) assert.deepEqual(names(query), names('agua'), query);
});
test('ignora acentos y requiere todas las palabras', () => {
  assert.deepEqual(names('agua frescá'), ['Agua Fresca']);
  assert.deepEqual(names('agua 500'), ['Agua 500 ml']);
});
test('permite buscar mientras se escribe y no inventa coincidencias lejanas', () => {
  assert.deepEqual(names('capp'), ['Cappuccino']);
  assert.deepEqual(names('pizza'), []);
  assert.deepEqual(names('agua 501'), []);
});
test('búsqueda vacía conserva todo el catálogo', () => assert.deepEqual(names('  '), products.map(p => p.name)));
