import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductImage } from '../src/constants/productImages.ts';
test('sin foto no recupera imágenes anteriores según el identificador',()=>{
  assert.equal(getProductImage('1',''),'');
  assert.equal(getProductImage('17','  '),'');
});
test('las nuevas imágenes del administrador se conservan',()=>{
  const url='https://example.supabase.co/storage/v1/object/public/menu-images/foto.webp';
  assert.equal(getProductImage('17',url),url);
});
