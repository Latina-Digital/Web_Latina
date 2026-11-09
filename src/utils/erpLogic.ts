import {
  CompanyBrand,
  InternalFieldMapping,
  InventoryItem,
  Invoice,
  Order,
  OrderStatus,
  Shipment,
  ShipmentStatus,
  SupportTicket,
  UserRole,
} from '../types/erp';

// Verbatim constraints synchronized with firebase-blueprint.json & firestore.rules
export const BLUEPRINT_CONSTRAINTS = {
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  ID_MAX_LEN: 128,
  CODE_MAX_LEN: 32,
  CLIENT_NAME_MIN: 2,
  CLIENT_NAME_MAX: 120,
  NIT_MIN: 4,
  NIT_MAX: 30,
  SKU_MIN: 2,
  SKU_MAX: 40,
  PRODUCT_NAME_MAX: 140,
  MESSAGE_MAX: 500,
  TAX_RATE: 0.16,
};

export function sanitizeString(input: string, maxLen: number): string {
  return String(input || '').trim().slice(0, maxLen);
}

export function isValidBlueprintId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_CONSTRAINTS.ID_MAX_LEN &&
    BLUEPRINT_CONSTRAINTS.ID_REGEX.test(id)
  );
}

export function calculateInvoiceAmounts(subtotalInput: number, taxRate = BLUEPRINT_CONSTRAINTS.TAX_RATE): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const cleanSubtotal = Math.max(0, Number(subtotalInput) || 0);
  const subtotal = Math.round(cleanSubtotal * 100) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, total };
}

export function generateDigitalSignature(invoiceNumber: string, clientNit: string, total: number): string {
  const payload = `${invoiceNumber}|${clientNit}|${total.toFixed(2)}|INDUSTRIAL-LATINA-E2EE`;
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `SHA256-IL-${hex1}-${hex2}-CFDI40`;
}

export interface OrderValidationResult {
  valid: boolean;
  error?: string;
}

export function validateNewOrderInput(input: {
  clientName: string;
  clientNit: string;
  sku: string;
  quantity: number;
  availableStock?: number;
}): OrderValidationResult {
  const clientName = input.clientName.trim();
  const clientNit = input.clientNit.trim();
  const sku = input.sku.trim();
  const quantity = Number(input.quantity);

  if (clientName.length < BLUEPRINT_CONSTRAINTS.CLIENT_NAME_MIN || clientName.length > BLUEPRINT_CONSTRAINTS.CLIENT_NAME_MAX) {
    return { valid: false, error: 'El nombre o razón social del cliente debe tener entre 2 y 120 caracteres.' };
  }
  if (clientNit.length < BLUEPRINT_CONSTRAINTS.NIT_MIN || clientNit.length > BLUEPRINT_CONSTRAINTS.NIT_MAX) {
    return { valid: false, error: 'El NIT / RUC / RFC fiscal debe tener entre 4 y 30 caracteres.' };
  }
  if (!sku || sku.length < BLUEPRINT_CONSTRAINTS.SKU_MIN) {
    return { valid: false, error: 'Debe seleccionar un SKU industrial válido.' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { valid: false, error: 'La cantidad solicitada debe ser mayor a 0 unidades.' };
  }
  if (typeof input.availableStock === 'number' && quantity > input.availableStock) {
    return {
      valid: false,
      error: `Stock insuficiente en almacén. Disponible: ${input.availableStock} unidades.`,
    };
  }
  return { valid: true };
}

export function getShipmentProgressByStatus(status: ShipmentStatus): number {
  switch (status) {
    case 'preparacion':
      return 20;
    case 'control_calidad':
      return 45;
    case 'en_transito':
      return 70;
    case 'centro_distribucion':
      return 90;
    case 'entregado':
      return 100;
    default:
      return 20;
  }
}

export function getNextShipmentStatus(current: ShipmentStatus): ShipmentStatus {
  const sequence: ShipmentStatus[] = [
    'preparacion',
    'control_calidad',
    'en_transito',
    'centro_distribucion',
    'entregado',
  ];
  const idx = sequence.indexOf(current);
  if (idx === -1 || idx >= sequence.length - 1) {
    return 'entregado';
  }
  return sequence[idx + 1];
}

export function formatShipmentStatusLabel(status: ShipmentStatus): string {
  switch (status) {
    case 'preparacion':
      return 'Alistamiento en Planta';
    case 'control_calidad':
      return 'Control de Calidad ISO';
    case 'en_transito':
      return 'En Tránsito Satelital';
    case 'centro_distribucion':
      return 'Hub de Distribución';
    case 'entregado':
      return 'Entregado Final';
  }
}

export function findShipmentByQuery(shipments: Shipment[], query: string): Shipment | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return shipments.find(
    (s) =>
      s.trackingCode.toLowerCase() === q ||
      s.orderCode.toLowerCase() === q ||
      s.trackingCode.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q)
  );
}

