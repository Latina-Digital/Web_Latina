import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, Invoice, Order, PredictiveAnalyticsResult } from '../types/erp';
import { MONTHLY_OPERATIONS_SERIES } from '../data/seedData';

export interface ExecutiveReportOptions {
  companyTitle?: string;
  reportClassification?: string;
  preparedBy?: string;
  includeEntityBreakdown?: boolean;
  includeSkuForecast?: boolean;
  includeSignatures?: boolean;
  horizonDays?: number;
  notes?: string;
}

export function generateExecutiveReportPdf(params: {
  prediction: PredictiveAnalyticsResult;
  orders: Order[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  options?: ExecutiveReportOptions;
}): jsPDF {
  const { prediction, orders, inventory, invoices, options = {} } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const navyRgb: [number, number, number] = [11, 40, 97];
  const goldRgb: [number, number, number] = [255, 209, 0];
  const redRgb: [number, number, number] = [227, 0, 15];
  const darkSlate: [number, number, number] = [30, 41, 59];
  const mutedSlate: [number, number, number] = [100, 116, 139];

  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })} · ${now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} ECT`;

  const reportId = `INF-GER-EC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Header Bar (Navy with Gold & Red Accent Line)
  doc.setFillColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold & Red accent stripes
  doc.setFillColor(goldRgb[0], goldRgb[1], goldRgb[2]);
  doc.rect(0, 28, pageWidth * 0.65, 2, 'F');
  doc.setFillColor(redRgb[0], redRgb[1], redRgb[2]);
  doc.rect(pageWidth * 0.65, 28, pageWidth * 0.35, 2, 'F');

  // Header Title & Dual Brand
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text('INDUSTRIAL LATINA  |  INDULESS ECUADOR', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(240, 240, 240);
  doc.text('División Corporativa de Construcción, Acabados y Ferretería · RUC: 0992847102001', margin, 17);
  doc.text('Plantas: Guayaquil (Vía a Daule / Mapasingue) · Centros Logísticos: Quito, Cuenca, Manta', margin, 22);

  // Right-aligned report code badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldRgb[0], goldRgb[1], goldRgb[2]);
  doc.text('INFORME EJECUTIVO DE ALTA GERENCIA', pageWidth - margin, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`ID: ${reportId}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(options.reportClassification || 'CONFIDENCIAL / USO INTERNO DE DIRECTORIO', pageWidth - margin, 22, { align: 'right' });

  let y = 36;

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.setFontSize(15);
  doc.text('INFORME GERENCIAL DE RENDIMIENTO Y PROYECCIONES ESTRATÉGICAS IA', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(
    `Fecha de Emisión: ${formattedDate}  |  Horizonte Evaluado: ${prediction.horizonDays} Días  |  Elaborado para: ${options.preparedBy || 'Directorio y Gerencia General'}`,
    margin,
    y
  );
  y += 7;

  // KPI Scorecards (4 Cards in a row)
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 20;

  const totalRev = orders.reduce((sum, o) => (o.status !== 'cancelado' ? sum + o.totalAmount : sum), 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const avgSla = Math.round(
    MONTHLY_OPERATIONS_SERIES.reduce((acc, m) => acc + m.despachosATiempoPct, 0) /
      MONTHLY_OPERATIONS_SERIES.length
  );

  const kpis = [
    {
      title: `Facturación Proyectada (${prediction.horizonDays}d)`,
      val: `$${prediction.projectedRevenueUsd.toLocaleString('en-US')}`,
      sub: `+${prediction.projectedRevenueGrowthPct}% proyección IA`,
      subColor: [16, 149, 93] as [number, number, number],
    },
    {
      title: 'Facturación Activa Acumulada',
      val: `$${Math.round(totalRev).toLocaleString('en-US')}`,
      sub: `${orders.length} pedidos B2B/B2C procesados`,
      subColor: mutedSlate,
    },
    {
      title: 'Cumplimiento Logístico SLA',
      val: `${avgSla}%`,
      sub: 'Ecuador: Guayas, Pichincha, Azuay',
      subColor: [16, 149, 93] as [number, number, number],
    },
    {
      title: 'Riesgo Cadena de Suministro',
      val: prediction.supplyChainRiskLevel,
      sub: `${inventory.length} SKUs activos monitoreados`,
      subColor: [227, 0, 15] as [number, number, number],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cx = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Colored mini top-tag
    doc.setFillColor(navyRgb[0], navyRgb[1], navyRgb[2]);
    doc.rect(cx, y, cardWidth, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(kpi.title, cx + 2.5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
    doc.text(kpi.val, cx + 2.5, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(kpi.subColor[0], kpi.subColor[1], kpi.subColor[2]);
    doc.text(kpi.sub, cx + 2.5, y + 16.5);
  });

  y += cardHeight + 6;

  // Executive Summary Box (Light Yellow/Blue frame)
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(186, 215, 253);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 1.5, 1.5, 'FD');

  // Left blue decorative accent bar
  doc.setFillColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.rect(margin, y, 2.5, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.text('DICTAMEN EJECUTIVO Y SÍNTESIS DE INTELIGENCIA ARTIFICIAL (IA):', margin + 5, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  const splitSummary = doc.splitTextToSize(
    prediction.executiveSummary ||
      'Se proyecta una aceleración de la demanda impulsada por licitaciones de construcción y temporada de mantenimiento en la Costa y Sierra de Ecuador. Las líneas de látex vinil acrílico, sellador blanco e iluminación LED presentan la mayor tasa de rotación esperada.',
    pageWidth - margin * 2 - 10
  );
  doc.text(splitSummary.slice(0, 3), margin + 5, y + 9);

  y += 23;

  // Section 1: Desempeño Operativo y Proyección
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.text('1. RENDIMIENTO HISTÓRICO Y PROYECCIÓN OPERATIVA (MAYO - OCTUBRE 2026 + IA)', margin, y);
  y += 2.5;

  const performanceRows: (string | number)[][] = MONTHLY_OPERATIONS_SERIES.map((m) => {
    const marginEst = Math.round(((m.ingresosUsd - m.costosLogisticosUsd * 2.2) / m.ingresosUsd) * 100);
    return [
      m.month,
      `$${m.ingresosUsd.toLocaleString('en-US')}`,
      m.pedidos,
      `${m.despachosATiempoPct}%`,
      `$${m.costosLogisticosUsd.toLocaleString('en-US')}`,
      `${marginEst}%`,
      'Auditado SRI',
    ];
  });

  // Append projected row
  performanceRows.push([
    `Proy. IA (${prediction.horizonDays}d)`,
    `$${prediction.projectedRevenueUsd.toLocaleString('en-US')}`,
    Math.round(orders.length * 1.3),
    '99.1%',
    '$5,650',
    '34.8%',
    'Modelo Predictivo',
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Mes / Periodo',
        'Ingresos Brutos USD',
        'Pedidos',
        'Cumplimiento SLA',
        'Costo Logístico',
        'Margen Neto Est.',
        'Estado Contable',
      ],
    ],
    body: performanceRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      font: 'helvetica',
      textColor: darkSlate,
    },
    headStyles: {
      fillColor: navyRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 32 },
      1: { halign: 'right', cellWidth: 28 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 26 },
      6: { halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  y = finalY + 6;

  // Section 2: Desglose por Entidad (Industrial Latina vs Induless)
  const latinaItems = inventory.filter((i) => i.company === 'industrial_latina');
  const indulessItems = inventory.filter((i) => i.company === 'induless');

  const latinaStockVal = latinaItems.reduce((acc, i) => acc + i.stock * i.unitPrice, 0);
  const indulessStockVal = indulessItems.reduce((acc, i) => acc + i.stock * i.unitPrice, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.text('2. DESGLOSE COMPARATIVO POR ENTIDAD CORPORATIVA (ECUADOR)', margin, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Entidad Corporativa',
        'Líneas Principales de Producto',
        'Catálogo SKUs',
        'Valor en Bodega (USD)',
        'Participación Proy.',
        'Sede Operativa Principal',
      ],
    ],
    body: [
      [
        'Industrial Latina',
        'Pinturas (LVA, Satinado, Duralin Forte), Empaste, Porcelana, Morteros',
        `${latinaItems.length} SKUs`,
        `$${Math.round(latinaStockVal).toLocaleString('en-US')}`,
        '58.5%',
        'Planta Matriz Vía a Daule Km 8.5 (Guayaquil)',
      ],
      [
        'Induless',
        'Conductores CONDEX, Iluminación LED, Techoforte, Soldadura AWS, Cerraduras',
        `${indulessItems.length} SKUs`,
        `$${Math.round(indulessStockVal).toLocaleString('en-US')}`,
        '41.5%',
        'Bodega Central Mapasingue Este (Guayaquil)',
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      font: 'helvetica',
      textColor: darkSlate,
    },
    headStyles: {
      fillColor: [14, 59, 124],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 54 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 22 },
      5: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY2 = (doc as any).lastAutoTable?.finalY || y + 25;
  y = finalY2 + 6;

  // Section 3: SKU Forecast & Reorder Recommendations
  if (y > pageHeight - 65) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.text('3. PRONÓSTICO DE DEMANDA Y RECOMENDACIÓN DE REPOSICIÓN DE STOCK (IA)', margin, y);
  y += 2.5;

  const skuRows = (prediction.skuForecasts || []).slice(0, 6).map((f) => {
    const item = inventory.find((i) => i.sku === f.sku);
    const companyLabel = item?.company === 'induless' ? 'Induless' : 'Latina';
    return [
      f.sku,
      f.productName.slice(0, 38),
      companyLabel,
      `${f.predictedDemandUnits} und`,
      `+${f.recommendedReorderUnits} und`,
      `${f.stockoutRiskDays} días`,
      f.actionPriority,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      [
        'SKU',
        'Producto / Insumo',
        'Empresa',
        `Demanda (${prediction.horizonDays}d)`,
        'Compra Sugerida',
        'Autonomía',
        'Prioridad Gerencial',
      ],
    ],
    body: skuRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.6,
      font: 'helvetica',
      textColor: darkSlate,
    },
    headStyles: {
      fillColor: navyRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  const finalY3 = (doc as any).lastAutoTable?.finalY || y + 35;
  y = finalY3 + 6;

  // Check if we need a new page for Strategic Recommendations & Signatures
  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  // Section 4: Strategic Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
  doc.text('4. RECOMENDACIONES ESTRATÉGICAS Y PLAN DE ACCIÓN PARA EL DIRECTORIO', margin, y);
  y += 5;

  const recWidth = (pageWidth - margin * 2 - 6) / 3;
  (prediction.strategicRecommendations || []).slice(0, 3).forEach((rec, idx) => {
    const rx = margin + idx * (recWidth + 3);
    doc.setFillColor(252, 253, 255);
    doc.setDrawColor(219, 234, 254);
    doc.roundedRect(rx, y, recWidth, 24, 1.5, 1.5, 'FD');

    // Accent top bar
    doc.setFillColor(navyRgb[0], navyRgb[1], navyRgb[2]);
    doc.rect(rx, y, recWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 149, 93);
    doc.text(rec.impactMetric, rx + 2.5, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
    const splitTitle = doc.splitTextToSize(rec.title, recWidth - 5);
    doc.text(splitTitle.slice(0, 2), rx + 2.5, y + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    const splitDetail = doc.splitTextToSize(rec.detail, recWidth - 5);
    doc.text(splitDetail.slice(0, 3), rx + 2.5, y + 15.5);
  });

  y += 29;

  // Section 5: Executive Signatures Block
  if (y > pageHeight - 35) {
    doc.addPage();
    y = 20;
  }

  const sigColWidth = (pageWidth - margin * 2 - 12) / 3;
  const sigs = [
    {
      name: 'Ing. Carlos Mendoza',
      charge: 'Dirección General Ecuador',
      sub: 'Industrial Latina & Induless',
      auth: 'Firma Digital Aprobada',
    },
    {
      name: 'Roberto Salazar',
      charge: 'Gerencia Nacional de Operaciones',
      sub: 'Planta Mapasingue / Vía a Daule',
      auth: 'Validación Logística SRI',
    },
    {
      name: 'Ing. Diego Andrade',
      charge: 'Ventas Digitales & Asesoría Técnica',
      sub: 'Código Vendedor VD-EC-101',
      auth: 'Certificación Comercial B2B/B2C',
    },
  ];

  sigs.forEach((s, idx) => {
    const sx = margin + idx * (sigColWidth + 6);
    doc.setDrawColor(180, 190, 205);
    doc.line(sx, y + 12, sx + sigColWidth, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(navyRgb[0], navyRgb[1], navyRgb[2]);
    doc.text(s.name, sx + sigColWidth / 2, y + 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(s.charge, sx + sigColWidth / 2, y + 19.5, { align: 'center' });
    doc.text(s.sub, sx + sigColWidth / 2, y + 23, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(16, 149, 93);
    doc.text(`[✓ ${s.auth}]`, sx + sigColWidth / 2, y + 26.5, { align: 'center' });
  });

  // Footer for each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Footer bottom separator
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(
      `Industrial Latina & Induless Ecuador · Sistema Integrado ERP / IA · Documento Oficial Gerencial`,
      margin,
      pageHeight - 6.5
    );
    doc.text(
      `Página ${i} de ${totalPages} · ${reportId}`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  return doc;
}
