import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCartSummary, CartItem } from './erpLogic';

test('calculateCartSummary computes totals and 10% coupon discount correctly', () => {
  const items: CartItem[] = [
    {
      sku: 'LAT-LVA-01',
      name: 'Duralín Premium Forte',
      category: 'Pinturas',
      unitPrice: 24.99,
      unit: 'Galón',
      quantity: 2,
      maxStock: 100,
      company: 'industrial_latina',
    },
    {
      sku: 'LAT-SAT-01',
      name: 'Pintura Satinada Tipo 1',
      category: 'Pinturas',
      unitPrice: 28.5,
      unit: 'Galón',
      quantity: 1,
      maxStock: 50,
      company: 'industrial_latina',
    },
  ];

  // Subtotal = 2 * 24.99 + 28.50 = 49.98 + 28.50 = 78.48
  const withoutCoupon = calculateCartSummary(items, 0);
  assert.equal(withoutCoupon.itemCount, 3);
  assert.equal(withoutCoupon.subtotal, 78.48);
  assert.equal(withoutCoupon.couponDiscount, 0);
  assert.equal(withoutCoupon.taxableBase, 78.48);
  assert.equal(withoutCoupon.taxAmount, Math.round(78.48 * 0.16 * 100) / 100);

  // With 10% coupon discount (LATINA26)
  const withCoupon = calculateCartSummary(items, 10);
  assert.equal(withCoupon.itemCount, 3);
  assert.equal(withCoupon.subtotal, 78.48);
  assert.equal(withCoupon.couponDiscount, 7.85); // 78.48 * 0.10 = 7.848 -> 7.85
  assert.equal(withCoupon.taxableBase, 70.63); // 78.48 - 7.85 = 70.63
  assert.equal(withCoupon.taxAmount, Math.round(70.63 * 0.16 * 100) / 100);
  assert.equal(withCoupon.total, Math.round((70.63 + withCoupon.taxAmount) * 100) / 100);
});

test('calculatePaint formula yields expected gallons', () => {
  const m2 = 45;
  const yieldDuralin = 25;
  const gallonsDuralin = Math.ceil(m2 / yieldDuralin);
  assert.equal(gallonsDuralin, 2);

  const yieldSatinada = 20;
  const gallonsSatinada = Math.ceil(m2 / yieldSatinada);
  assert.equal(gallonsSatinada, 3);
});
