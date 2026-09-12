import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStorageItem } from '../src/lib/storageAccess.ts';

test('lectura segura en servidor, navegador y almacenamiento bloqueado', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    delete globalThis.localStorage;
    assert.equal(readStorageItem('mascafe-ordering-blocked-until'), null);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => key === 'token' ? 'cliente' : null } });
    assert.equal(readStorageItem('token'), 'cliente');
    assert.equal(readStorageItem('missing'), null);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError'); } });
    assert.equal(readStorageItem('token'), null);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => { throw new Error('Denied'); } } });
    assert.equal(readStorageItem('token'), null);
  } finally {
    delete globalThis.localStorage;
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
  }
});