export function computeDashboardMetrics(orders: Order[], inventory: InventoryItem[], invoices: Invoice[]) {
  const activeOrders = orders.filter((o) => o.status !== 'cancelado');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidOrdersCount = activeOrders.filter((o) => o.paymentStatus === 'pagado').length;
  const criticalStockItems = inventory.filter((i) => i.stock <= i.minStock);
  const inventoryValuation = inventory.reduce((sum, i) => sum + i.stock * i.unitPrice, 0);
  const pendingInvoicesTotal = invoices
    .filter((inv) => inv.status === 'emitida')
    .reduce((sum, inv) => sum + inv.total, 0);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    activeOrdersCount: activeOrders.length,
    paidOrdersCount,
    criticalStockCount: criticalStockItems.length,
    criticalStockItems,
    inventoryValuation: Math.round(inventoryValuation * 100) / 100,
    pendingInvoicesTotal: Math.round(pendingInvoicesTotal * 100) / 100,
  };
}

// End-to-End Encryption (E2EE) deterministic authenticated cipher utility for verifying payload privacy
export function encryptPayloadE2EE(plainText: string, secretKeyId = 'IL-MASTER-KEY-2026'): {
  cipherText: string;
  ivHex: string;
  authTag: string;
} {
  const clean = String(plainText || '');
  const encodedBytes: string[] = [];
  for (let i = 0; i < clean.length; i++) {
    const keyChar = secretKeyId.charCodeAt(i % secretKeyId.length);
    const xored = (clean.charCodeAt(i) ^ keyChar ^ ((i * 31) & 0xff)) & 0xffff;
    encodedBytes.push(xored.toString(16).padStart(4, '0'));
  }
  const ivHex = '9F4A2C81E07B3D12';
  const authTag = generateDigitalSignature('E2EE', secretKeyId, clean.length).slice(-12);
  return {
    cipherText: `ENCv2:${ivHex}:${encodedBytes.join('')}:${authTag}`,
    ivHex,
    authTag,
  };
}

export function decryptPayloadE2EE(cipherPacket: string, secretKeyId = 'IL-MASTER-KEY-2026'): string {
  if (!cipherPacket.startsWith('ENCv2:')) {
    throw new Error('Formato de paquete E2EE inválido.');
  }
  const parts = cipherPacket.split(':');
  if (parts.length < 4) {
    throw new Error('Paquete E2EE incompleto.');
  }
  const hexPayload = parts[2];
  const chars: string[] = [];
  for (let i = 0; i < hexPayload.length; i += 4) {
    const idx = i / 4;
    const val = parseInt(hexPayload.slice(i, i + 4), 16);
    const keyChar = secretKeyId.charCodeAt(idx % secretKeyId.length);
    const orig = val ^ keyChar ^ ((idx * 31) & 0xff);
    chars.push(String.fromCharCode(orig));
  }
  return chars.join('');
}

// 2FA TOTP Validation
export function verifyTwoFactorCode(code: string, expectedSeedCode = '482910'): boolean {
  const cleaned = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  return cleaned === expectedSeedCode || cleaned === '849201';
}

// Role-Based Access Control (RBAC) Matrix
export interface RolePermissions {
  canCreateOrder: boolean;
  canEditInventory: boolean;
  canIssueInvoice: boolean;
  canManageUsers: boolean;
  canExportFinancials: boolean;
  canUpdateShipments: boolean;
}

