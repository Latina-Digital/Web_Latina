import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvContent,
  buildExcelXmlContent,
  buildPdfDocumentStream,
  calculateCartSummary,
  calculateInvoiceAmounts,
  canTransitionOrderStatus,
  computeRealtimeSummaryInsights,
  decryptPayloadE2EE,
  encryptPayloadE2EE,
  estimateIndustrialImpact,
  findShipmentByQuery,
  generateDigitalSignature,
  getNextShipmentStatus,
  getPermissionsForRole,
  getShipmentProgressByStatus,
  isValidBlueprintId,
  validateNewOrderInput,
  verifyTwoFactorCode,
} from './erpLogic';
import { Shipment } from '../types/erp';

test('calculateCartSummary applies 5% corporate volume discount above USD 15,000 and 16% VAT', () => {
  const summary = calculateCartSummary([
    {
      sku: 'IL-MOT-75K',
      name: 'Motor Trifásico 75 kW',
      category: 'Tracción Eléctrica',
      unitPrice: 3400,
      unit: 'Und',
      quantity: 5,
      maxStock: 38,
    },
  ]);
  assert.equal(summary.subtotal, 17000);
  assert.equal(summary.volumeDiscount, 850);
  assert.equal(summary.taxableBase, 16150);
  assert.equal(summary.taxAmount, 2584);
  assert.equal(summary.total, 18734);
});

test('estimateIndustrialImpact computes deterministic savings and recommends optimal SKU', () => {
  const impact = estimateIndustrialImpact({ dailyHours: 18, activeLines: 3 });
  assert.ok(impact.annualEnergySavingsUsd > 0);
  assert.equal(impact.recommendedSku, 'IL-MOT-75K');
});

test('calculateInvoiceAmounts computes 16% VAT accurately', () => {
  const result = calculateInvoiceAmounts(10000);
  assert.equal(result.subtotal, 10000);
  assert.equal(result.taxAmount, 1600);
  assert.equal(result.total, 11600);
});

test('generateDigitalSignature produces deterministic SHA256 stamp', () => {
  const sig1 = generateDigitalSignature('FAC-2026-001', '900482190-1', 11600);
  const sig2 = generateDigitalSignature('FAC-2026-001', '900482190-1', 11600);
  assert.equal(sig1, sig2);
  assert.ok(sig1.startsWith('SHA256-IL-'));
});

test('validateNewOrderInput rejects invalid client name, NIT, quantity, or stock overflow', () => {
  assert.equal(
    validateNewOrderInput({ clientName: 'A', clientNit: '9001234', sku: 'IL-VAL-01', quantity: 5 }).valid,
    false
  );
  assert.equal(
    validateNewOrderInput({ clientName: 'Acero Andino', clientNit: '12', sku: 'IL-VAL-01', quantity: 5 }).valid,
    false
  );
  assert.equal(
    validateNewOrderInput({ clientName: 'Acero Andino', clientNit: '9001234', sku: 'IL-VAL-01', quantity: 0 }).valid,
    false
  );
  assert.equal(
    validateNewOrderInput({
      clientName: 'Acero Andino',
      clientNit: '9001234',
      sku: 'IL-VAL-01',
      quantity: 50,
      availableStock: 20,
    }).valid,
    false
  );
  assert.equal(
    validateNewOrderInput({
      clientName: 'Acero Andino',
      clientNit: '9001234',
      sku: 'IL-VAL-01',
      quantity: 10,
      availableStock: 20,
    }).valid,
    true
  );
});

test('shipment tracking progress and stage transitions follow logistics pipeline', () => {
  assert.equal(getShipmentProgressByStatus('preparacion'), 20);
  assert.equal(getShipmentProgressByStatus('en_transito'), 70);
  assert.equal(getShipmentProgressByStatus('entregado'), 100);
  assert.equal(getNextShipmentStatus('preparacion'), 'control_calidad');
  assert.equal(getNextShipmentStatus('centro_distribucion'), 'entregado');
  assert.equal(getNextShipmentStatus('entregado'), 'entregado');
});

test('findShipmentByQuery locates shipment by tracking code or client name', () => {
  const sample: Shipment[] = [
    {
      id: '1',
      trackingCode: 'IL-ENV-8901',
      orderCode: 'PED-2026-101',
      clientName: 'Constructora Andina S.A.',
      origin: 'Planta Monterrey',
      destination: 'Hub Bogotá',
      carrier: 'Flota Pesada IL-08',
      status: 'en_transito',
      progress: 70,
      estimatedDelivery: '2026-10-24',
      ownerId: 'admin_1',
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-21T10:00:00Z',
    },
  ];
  assert.equal(findShipmentByQuery(sample, 'il-env-8901')?.orderCode, 'PED-2026-101');
  assert.equal(findShipmentByQuery(sample, 'Andina')?.trackingCode, 'IL-ENV-8901');
  assert.equal(findShipmentByQuery(sample, 'NON-EXISTENT'), undefined);
});

