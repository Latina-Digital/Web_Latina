import { CartItem } from './erpLogic';

export interface CleanCheckoutFormState {
  clientName: string;
  clientNit: string;
  clientEmail: string;
  clientWhatsapp: string;
  cityEcuador: string;
  destinationAddress: string;
  digitalSellerCode: string;
  deliveryReference: string;
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  couponInput: string;
  trackingSearch: string;
  alertContact: string;
}

export const PURCHASE_STORAGE_KEYS = [
  'il_cart',
  'il_shopping_cart',
  'cart',
  'shopping_cart',
  'il_checkout_form',
  'il_checkout_data',
  'il_customer_info',
  'il_payment_form',
  'il_billing_info',
  'il_shipping_info',
  'il_active_order_draft',
  'il_coupon_applied',
  'il_last_receipt',
] as const;

const RESIDUAL_PURCHASE_KEY_PATTERN =
  /(cart|carrito|checkout|compra|pedido_draft|order_draft|billing_form|shipping_form|payment_form|customer_data|datos_cliente)/i;

/**
 * Returns a fresh empty shopping cart array ([]).
 * Never loads mock products or residual storage items.
 */
export function createInitialEmptyCart(): CartItem[] {
  return [];
}

/**
 * Returns a fresh checkout, billing, shipping, and payment form state
 * with every field initialized to an empty string ("").
 */
export function createInitialCheckoutFormState(): CleanCheckoutFormState {
  return {
    clientName: '',
    clientNit: '',
    clientEmail: '',
    clientWhatsapp: '',
    cityEcuador: '',
    destinationAddress: '',
    digitalSellerCode: '',
    deliveryReference: '',
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    couponInput: '',
    trackingSearch: '',
    alertContact: '',
  };
}

export interface StorageLike {
  length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  clear?(): void;
}

/**
 * Cleans all shopping cart, checkout, payment, billing, and shipping residual data
 * from localStorage and sessionStorage (or provided storage objects for testing).
 * Called on initial app load, on order completion, and on order/cart cancellation.
 */
export function clearPurchaseAndCartStorage(
  localStore?: StorageLike | null,
  sessionStore?: StorageLike | null
): { removedLocalKeys: string[]; removedSessionKeys: string[] } {
  const targetLocal =
    localStore !== undefined
      ? localStore
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;

  const targetSession =
    sessionStore !== undefined
      ? sessionStore
      : typeof window !== 'undefined' && window.sessionStorage
        ? window.sessionStorage
        : null;

  const removedLocalKeys: string[] = [];
  const removedSessionKeys: string[] = [];

  if (targetLocal) {
    try {
      const keysToRemove = new Set<string>(PURCHASE_STORAGE_KEYS);
      for (let i = 0; i < targetLocal.length; i++) {
        const k = targetLocal.key(i);
        if (k && RESIDUAL_PURCHASE_KEY_PATTERN.test(k)) {
          keysToRemove.add(k);
        }
      }
      keysToRemove.forEach((k) => {
        if (targetLocal.getItem(k) !== null) {
          removedLocalKeys.push(k);
        }
        targetLocal.removeItem(k);
      });
    } catch {
      // ignore storage access errors in restricted contexts
    }
  }

  if (targetSession) {
    try {
      const keysToRemove = new Set<string>(PURCHASE_STORAGE_KEYS);
      for (let i = 0; i < targetSession.length; i++) {
        const k = targetSession.key(i);
        if (k) {
          keysToRemove.add(k);
        }
      }
      keysToRemove.forEach((k) => {
        if (targetSession.getItem(k) !== null) {
          removedSessionKeys.push(k);
        }
        targetSession.removeItem(k);
      });
    } catch {
      // ignore storage access errors in restricted contexts
    }
  }

  return { removedLocalKeys, removedSessionKeys };
}