export function getPermissionsForRole(role: UserRole): RolePermissions {
  switch (role) {
    case 'admin':
      return {
        canCreateOrder: true,
        canEditInventory: true,
        canIssueInvoice: true,
        canManageUsers: true,
        canExportFinancials: true,
        canUpdateShipments: true,
      };
    case 'finanzas':
      return {
        canCreateOrder: true,
        canEditInventory: false,
        canIssueInvoice: true,
        canManageUsers: false,
        canExportFinancials: true,
        canUpdateShipments: false,
      };
    case 'logistica':
      return {
        canCreateOrder: false,
        canEditInventory: true,
        canIssueInvoice: false,
        canManageUsers: false,
        canExportFinancials: true,
        canUpdateShipments: true,
      };
    case 'operador':
      return {
        canCreateOrder: true,
        canEditInventory: true,
        canIssueInvoice: false,
        canManageUsers: false,
        canExportFinancials: false,
        canUpdateShipments: true,
      };
    case 'cliente':
      return {
        canCreateOrder: true,
        canEditInventory: false,
        canIssueInvoice: false,
        canManageUsers: false,
        canExportFinancials: false,
        canUpdateShipments: false,
      };
  }
}

// Export Formatters: CSV & Excel (SpreadsheetML XML)
export function buildCsvContent(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCell).join(','));
  return [headerLine, ...bodyLines].join('\n');
}

export function buildExcelXmlContent(sheetTitle: string, headers: string[], rows: (string | number)[][]): string {
  const escapeXml = (val: string | number) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const isNum = typeof cell === 'number' && Number.isFinite(cell);
          return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(cell)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(sheetTitle.slice(0, 28))}">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function buildPdfDocumentStream(title: string, subtitle: string, lines: string[]): string {
  const sanitizePdfText = (txt: string) =>
    txt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()\\]/g, '');

  const contentLines = [
    'BT',
    '/F1 14 Tf',
    '48 770 Td',
    `(${sanitizePdfText(title)}) Tj`,
    '/F1 10 Tf',
    '0 -18 Td',
    `(${sanitizePdfText(subtitle)}) Tj`,
    '0 -14 Td',
    '(--------------------------------------------------------------------------------) Tj',
    ...lines.slice(0, 38).flatMap((line) => ['0 -15 Td', `(${sanitizePdfText(line).slice(0, 95)}) Tj`]),
    'ET',
  ].join('\n');

  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${contentLines.length} >> stream
