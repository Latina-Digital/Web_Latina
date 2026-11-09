import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExecutiveReportPdf } from './executivePdfReport.js';
import { INITIAL_INVENTORY, INITIAL_INVOICES, INITIAL_ORDERS } from '../data/seedData.js';

test('generateExecutiveReportPdf creates valid managerial PDF document', () => {
  const predictionMock = {
    source: 'test-motor-ia',
    generatedAt: '2026-10-22T08:00:00Z',
    horizonDays: 30,
    executiveSummary: 'Resumen gerencial de prueba para Industrial Latina e Induless Ecuador.',
    projectedRevenueGrowthPct: 18.4,
    projectedRevenueUsd: 85000,
    supplyChainRiskLevel: 'Moderado-Controlado',
    skuForecasts: [
      {
        sku: 'LAT-LVA-01',
        productName: 'Pintura Látex Vinil Acrílico',
        predictedDemandUnits: 60,
        recommendedReorderUnits: 25,
        stockoutRiskDays: 12,
        actionPriority: 'Inmediata (Crítica)',
      },
    ],
    strategicRecommendations: [
      {
        title: 'Reposición Guayaquil',
        impactMetric: '+15%',
        detail: 'Detalle de optimización.',
      },
    ],
  };

  const doc = generateExecutiveReportPdf({
    prediction: predictionMock as any,
    orders: INITIAL_ORDERS,
    inventory: INITIAL_INVENTORY,
    invoices: INITIAL_INVOICES,
    options: {
      companyTitle: 'Industrial Latina & Induless Ecuador',
      preparedBy: 'Ing. Carlos Mendoza',
      includeEntityBreakdown: true,
      includeSkuForecast: true,
      includeSignatures: true,
    },
  });

  assert.ok(doc, 'PDF doc should exist');
  assert.ok(doc.getNumberOfPages() >= 1, 'PDF should have at least 1 page');
  const pdfOutput = doc.output('arraybuffer');
  assert.ok(pdfOutput.byteLength > 1000, 'PDF output should have realistic binary size');
});