test('E2EE encryption and decryption round-trip preserves sensitive payload', () => {
  const secret = 'Factura Confidencial USD 48,500.00 - NIT 900.412.881-2';
  const encrypted = encryptPayloadE2EE(secret);
  assert.ok(encrypted.cipherText.startsWith('ENCv2:'));
  const decrypted = decryptPayloadE2EE(encrypted.cipherText);
  assert.equal(decrypted, secret);
});

test('2FA TOTP verification and RBAC role permissions enforce security boundaries', () => {
  assert.equal(verifyTwoFactorCode('482910'), true);
  assert.equal(verifyTwoFactorCode('000000'), false);
  assert.equal(verifyTwoFactorCode('abc'), false);

  const adminPerms = getPermissionsForRole('admin');
  const clientPerms = getPermissionsForRole('cliente');
  assert.equal(adminPerms.canManageUsers, true);
  assert.equal(clientPerms.canManageUsers, false);
  assert.equal(clientPerms.canEditInventory, false);
  assert.equal(canTransitionOrderStatus('entregado', false), false);
  assert.equal(canTransitionOrderStatus('entregado', true), true);
});

test('CSV, Excel XML, and PDF generators produce valid structured documents', () => {
  const csv = buildCsvContent(['SKU', 'Nombre', 'Stock'], [['IL-01', 'Valvula, Alta Presion', 42]]);
  assert.ok(csv.includes('"Valvula, Alta Presion"'));

  const xls = buildExcelXmlContent('Inventario', ['SKU', 'Stock'], [['IL-01', 42]]);
  assert.ok(xls.includes('<Workbook'));
  assert.ok(xls.includes('ss:Type="Number">42</Data>'));

  const pdf = buildPdfDocumentStream('Reporte Industrial Latina', 'Octubre 2026', ['Total USD 148500']);
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.includes('Reporte Industrial Latina'));
});

test('isValidBlueprintId blocks oversized or malformed document IDs', () => {
  assert.equal(isValidBlueprintId('ord_2026_01'), true);
  assert.equal(isValidBlueprintId('invalid id with spaces'), false);
  assert.equal(isValidBlueprintId('x'.repeat(200)), false);
});

test('computeRealtimeSummaryInsights calculates Total Revenue Today, Active Shipments, and Pending Tickets accurately', () => {
  const insights = computeRealtimeSummaryInsights(
    [
      {
        id: 'o1',
        orderCode: 'PED-2026-101',
        clientName: 'Constructora Andina',
        clientNit: '900482190-1',
        sku: 'IL-MOT-75K',
        productName: 'Motor Trifásico',
        quantity: 2,
        unitPrice: 3400,
        totalAmount: 7888,
        status: 'enviado',
        paymentStatus: 'pagado',
        paymentMethod: 'tarjeta_corporativa',
        ownerId: 'admin_1',
        createdAt: '2026-10-21T10:00:00Z',
        updatedAt: '2026-10-21T12:00:00Z',
      },
    ],
    [
      {
        id: 's1',
        trackingCode: 'IL-ENV-8901',
        orderCode: 'PED-2026-101',
        clientName: 'Constructora Andina',
        origin: 'Bogotá',
        destination: 'Medellín',
        carrier: 'Flota 14',
        status: 'en_transito',
        progress: 70,
        estimatedDelivery: '2026-10-23',
        ownerId: 'admin_1',
        createdAt: '2026-10-21T10:00:00Z',
        updatedAt: '2026-10-21T12:00:00Z',
      },
      {
        id: 's2',
        trackingCode: 'IL-ENV-8903',
        orderCode: 'PED-2026-103',
        clientName: 'Minera Cobre',
        origin: 'Santiago',
        destination: 'Antofagasta',
        carrier: 'Flota 03',
        status: 'entregado',
        progress: 100,
        estimatedDelivery: '2026-10-20',
        ownerId: 'admin_1',
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-20T12:00:00Z',
      },
    ],
    [
      {
        id: 't1',
        ticketCode: 'SOP-247-901',
        subject: 'Homologación Certificado',
        priority: 'P2 - Alta (SLA 1h)',
        assignedEngineer: 'Ing. Sofía',
        status: 'en_atencion',
        createdAt: '2026-10-21 18:40',
      },
      {
        id: 't2',
        ticketCode: 'SOP-247-898',
        subject: 'Calibración Webhook',
        priority: 'P1 - Crítica (SLA 15 min)',
        assignedEngineer: 'Ing. Mateo',
        status: 'resuelto',
        createdAt: '2026-10-20 22:15',
      },
    ]
  );

  assert.equal(insights.totalRevenueToday, 7888);
  assert.equal(insights.activeShipmentsCount, 1);
  assert.equal(insights.avgShipmentProgressPct, 70);
  assert.equal(insights.pendingTicketsCount, 1);
  assert.equal(insights.resolvedTicketsCount, 1);
});