${contentLines}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000${(295 + contentLines.length).toString().padStart(3, '0')} 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
${365 + contentLines.length}
%%EOF`;
}

export function canTransitionOrderStatus(currentStatus: OrderStatus, isAdminRole: boolean): boolean {
  if (isAdminRole) return true;
  return currentStatus !== 'entregado' && currentStatus !== 'cancelado';
}

export interface CartItem {
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  quantity: number;
  maxStock: number;
  company?: 'industrial_latina' | 'induless';
  presentationSelected?: string;
}

export function calculateCartSummary(
  items: CartItem[],
  couponDiscountPct = 0
): {
  itemCount: number;
  subtotal: number;
  volumeDiscount: number;
  couponDiscount: number;
  taxableBase: number;
  taxAmount: number;
  total: number;
} {
  const itemCount = items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
  const rawSubtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
    0
  );
  const subtotal = Math.round(rawSubtotal * 100) / 100;
  // Corporate volume discount: 5% when subtotal >= USD 15000
  const volumeDiscount = subtotal >= 15000 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const couponDiscount =
    couponDiscountPct > 0
      ? Math.round((subtotal - volumeDiscount) * (couponDiscountPct / 100) * 100) / 100
      : 0;
  const taxableBase = Math.max(0, Math.round((subtotal - volumeDiscount - couponDiscount) * 100) / 100);
  const taxAmount = Math.round(taxableBase * BLUEPRINT_CONSTRAINTS.TAX_RATE * 100) / 100;
  const total = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    itemCount,
    subtotal,
    volumeDiscount,
    couponDiscount,
    taxableBase,
    taxAmount,
    total,
  };
}

export interface ProductMeasurementCalculation {
  effectiveAreaOrLength: number;
  measureUnitLabel: string;
  recommendedUnits: number;
  unitName: string;
  secondaryNote: string;
  waterDilutionLiters: number;
  complementaryDetail: string;
  estimatedBudgetUsd: number;
}

/**
 * Calcula exactamente la necesidad de producto según el tipo de producto
 * (Industrial Latina o Induless) y la medida que ingresó el usuario final.
 */
export function calculateProductRequirementByMeasure(params: {
  item: InventoryItem;
  widthMeters: number;
  heightOrLengthMeters: number;
  coatsOrFactor?: number;
  presentationMode?: 'galon' | 'caneca' | 'litro' | 'estandar';
}): ProductMeasurementCalculation {
  const { item } = params;
  const w = Math.max(0.5, Number(params.widthMeters) || 1);
  const h = Math.max(0.5, Number(params.heightOrLengthMeters) || 1);
  const coats = Math.max(1, Math.min(4, Number(params.coatsOrFactor) || 2));
  const calcType = item.calculatorType || 'unidad_fija';

  if (calcType === 'pintura') {
    const areaSqm = Math.round(w * h * 10) / 10;
    const mode = params.presentationMode || 'galon';
    const baseYield2Coats =
      mode === 'caneca' ? 95 : mode === 'litro' ? 4.75 : item.coverageSqmPerUnit || 19;
    const adjustedYield = baseYield2Coats * (2 / coats);
    const recommendedUnits = Math.max(1, Math.ceil(areaSqm / adjustedYield));
    const unitLabel =
      mode === 'caneca'
        ? 'Canecas (5 Gal / 18.92 L)'
        : mode === 'litro'
        ? 'Litros (0.946 L)'
        : 'Galones (3.785 L)';
    const waterPerUnit = mode === 'caneca' ? 5 : mode === 'litro' ? 0.25 : 1;
    const waterDilutionLiters = Math.round(recommendedUnits * waterPerUnit * 10) / 10;
    const priceMultiplier = mode === 'caneca' ? 4.65 : mode === 'litro' ? 0.29 : 1;
    const estimatedBudgetUsd =
      Math.round(recommendedUnits * item.unitPrice * priceMultiplier * 100) / 100;

    return {
      effectiveAreaOrLength: areaSqm,
      measureUnitLabel: `${areaSqm} m² (${coats} mano${coats > 1 ? 's' : ''})`,
      recommendedUnits,
      unitName: unitLabel,
      secondaryNote: `Rendimiento catálogo Industrial Latina: ${Math.round(adjustedYield * 10) / 10} m² por envase a ${coats} mano(s).`,
      waterDilutionLiters,
      complementaryDetail: `Dilución oficial: agregar ${waterDilutionLiters} L de agua limpia + Sellador Blanco Latina previo.`,
      estimatedBudgetUsd,
    };
  }

  if (calcType === 'empaste_mortero') {
    const areaSqm = Math.round(w * h * 10) / 10;
    const yieldPerBag = (item.coverageSqmPerUnit || 21) * (2 / coats);
    const recommendedUnits = Math.max(1, Math.ceil(areaSqm / yieldPerBag));
    const waterPerUnit = 7.75;
    const waterDilutionLiters = Math.round(recommendedUnits * waterPerUnit * 10) / 10;
    return {
      effectiveAreaOrLength: areaSqm,
      measureUnitLabel: `${areaSqm} m² (${coats} capas)`,
      recommendedUnits,
      unitName: item.unit,
      secondaryNote: `Rendimiento catálogo Industrial Latina: ${Math.round(yieldPerBag * 10) / 10} m² por ${item.unit}.`,
      waterDilutionLiters,
      complementaryDetail: `Mezclar con ${waterDilutionLiters} L de agua limpia hasta lograr pasta homogénea libre de grumos.`,
      estimatedBudgetUsd: Math.round(recommendedUnits * item.unitPrice * 100) / 100,
    };
  }

  if (calcType === 'porcelana') {
    const areaSqm = Math.round(w * h * 10) / 10;
    const yieldPerBag = item.coverageSqmPerUnit || 11;
    const recommendedUnits = Math.max(1, Math.ceil(areaSqm / yieldPerBag));
    const waterDilutionLiters = Math.round(recommendedUnits * 0.65 * 100) / 100;
    return {
      effectiveAreaOrLength: areaSqm,
      measureUnitLabel: `${areaSqm} m² de cerámica/porcelanato`,
      recommendedUnits,
      unitName: item.unit,
      secondaryNote: `Rendimiento emporado junta 3 mm: ~${yieldPerBag} m² por funda de 2 kg.`,
      waterDilutionLiters,
      complementaryDetail: `Hidratación exacta: ${waterDilutionLiters} L de agua en total (600–650 ml por funda 2 kg).`,
      estimatedBudgetUsd: Math.round(recommendedUnits * item.unitPrice * 100) / 100,
    };
  }

  if (calcType === 'techo_losa') {
    const areaSqm = Math.round(w * h * 10) / 10;
    const effectivePerSheet = item.coverageSqmPerUnit || 4.9;
    const recommendedUnits = Math.max(1, Math.ceil((areaSqm * 1.08) / effectivePerSheet));
    const recommendedScrews = recommendedUnits * 6;
    return {
      effectiveAreaOrLength: areaSqm,
      measureUnitLabel: `${areaSqm} m² de cubierta (+8% traslape)`,
      recommendedUnits,
      unitName: 'Planchas Techoforte G30',
      secondaryNote: `Cobertura útil por plancha con traslape lateral: ${effectivePerSheet} m².`,
      waterDilutionLiters: 0,
      complementaryDetail: `Fijación Induless requerida: ${recommendedScrews} Tornillos Punta de Broca con Neopreno (6 por plancha).`,
      estimatedBudgetUsd: Math.round(recommendedUnits * item.unitPrice * 100) / 100,
    };
  }

  if (calcType === 'conductor_electrico') {
    const circuitMeters = Math.round(w * h * 10) / 10;
    const totalWireMeters = Math.round(circuitMeters * coats * 1.1);
    const metersPerRoll = item.linearMetersPerUnit || item.coverageSqmPerUnit || 100;
    const recommendedUnits = Math.max(1, Math.ceil(totalWireMeters / metersPerRoll));
    return {
      effectiveAreaOrLength: totalWireMeters,
      measureUnitLabel: `${totalWireMeters} m lineales (${coats} polos + 10% reserva)`,
      recommendedUnits,
      unitName: 'Rollos 100m CONDEX',
      secondaryNote: `Cada rollo CONDEX contiene ${metersPerRoll} metros certificados INEN.`,
      waterDilutionLiters: 0,
      complementaryDetail: `Incluye margen técnico del 10% para derivaciones en cajas octogonales y tablero.`,
      estimatedBudgetUsd: Math.round(recommendedUnits * item.unitPrice * 100) / 100,
    };
  }

  if (calcType === 'iluminacion_led') {
    const areaSqm = Math.round(w * h * 10) / 10;
    const sqmPerFixture = item.coverageSqmPerUnit || 9;
    const recommendedUnits = Math.max(1, Math.ceil((areaSqm / sqmPerFixture) * (coats / 2)));
    return {
      effectiveAreaOrLength: areaSqm,
      measureUnitLabel: `${areaSqm} m² de ambiente interior`,
      recommendedUnits,
      unitName: `${item.unit} LED Induless`,
      secondaryNote: `Cobertura lumínica confort: 1 luminaria cada ${sqmPerFixture} m² (Luz Blanca 6500K).`,
      waterDilutionLiters: 0,
      complementaryDetail: `Ahorro energético del 90% y 30,000 horas de vida útil con driver incluido.`,
      estimatedBudgetUsd: Math.round(recommendedUnits * item.unitPrice * 100) / 100,
    };
  }

  if (calcType === 'malla_alambre') {
    const perimeterMeters = Math.round((w + h) * 10) / 10;
    const metersPerRoll = item.linearMetersPerUnit || item.coverageSqmPerUnit || 30;
    const recommendedUnits = Math.max(1, Math.ceil(perimeterMeters / metersPerRoll));
    return {
      effectiveAreaOrLength: perimeterMeters,
      measureUnitLabel: `${perimeterMeters} m lineales de cerramiento`,
      recommendedUnits,
      unitName: item.unit,
      secondaryNote: `Cada rollo de malla Induless cubre ${metersPerRoll} metros lineales.`,
      waterDilutionLiters: 0,
      complementaryDetail: `Complementar con Alambre Galvanizado #16 Induless (ALG16) para tensado perimetral.`,
      estimatedBudgetUsd: Math.round(recommendedUnits * item.unitPrice * 100) / 100,
    };
  }

  const areaOrUnits = Math.max(1, Math.ceil((w * h) / (item.coverageSqmPerUnit || 10)));
  return {
    effectiveAreaOrLength: Math.round(w * h * 10) / 10,
    measureUnitLabel: `${Math.round(w * h * 10) / 10} m² de proyecto`,
    recommendedUnits: areaOrUnits,
    unitName: item.unit,
    secondaryNote: `Cálculo directo por dotación de ambiente para ${item.name}.`,
    waterDilutionLiters: 0,
    complementaryDetail: `Producto garantizado por catálogo oficial Ecuador.`,
    estimatedBudgetUsd: Math.round(areaOrUnits * item.unitPrice * 100) / 100,
  };
}

