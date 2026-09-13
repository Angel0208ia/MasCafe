import test from 'node:test';
import assert from 'node:assert/strict';
import { getCartPricing, isPromotionActive, setPromotions } from '../src/constants/promotions.ts';
const date = new Date('2026-09-15T18:00:00Z');
const promo = (id, discount, requirements, day=2) => ({ id,title:id,discountPerBundle:discount,requirements,day });
const item = (productId,quantity) => ({ productId,quantity,unitPrice:50 });
test('solo aplica promociones del día y exige el combo completo', () => {
  const p = promo('combo',15,[{productId:'a',quantity:2}]);
  setPromotions([p]);
  assert.equal(isPromotionActive(p,date),true);
  assert.equal(getCartPricing([item('a',1)],date).discount,0);
  assert.equal(getCartPricing([item('a',2)],date).total,85);
  assert.equal(getCartPricing([item('a',2)],new Date('2026-09-16T18:00:00Z')).discount,0);
});
test('elige el mayor ahorro sin duplicar artículos entre promociones', () => {
  setPromotions([promo('a',10,[{productId:'a',quantity:1}]),promo('b',10,[{productId:'b',quantity:1}]),promo('ab',15,[{productId:'a',quantity:1},{productId:'b',quantity:1}])]);
  assert.equal(getCartPricing([item('a',1),item('b',1)],date).discount,20);
});
test('puede repetir combos y eliminar todas las promociones', () => {
  setPromotions([promo('a',5,[{productId:'a',quantity:1}])]);
  const pricing = getCartPricing([item('a',3)],date);
  assert.equal(pricing.discount,15);
  assert.equal(pricing.appliedPromotions.length,1);
  setPromotions([]);
  assert.equal(getCartPricing([item('a',3)],date).discount,0);
});
test('promociones del día respeta medianoche de Cancún, no UTC', () => {
  const list = [promo('martes',15,[{productId:'a',quantity:2}],2),promo('jueves',15,[{productId:'b',quantity:2}],4)];
  assert.deepEqual(list.filter(p => isPromotionActive(p,new Date('2026-09-16T04:59:59Z'))).map(p => p.id),['martes']);
  assert.deepEqual(list.filter(p => isPromotionActive(p,new Date('2026-09-16T05:00:00Z'))),[]);
  assert.deepEqual(list.filter(p => isPromotionActive(p,new Date('2026-09-17T18:00:00Z'))).map(p => p.id),['jueves']);
});