import { calculateProductRequirementByMeasure } from './erpLogic';
import { INITIAL_INVENTORY } from '../data/seedData';

test('calculateProductRequirementByMeasure computes exact paint gallons, water dilution, and roofing sheets for Ecuador catalog items', () => {
  const paintItem = INITIAL_INVENTORY.find((i) => i.sku === 'LAT-LVA-01')!;
  const paintCalc = calculateProductRequirementByMeasure({
    item: paintItem,
    widthMeters: 10,
    heightOrLengthMeters: 4, // 40 m²
    coatsOrFactor: 2,
    presentationMode: 'galon',
  });
  // 40 m² / 19 m² per gallon = ceil(2.105) = 3 gallons, 3L water
  assert.equal(paintCalc.effectiveAreaOrLength, 40);
  assert.equal(paintCalc.recommendedUnits, 3);
  assert.equal(paintCalc.waterDilutionLiters, 3);

  const roofItem = INITIAL_INVENTORY.find((i) => i.sku === 'TF15')!;
  const roofCalc = calculateProductRequirementByMeasure({
    item: roofItem,
    widthMeters: 6,
    heightOrLengthMeters: 5, // 30 m²
    coatsOrFactor: 2,
  });
  assert.ok(roofCalc.recommendedUnits >= 6);
  assert.ok(roofCalc.complementaryDetail.includes('Tornillos Punta de Broca'));
});

import {
  applyBulkFreeWillInventoryOperation,
  applyFieldMappingTransform,
  validateInternalConnectionInput,
} from './erpLogic';

test('validateInternalConnectionInput validates host, port, timeout, and custom JSON headers', () => {
  assert.equal(
    validateInternalConnectionInput({
      name: 'ERP Matriz',
      hostEndpoint: 'https://erp.industriallatina.com.ec',
      port: 8443,
      timeoutMs: 5000,
      customHeadersJson: '{"X-Company": "LATINA"}',
    }).valid,
    true
  );

  assert.equal(
    validateInternalConnectionInput({
      name: 'ERP Matriz',
      hostEndpoint: 'https://erp.industriallatina.com.ec',
      port: 99999,
      timeoutMs: 5000,
    }).valid,
    false
  );

  assert.equal(
    validateInternalConnectionInput({
      name: 'ERP Matriz',
      hostEndpoint: 'https://erp.industriallatina.com.ec',
      port: 443,
      timeoutMs: 5000,
      customHeadersJson: 'invalid-json',
    }).valid,
    false
  );
});

test('applyFieldMappingTransform transforms mapped fields according to configured rule', () => {
  assert.equal(applyFieldMappingTransform('lat-lva-01', 'UPPERCASE'), 'LAT-LVA-01');
  assert.equal(applyFieldMappingTransform('  PED-101  ', 'TRIM'), 'PED-101');
  assert.equal(applyFieldMappingTransform(100, 'MULTIPLY_IVA_15'), 115);
  assert.equal(applyFieldMappingTransform(-5, 'DEFAULT_ZERO'), 0);
});

test('applyBulkFreeWillInventoryOperation adjusts prices and presentations autonomously', () => {
  const sampleItems = INITIAL_INVENTORY.slice(0, 2);
  const originalFirstPrice = sampleItems[0].unitPrice;
  const { updatedInventory, affectedCount } = applyBulkFreeWillInventoryOperation(sampleItems, {
    brandFilter: 'todas',
    operationType: 'adjust_price_pct',
    numericValue: 10,
  });
  assert.equal(affectedCount, 2);
  assert.equal(
    updatedInventory[0].unitPrice,
    Math.round(originalFirstPrice * 1.1 * 100) / 100
  );
});



