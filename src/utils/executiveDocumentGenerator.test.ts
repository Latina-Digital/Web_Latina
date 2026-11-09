import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPaintCategoryProduct,
  generateMinimalistCatalogExecutiveHtml,
  generateInvoiceExecutiveHtml,
  generateTechnicalSheetExecutiveHtml,
} from './executiveDocumentGenerator';
import { INITIAL_INVENTORY } from '../data/seedData';
import { Invoice } from '../types/erp';

describe('Executive Document Generator & Minimalist Catalog PDF', () => {
  it('accurately detects paint category products vs other products', () => {
    const paintItem = INITIAL_INVENTORY.find((i) => i.sku === 'LAT-LVA-01');
    const nonPaintItem = INITIAL_INVENTORY.find((i) => i.sku === 'LAT-MOR-POR');
    assert.ok(paintItem, 'Paint item LAT-LVA-01 should exist');
    assert.ok(nonPaintItem, 'Non-paint item LAT-MOR-POR should exist');
    assert.equal(isPaintCategoryProduct(paintItem), true);
    assert.equal(isPaintCategoryProduct(nonPaintItem), false);
  });

  it('generates minimalist corporate catalog HTML with cover page, product pages with presentations, and extra real-environment color combination pages for paint products', () => {
    const sampleProducts = INITIAL_INVENTORY.slice(0, 8);
    const paintCount = sampleProducts.filter((p) => isPaintCategoryProduct(p)).length;
    const html = generateMinimalistCatalogExecutiveHtml(sampleProducts);

    // Verify cover page
    assert.ok(html.includes('PORTADA CORPORATIVA'), 'Should include corporate cover page');
    assert.ok(html.includes('INDUSTRIAL LATINA'), 'Should include company identity on cover');

    // Verify each product has its page and presentation images
    for (const item of sampleProducts) {
      assert.ok(html.includes(item.sku), `Catalog should include SKU ${item.sku}`);
      assert.ok(html.includes(item.name), `Catalog should include product name ${item.name}`);
    }

    // Verify extra page for paint color combinations in real environment
    const extraPagesMatches = html.match(/COMBINACIÓN DE COLORES EN AMBIENTE REAL/g) || [];
    assert.equal(
      extraPagesMatches.length,
      paintCount,
      `Expected ${paintCount} extra real-environment paint pages, got ${extraPagesMatches.length}`
    );
  });

  it('includes 48 to 72 hours delivery commitment in executive invoices and Google Drive links in technical sheets', () => {
    const sampleInvoice: Invoice = {
      id: 'fac_test_1',
      invoiceNumber: 'SRI-001-002-000999',
      orderCode: 'PED-EC-2026-999',
      clientName: 'Constructora Andina S.A.',
      clientNit: '0991234567001',
      subtotal: 100,
      taxAmount: 15,
      total: 115,
      status: 'pagada',
      digitalSignature: 'SRI-SIG-999',
      ownerId: 'admin_il_01',
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
    };

    const invoiceHtml = generateInvoiceExecutiveHtml(sampleInvoice);
    assert.ok(
      invoiceHtml.includes('48 a 72 horas'),
      'Invoice HTML must explicitly specify that delivery takes 48 to 72 hours'
    );

    const itemWithDrive = INITIAL_INVENTORY[0];
    const techHtml = generateTechnicalSheetExecutiveHtml(itemWithDrive);
    assert.ok(
      techHtml.includes('drive.google.com'),
      'Technical sheet HTML must include the connected Google Drive link'
    );
  });

  it('verifies if entered Cédula or RUC belongs to a new customer against existing orders before applying coupon discounts in handleCustomerCheckout', async () => {
    const {
      DEFAULT_COUPONS,
      evaluateCheckoutCouponForOrder,
      isNewCustomerByNit,
      validateCouponForClient,
    } = await import('./ecuadorCommerce');
    const { INITIAL_ORDERS } = await import('../data/seedData');

    // Existing customer RUC in Firestore/INITIAL_ORDERS: 0992847102001
    const existingNit = '0992847102001';
    assert.equal(
      isNewCustomerByNit(existingNit, INITIAL_ORDERS),
      false,
      'Existing RUC 0992847102001 must not be treated as a new customer'
    );

    const existingValidation = validateCouponForClient(
      'LATINA26',
      existingNit,
      DEFAULT_COUPONS,
      INITIAL_ORDERS
    );
    assert.equal(existingValidation.valid, false);
    assert.equal(existingValidation.isNewCustomer, false);

    const rejectedEval = evaluateCheckoutCouponForOrder({
      couponCodeApplied: 'LATINA26',
      couponDiscountUsd: 10,
      clientNit: existingNit,
      cartSubtotal: 100,
      availableCoupons: DEFAULT_COUPONS,
      existingOrders: INITIAL_ORDERS,
    });
    assert.equal(rejectedEval.applied, false);
    assert.equal(rejectedEval.finalDiscountUsd, 0);
    assert.equal(rejectedEval.couponCodeApplied, undefined);

    // Brand new customer RUC not in Firestore orders: 1726354819001
    const newNit = '1726354819001';
    assert.equal(
      isNewCustomerByNit(newNit, INITIAL_ORDERS),
      true,
      'Unregistered RUC 1726354819001 must be recognized as a new customer'
    );

    const approvedEval = evaluateCheckoutCouponForOrder({
      couponCodeApplied: 'LATINA26',
      couponDiscountUsd: 10,
      clientNit: newNit,
      cartSubtotal: 100,
      availableCoupons: DEFAULT_COUPONS,
      existingOrders: INITIAL_ORDERS,
    });
    assert.equal(approvedEval.applied, true);
    assert.equal(approvedEval.isNewCustomer, true);
    assert.equal(approvedEval.finalDiscountUsd, 10);
    assert.equal(approvedEval.couponCodeApplied, 'LATINA26');
  });
});