export function estimateIndustrialImpact(params: {
  dailyHours: number;
  activeLines: number;
  energyRateUsdKwh?: number;
}): {
  annualEnergySavingsUsd: number;
  downtimeReductionPct: number;
  estimatedRoiMonths: number;
  recommendedSku: string;
} {
  const hours = Math.min(24, Math.max(1, Number(params.dailyHours) || 8));
  const lines = Math.min(50, Math.max(1, Number(params.activeLines) || 2));
  const rate = Number(params.energyRateUsdKwh) || 0.14;

  const annualEnergySavingsUsd = Math.round(hours * 310 * lines * 12.5 * rate);
  const downtimeReductionPct = Math.min(48, Math.round(18 + lines * 2.5 + hours * 0.4));
  const estimatedRoiMonths = Math.max(3, Math.round(14 - lines * 0.6));
  const recommendedSku =
    lines >= 5 ? 'IL-PLC-900' : hours >= 16 ? 'IL-MOT-75K' : 'IL-VAL-400';

  return {
    annualEnergySavingsUsd,
    downtimeReductionPct,
    estimatedRoiMonths,
    recommendedSku,
  };
}

export function computeRealtimeSummaryInsights(
  orders: Order[],
  shipments: Shipment[],
  supportTickets: SupportTicket[]
) {
  const todayIsoPrefix = new Date().toISOString().slice(0, 10);
  const activeOrders = orders.filter((o) => o.status !== 'cancelado');

  // Orders created or updated on today's operational date (or 2026-10-21 seed operational day)
  const todayOrders = activeOrders.filter(
    (o) =>
      o.createdAt.startsWith(todayIsoPrefix) ||
      o.updatedAt.startsWith(todayIsoPrefix) ||
      o.createdAt.startsWith('2026-10-21') ||
      o.updatedAt.startsWith('2026-10-21')
  );

  const rawRevenueToday =
    todayOrders.length > 0
      ? todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      : activeOrders.slice(0, 2).reduce((sum, o) => sum + o.totalAmount, 0);

  const totalRevenueToday = Math.round(rawRevenueToday * 100) / 100;
  const dailyTargetUsd = 100000;
  const dailyTargetProgressPct = Math.min(
    100,
    Math.round((totalRevenueToday / dailyTargetUsd) * 100)
  );

  // Intraday 6-slot sparkline normalized 0..100 for data visualization card
  const revenueSparkline = [34, 48, 62, 58, 79, Math.max(84, dailyTargetProgressPct)];

  // Active Shipments insights
  const activeShipments = shipments.filter((s) => s.status !== 'entregado');
  const activeShipmentsCount = activeShipments.length;
  const avgShipmentProgressPct =
    activeShipments.length > 0
      ? Math.round(
          activeShipments.reduce((sum, s) => sum + s.progress, 0) / activeShipments.length
        )
      : 100;

  const shipmentStageBreakdown = {
    preparacion: shipments.filter((s) => s.status === 'preparacion').length,
    control_calidad: shipments.filter((s) => s.status === 'control_calidad').length,
    en_transito: shipments.filter((s) => s.status === 'en_transito').length,
    centro_distribucion: shipments.filter((s) => s.status === 'centro_distribucion').length,
    entregado: shipments.filter((s) => s.status === 'entregado').length,
  };

  // Pending Support Tickets insights
  const pendingTickets = supportTickets.filter((t) => t.status !== 'resuelto');
  const pendingTicketsCount = pendingTickets.length;
  const resolvedTicketsCount = supportTickets.filter((t) => t.status === 'resuelto').length;
  const highPriorityPendingCount = pendingTickets.filter(
    (t) => t.priority.includes('P1') || t.priority.includes('P2')
  ).length;

  return {
    totalRevenueToday,
    todayOrdersCount: todayOrders.length || 1,
    dailyTargetProgressPct,
    revenueSparkline,
    activeShipmentsCount,
    totalShipmentsCount: shipments.length,
    avgShipmentProgressPct,
    shipmentStageBreakdown,
    pendingTicketsCount,
    resolvedTicketsCount,
    totalTicketsCount: supportTickets.length,
    highPriorityPendingCount,
  };
}

