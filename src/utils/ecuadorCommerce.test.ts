import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDeferredOptions,
  ECUADOR_BANKS_CATALOG,
  INITIAL_DISCOUNT_COUPONS,
  validateCouponForClient,
} from './ecuadorCommerce';
import { getActiveFestiveTheme } from './ecuadorThemes';
import { Order } from '../types/erp';

test('ECUADOR_BANKS_CATALOG contains all specified Ecuadorian banking entities', () => {
  const bankIds = ECUADOR_BANKS_CATALOG.map((b) => b.id);
  assert.ok(bankIds.includes('banco_pichincha'));
  assert.ok(bankIds.includes('banco_guayaquil'));
  assert.ok(bankIds.includes('produbanco'));
  assert.ok(bankIds.includes('banco_pacifico'));
  assert.ok(bankIds.includes('banco_bolivariano'));
  assert.ok(bankIds.includes('banco_internacional'));
  assert.ok(bankIds.includes('banco_del_austro'));
  assert.ok(bankIds.includes('cooperativa_jep'));
  assert.ok(bankIds.includes('cooperativa_29_octubre'));
  assert.ok(bankIds.includes('cooperativa_alianza_valle'));
  assert.ok(bankIds.includes('mutualista_pichincha'));
  assert.ok(bankIds.includes('payphone_ecuador'));
  assert.ok(bankIds.includes('datafast_kushki'));
});

test('computeDeferredOptions generates zero-interest plans and interest plans correctly', () => {
  const total = 1000;
  const options = computeDeferredOptions(total);
  const corriente = options.find((o) => o.months === 1);
  assert.ok(corriente);
  assert.equal(corriente.hasInterest, false);
  assert.equal(corriente.monthlyAmount, 1000);

  const tresMeses = options.find((o) => o.months === 3);
  assert.ok(tresMeses);
  assert.equal(tresMeses.hasInterest, false);
  assert.equal(tresMeses.totalWithInterest, 1000);
  assert.equal(tresMeses.monthlyAmount, 333.33);

  const nueveMeses = options.find((o) => o.months === 9);
  assert.ok(nueveMeses);
  assert.equal(nueveMeses.hasInterest, true);
  assert.ok(nueveMeses.totalWithInterest > 1000);
});

test('validateCouponForClient rejects existing client by Cédula/RUC when onlyNewClients is true', () => {
  const existingOrders: Order[] = [
    {
      id: 'ord_1',
      orderCode: 'PED-101',
      clientName: 'Constructora Guayas',
      clientNit: '0992847102001',
      sku: 'LAT-LVA-01',
      productName: 'Duralín',
      quantity: 5,
      unitPrice: 24.99,
      totalAmount: 124.95,
      status: 'entregado',
      paymentStatus: 'pagado',
      paymentMethod: 'tarjeta_corporativa',
      ownerId: 'admin_1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  // Try to use LATINA26 with existing client NIT
  const resultExisting = validateCouponForClient(
    'LATINA26',
    '0992847102001',
    INITIAL_DISCOUNT_COUPONS,
    existingOrders
  );
  assert.equal(resultExisting.valid, false);
  assert.ok(resultExisting.message.includes('exclusivo para CLIENTES NUEVOS'));

  // Try to use LATINA26 with completely NEW client NIT
  const resultNew = validateCouponForClient(
    'LATINA26',
    '1718293849', // Persona natural de Quito no registrada
    INITIAL_DISCOUNT_COUPONS,
    existingOrders
  );
  assert.equal(resultNew.valid, true);
  assert.equal(resultNew.discountPct, 10);
});

test('getActiveFestiveTheme returns theme configurations with banners and festive badges', () => {
  const guayaquilTheme = getActiveFestiveTheme('guayaquil');
  assert.equal(guayaquilTheme.name, 'Fiestas de Guayaquil (Julio & Octubre)');
  assert.ok(guayaquilTheme.primaryColor === '#009FE3');

  const quitoTheme = getActiveFestiveTheme('quito');
  assert.ok(quitoTheme.festiveSalute.includes('Quiteño') || quitoTheme.festiveSalute.includes('Quito'));

  const fallback = getActiveFestiveTheme('corporativo');
  assert.equal(fallback.id, 'corporativo');
});
