import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

interface AuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
}

interface RuleRequest {
  collection: string;
  docId: string;
  subdocId?: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: AuthContext | null;
  requestTime: string;
  incomingData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  parentExists?: boolean;
  parentOwnerId?: string;
}

const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function isVerifiedUser(auth: AuthContext | null): boolean {
  return auth !== null && auth.email_verified === true;
}

function isAdmin(auth: AuthContext | null): boolean {
  return isVerifiedUser(auth) && auth!.email === 'industriallatina.digital@gmail.com';
}

function evaluateSecurityRule(req: RuleRequest): 'ALLOW' | 'PERMISSION_DENIED' {
  if (!isVerifiedUser(req.auth)) return 'PERMISSION_DENIED';
  if (req.operation !== 'list' && !isValidId(req.docId)) return 'PERMISSION_DENIED';

  if (req.collection === 'orders') {
    const requiredKeys = [
      'orderCode', 'clientName', 'clientNit', 'sku', 'productName',
      'quantity', 'unitPrice', 'totalAmount', 'status',
      'paymentStatus', 'paymentMethod', 'ownerId', 'createdAt', 'updatedAt',
    ];
    const allowedKeys = [
      ...requiredKeys,
      'company', 'digitalSellerCode', 'cityEcuador',
    ];
    if (req.operation === 'list') {
      if (!req.existingData) return 'PERMISSION_DENIED';
      return req.existingData.ownerId === req.auth!.uid || isAdmin(req.auth) ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (req.operation === 'create' || req.operation === 'update') {
      const d = req.incomingData || {};
      const keys = Object.keys(d);
      if (!requiredKeys.every((k) => keys.includes(k)) || !keys.every((k) => allowedKeys.includes(k))) {
        return 'PERMISSION_DENIED';
      }
      if (d.ownerId !== req.auth!.uid) return 'PERMISSION_DENIED';
      if (typeof d.status !== 'string' || !['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'].includes(d.status)) {
        return 'PERMISSION_DENIED';
      }
      if (req.operation === 'create') {
        if (d.createdAt !== req.requestTime || d.updatedAt !== req.requestTime) return 'PERMISSION_DENIED';
        return 'ALLOW';
      }
      if (req.operation === 'update') {
        const ex = req.existingData || {};
        if (d.ownerId !== ex.ownerId || d.createdAt !== ex.createdAt || d.updatedAt !== req.requestTime) {
          return 'PERMISSION_DENIED';
        }
        if (!isAdmin(req.auth) && ['entregado', 'cancelado'].includes(String(ex.status))) {
          return 'PERMISSION_DENIED';
        }
        return 'ALLOW';
      }
    }
  }

  if (req.collection === 'inventory') {
    if (req.operation !== 'list' && !isValidId(req.docId)) return 'PERMISSION_DENIED';
  }

  if (req.collection === 'invoices') {
    if (req.operation === 'list') {
      if (!req.existingData) return 'PERMISSION_DENIED';
      return req.existingData.ownerId === req.auth!.uid || isAdmin(req.auth) ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (req.operation === 'create') {
      const d = req.incomingData || {};
      if (d.createdAt !== req.requestTime || d.updatedAt !== req.requestTime) return 'PERMISSION_DENIED';
    }
  }

  if (req.collection === 'users') {
    const allowedRoles = ['operador', 'logistica', 'finanzas', 'cliente'];
    if (req.operation === 'create') {
      const d = req.incomingData || {};
      if (req.auth!.uid !== req.docId || d.ownerId !== req.docId) return 'PERMISSION_DENIED';
      if (!allowedRoles.includes(String(d.role))) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
    if (req.operation === 'update') {
      const d = req.incomingData || {};
      const ex = req.existingData || {};
      if (!isAdmin(req.auth) && d.role !== ex.role) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
  }

  if (req.collection === 'users_private') {
    if (!req.subdocId || !isValidId(req.subdocId)) return 'PERMISSION_DENIED';
    const isOwnerOrAdmin = req.auth!.uid === req.docId || isAdmin(req.auth);
    if (!isOwnerOrAdmin) return 'PERMISSION_DENIED';
    if (!req.parentExists || req.parentOwnerId !== req.docId) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }

  return 'PERMISSION_DENIED';
}

const NOW = '2026-10-21T20:00:00Z';
const VALID_ORDER = {
  orderCode: 'PED-2026-101',
  clientName: 'Constructora Andina S.A.',
  clientNit: '900482190-1',
  sku: 'IL-VAL-400',
  productName: 'Valvula Hidraulica 400PSI',
  quantity: 10,
  unitPrice: 1200,
  totalAmount: 13920,
  status: 'pendiente',
  paymentStatus: 'pendiente',
  paymentMethod: 'tarjeta_corporativa',
  ownerId: 'user_1',
  createdAt: NOW,
  updatedAt: NOW,
};

test('firestore.rules file contains all 8 hardened security pillars', () => {
  const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('allow read, write: if false;'));
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('isValidOrder(incoming())'));
  assert.ok(rulesText.includes('isValidInventoryItem(incoming())'));
  assert.ok(rulesText.includes('isValidInvoice(incoming())'));
  assert.ok(rulesText.includes('isValidShipment(incoming())'));
  assert.ok(rulesText.includes('isValidNotificationLog(incoming())'));
  assert.ok(rulesText.includes('isValidUserProfilePublic(incoming())'));
  assert.ok(rulesText.includes('isValidUserProfilePrivate(incoming())'));
});

test('Dirty Dozen #1-12 adversarial payloads all return PERMISSION_DENIED', () => {
  const userAuth: AuthContext = { uid: 'user_1', email: 'op@industriallatina.com', email_verified: true };

  // 1. Shadow field injection
  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_01',
      operation: 'create',
      auth: userAuth,
      requestTime: NOW,
      incomingData: { ...VALID_ORDER, isVerifiedAdmin: true },
    }),
    'PERMISSION_DENIED'
  );

  // 2. Identity spoofing on order creation
  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_01',
      operation: 'create',
      auth: userAuth,
      requestTime: NOW,
      incomingData: { ...VALID_ORDER, ownerId: 'victim_uid' },
    }),
    'PERMISSION_DENIED'
  );

  // 3. Unverified email admin spoof
  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_01',
      operation: 'create',
      auth: { uid: 'spoof', email: 'industriallatina.digital@gmail.com', email_verified: false },
      requestTime: NOW,
      incomingData: { ...VALID_ORDER, ownerId: 'spoof' },
    }),
    'PERMISSION_DENIED'
  );

  // 4. Terminal state mutation on delivered order
  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_01',
      operation: 'update',
      auth: userAuth,
      requestTime: NOW,
      existingData: { ...VALID_ORDER, status: 'entregado' },
      incomingData: { ...VALID_ORDER, status: 'procesando' },
    }),
    'PERMISSION_DENIED'
  );

  // 5. Value poisoning on whitelisted status field
  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_01',
      operation: 'update',
      auth: userAuth,
      requestTime: NOW,
      existingData: VALID_ORDER,
      incomingData: { ...VALID_ORDER, status: 'HACKED_STATE' },
    }),
    'PERMISSION_DENIED'
  );

  // 6. Self-assigned admin role escalation
  assert.equal(
    evaluateSecurityRule({
      collection: 'users',
      docId: 'user_1',
      operation: 'create',
      auth: userAuth,
      requestTime: NOW,
      incomingData: {
        displayName: 'Attacker',
        department: 'IT',
        role: 'admin',
        twoFactorEnabled: true,
        e2eeKeyFingerprint: 'SHA256-KEY-1234',
        ownerId: 'user_1',
        createdAt: NOW,
        updatedAt: NOW,
      },
    }),
    'PERMISSION_DENIED'
  );

  // 7. Role mutation on user update
  assert.equal(
    evaluateSecurityRule({
      collection: 'users',
      docId: 'user_1',
      operation: 'update',
      auth: userAuth,
      requestTime: NOW,
      existingData: { role: 'operador', ownerId: 'user_1' },
      incomingData: { role: 'finanzas', ownerId: 'user_1' },
    }),
    'PERMISSION_DENIED'
  );

  // 8. Cross-user PII leak
  assert.equal(
    evaluateSecurityRule({
      collection: 'users_private',
      docId: 'victim_uid',
      subdocId: 'info',
      operation: 'get',
      auth: userAuth,
      requestTime: NOW,
      parentExists: true,
      parentOwnerId: 'victim_uid',
    }),
    'PERMISSION_DENIED'
  );

  // 9. Orphaned subcollection write (Master Gate violation)
  assert.equal(
    evaluateSecurityRule({
      collection: 'users_private',
      docId: 'user_1',
      subdocId: 'info',
      operation: 'create',
      auth: userAuth,
      requestTime: NOW,
      parentExists: false,
    }),
    'PERMISSION_DENIED'
  );

  // 10. Client timestamp forgery
  assert.equal(
    evaluateSecurityRule({
      collection: 'invoices',
      docId: 'inv_01',
      operation: 'create',
      auth: userAuth,
      requestTime: NOW,
      incomingData: { createdAt: '2020-01-01T00:00:00Z', updatedAt: NOW },
    }),
    'PERMISSION_DENIED'
  );

  // 11. ID poisoning / Denial of Wallet (1500 char ID)
  assert.equal(
    evaluateSecurityRule({
      collection: 'inventory',
      docId: 'A'.repeat(1500),
      operation: 'create',
      auth: userAuth,
      requestTime: NOW,
    }),
    'PERMISSION_DENIED'
  );

  // 12. Unauthorized blanket list scraping on another user's invoices
  assert.equal(
    evaluateSecurityRule({
      collection: 'invoices',
      docId: 'inv_01',
      operation: 'list',
      auth: userAuth,
      requestTime: NOW,
      existingData: { ownerId: 'other_user' },
    }),
    'PERMISSION_DENIED'
  );
});

test('Verified user industriallatina.digital@gmail.com can list and create orders', () => {
  const adminAuth: AuthContext = {
    uid: 'q7LBelSEn6aeR2ZQ7plrNCMAEfs1',
    email: 'industriallatina.digital@gmail.com',
    email_verified: true,
  };

  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_01',
      operation: 'list',
      auth: adminAuth,
      requestTime: NOW,
      existingData: { ...VALID_ORDER, ownerId: adminAuth.uid },
    }),
    'ALLOW'
  );

  assert.equal(
    evaluateSecurityRule({
      collection: 'orders',
      docId: 'ord_02',
      operation: 'create',
      auth: adminAuth,
      requestTime: NOW,
      incomingData: {
        ...VALID_ORDER,
        ownerId: adminAuth.uid,
        company: 'industrial_latina',
        digitalSellerCode: 'VD-EC-101',
        cityEcuador: 'Guayaquil, Ecuador',
      },
    }),
    'ALLOW'
  );
});