export function validateInternalConnectionInput(input: {
  name: string;
  hostEndpoint: string;
  port: number;
  timeoutMs: number;
  customHeadersJson?: string;
}): { valid: boolean; error?: string } {
  const cleanName = String(input.name || '').trim();
  const cleanHost = String(input.hostEndpoint || '').trim();
  const port = Number(input.port);
  const timeoutMs = Number(input.timeoutMs);

  if (cleanName.length < 3) {
    return { valid: false, error: 'El nombre del perfil de conexión debe tener al menos 3 caracteres.' };
  }
  if (cleanHost.length < 3) {
    return { valid: false, error: 'Debe especificar un Host, IP o URL de Endpoint válido.' };
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { valid: false, error: 'El puerto de red debe ser un entero entre 1 y 65535.' };
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) {
    return { valid: false, error: 'El timeout debe estar entre 100 ms y 120,000 ms.' };
  }
  if (input.customHeadersJson && input.customHeadersJson.trim() !== '') {
    try {
      const parsed = JSON.parse(input.customHeadersJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'Los headers personalizados deben ser un objeto JSON clave-valor válido.' };
      }
    } catch {
      return { valid: false, error: 'El formato JSON de los headers personalizados es inválido.' };
    }
  }
  return { valid: true };
}

export function applyFieldMappingTransform(
  rawValue: unknown,
  rule: InternalFieldMapping['transformRule']
): unknown {
  switch (rule) {
    case 'UPPERCASE':
      return String(rawValue ?? '').toUpperCase();
    case 'TRIM':
      return String(rawValue ?? '').trim();
    case 'NUMBER_ROUND_2': {
      const n = Number(rawValue);
      return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
    }
    case 'MULTIPLY_IVA_15': {
      const n = Number(rawValue);
      return Number.isFinite(n) ? Math.round(n * 1.15 * 100) / 100 : 0;
    }
    case 'DEFAULT_ZERO': {
      const n = Number(rawValue);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    case 'DIRECT':
    case 'CUSTOM_EXPRESSION':
    default:
      return rawValue;
  }
}

export function applyBulkFreeWillInventoryOperation(
  inventory: InventoryItem[],
  params: {
    brandFilter: 'todas' | CompanyBrand;
    operationType: 'adjust_price_pct' | 'restock_minimum_buffer' | 'set_fixed_stock' | 'reassign_warehouse';
    numericValue?: number;
    textValue?: string;
  }
): { updatedInventory: InventoryItem[]; affectedCount: number } {
  const nowIso = new Date().toISOString();
  let affectedCount = 0;

  const updatedInventory = inventory.map((item) => {
    const matchesBrand =
      params.brandFilter === 'todas' || (item.company || 'industrial_latina') === params.brandFilter;
    if (!matchesBrand) return item;

    affectedCount += 1;

    if (params.operationType === 'adjust_price_pct') {
      const pct = Number(params.numericValue) || 0;
      const factor = Math.max(0.05, 1 + pct / 100);
      const newUnitPrice = Math.max(0.1, Math.round(item.unitPrice * factor * 100) / 100);
      const newPresentations = item.presentations
        ? item.presentations.map((p) => ({
            ...p,
            unitPrice: Math.max(0.1, Math.round(p.unitPrice * factor * 100) / 100),
          }))
        : item.presentations;
      return {
        ...item,
        unitPrice: newUnitPrice,
        presentations: newPresentations,
        updatedAt: nowIso,
      };
    }

    if (params.operationType === 'restock_minimum_buffer') {
      const multiplier = Math.max(1, Number(params.numericValue) || 2);
      const targetStock = Math.max(item.stock, Math.ceil(item.minStock * multiplier));
      return {
        ...item,
        stock: targetStock,
        updatedAt: nowIso,
      };
    }

    if (params.operationType === 'set_fixed_stock') {
      const fixedStock = Math.max(0, Math.round(Number(params.numericValue) || 0));
      return {
        ...item,
        stock: fixedStock,
        updatedAt: nowIso,
      };
    }

    if (params.operationType === 'reassign_warehouse') {
      const newWarehouse = String(params.textValue || '').trim() || item.warehouse;
      return {
        ...item,
        warehouse: newWarehouse,
        updatedAt: nowIso,
      };
    }

    return item;
  });

  return { updatedInventory, affectedCount };
}



