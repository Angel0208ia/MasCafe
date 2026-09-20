import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from '../src/lib/storageAccess.ts';

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

test('escritura y eliminación seguras en almacenamiento local', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const items = new Map();

  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => items.set(key, value),
        removeItem: (key) => items.delete(key),
      },
    });

    writeStorageItem('mascafe-cart', '[{"id":"cafe"}]');
    assert.equal(readStorageItem('mascafe-cart'), '[{"id":"cafe"}]');
    removeStorageItem('mascafe-cart');
    assert.equal(readStorageItem('mascafe-cart'), null);

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        setItem: () => { throw new Error('QuotaExceededError'); },
        removeItem: () => { throw new Error('Denied'); },
      },
    });
    assert.doesNotThrow(() => writeStorageItem('mascafe-cart', '[]'));
    assert.doesNotThrow(() => removeStorageItem('mascafe-cart'));
  } finally {
    delete globalThis.localStorage;
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
  }
});
