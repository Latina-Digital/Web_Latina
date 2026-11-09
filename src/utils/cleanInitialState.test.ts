import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearPurchaseAndCartStorage,
  createInitialCheckoutFormState,
  createInitialEmptyCart,
  StorageLike,
} from './cleanInitialState';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe('Clean Initial State & Storage Hygiene', () => {
  test('1. Carrito vacío por defecto: createInitialEmptyCart returns an empty array ([]) with zero mock items', () => {
    const cart = createInitialEmptyCart();
    assert.ok(Array.isArray(cart));
    assert.equal(cart.length, 0);
    assert.deepEqual(cart, []);
  });

  test('2. Sin información previa de compra: createInitialCheckoutFormState initializes all customer, billing, shipping, and payment fields to empty string ("")', () => {
    const form = createInitialCheckoutFormState();
    for (const [field, value] of Object.entries(form)) {
      assert.equal(
        value,
        '',
        `Expected field "${field}" to initialize as "" but got "${String(value)}"`
      );
    }
  });

  test('3. Limpieza de memoria del navegador: clearPurchaseAndCartStorage removes residual cart and purchase keys from localStorage and sessionStorage while preserving catalog/theme config', () => {
    const mockLocal = createMemoryStorage({
      il_cart: '[{"sku":"LAT-LVA-01","quantity":2}]',
      il_checkout_form: '{"clientName":"Demo"}',
      datos_cliente_previos: '123',
      il_active_theme_id: 'halloween',
    });
    const mockSession = createMemoryStorage({
      shopping_cart: '[{"sku":"LAT-SAT-01"}]',
      session_checkout_draft: 'true',
    });

    const result = clearPurchaseAndCartStorage(mockLocal, mockSession);

    assert.equal(mockLocal.getItem('il_cart'), null);
    assert.equal(mockLocal.getItem('il_checkout_form'), null);
    assert.equal(mockLocal.getItem('datos_cliente_previos'), null);
    assert.equal(mockLocal.getItem('il_active_theme_id'), 'halloween');
    assert.equal(mockSession.length, 0);
    assert.ok(result.removedLocalKeys.includes('il_cart'));
    assert.ok(result.removedSessionKeys.includes('shopping_cart'));
  });
});
