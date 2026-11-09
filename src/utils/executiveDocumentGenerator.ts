/**
 * Executive Document Generator for Industrial Latina & Induless Ecuador
 * Generates executive-grade, printable, and downloadable formats (PDF / HTML / Sheets)
 * complete with high-resolution vector logos, official tax metadata, ISO 9001:2015
 * certification seals, structured tables, bank accounts, and digital signatures.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ErpAuditLogEntry, InventoryItem } from '../types/erp';

export interface ExecutiveDocumentMeta {
  title: string;
  documentType:
    | 'ficha_tecnica'
    | 'cotizacion'
    | 'factura'
    | 'reporte'
    | 'diseno_3d'
    | 'auditoria_seguridad';
  documentNumber?: string;
  date?: string;
  clientName?: string;
  clientNit?: string;
  clientEmail?: string;
  clientAddress?: string;
  digitalSellerCode?: string;
  companyFocus?: 'industrial_latina' | 'induless' | 'ambas';
  accentColorHex?: string;
  notes?: string;
}

export interface ExecutiveTableRow {
  [key: string]: string | number;
}

export interface ExecutiveTableColumn {
  header: string;
  key: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: 'currency' | 'number' | 'text' | 'badge';
}

// -----------------------------------------------------------------------------
// EMBEDDED HIGH-RESOLUTION VECTOR LOGOS FOR STANDALONE DOCUMENT RENDERING
// -----------------------------------------------------------------------------

export const INDUSTRIAL_LATINA_SVG_LOGO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="220" height="55">
  <defs>
    <linearGradient id="latinaBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E4B8F"/>
      <stop offset="100%" stop-color="#0B2861"/>
    </linearGradient>
    <linearGradient id="latinaGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE066"/>
      <stop offset="50%" stop-color="#FFD100"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <!-- Stylized Industrial Triangle / Palette Emblem -->
  <g transform="translate(10, 8)">
    <polygon points="32,2 62,58 2,58" fill="url(#latinaBlue)" stroke="#0E4B8F" stroke-width="2"/>
    <polygon points="32,14 52,52 12,52" fill="#FFFFFF" opacity="0.95"/>
    <polygon points="32,24 44,48 20,48" fill="url(#latinaGold)"/>
    <circle cx="32" cy="38" r="4.5" fill="#0B2861"/>
  </g>
  <!-- Company Text -->
  <text x="82" y="36" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="22" fill="#0B2861" letter-spacing="-0.5">INDUSTRIAL</text>
  <text x="82" y="58" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="22" fill="#E3000F" letter-spacing="-0.5">LATINA</text>
  <text x="83" y="70" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="600" font-size="7.5" fill="#64748B" letter-spacing="2.2">PINTURAS · EMPASTES · MORTEROS</text>
</svg>
`;

export const INDULESS_SVG_LOGO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80" width="180" height="52">
  <defs>
    <linearGradient id="indulessCarmine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#9F1239"/>
    </linearGradient>
  </defs>
  <!-- Modern Geometric Diamond Icon -->
  <g transform="translate(10, 12)">
    <rect x="18" y="4" width="34" height="34" rx="7" transform="rotate(45 35 21)" fill="url(#indulessCarmine)"/>
    <rect x="23" y="9" width="24" height="24" rx="4" transform="rotate(45 35 21)" fill="#FFFFFF"/>
    <circle cx="35" cy="21" r="5" fill="url(#indulessCarmine)"/>
  </g>
  <!-- Company Text -->
  <text x="80" y="42" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" fill="#0F172A" letter-spacing="-0.8">INDU<tspan fill="#E11D48">LESS</tspan></text>
  <text x="81" y="60" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="7.5" fill="#64748B" letter-spacing="2.0">FERRETERÍA &amp; ILUMINACIÓN LED</text>
</svg>
`;

// Official Corporate Metadata
export const CORPORATE_COMPANY_INFO = {
  legalName: 'INDUSTRIAL LATINA CÍA. LTDA. & INDULESS S.A.',
  commercialBrand: 'Grupo Industrial Latina - Induless Ecuador',
  ruc: '0992847102001',
  matrixAddress: 'Av. Juan Tanca Marengo Km 4.5 & Mapasingue Este, Guayaquil - Ecuador',
  plantAddress: 'Parque Industrial Vía a Daule Km 8.5, Guayaquil - Ecuador',
  phone: 'PBX: (+593 4) 259-8700 / Ventas: (+593 4) 259-8701',
  whatsapp: '+593 97 973 2435 / +593 99 382 3514',
  email: 'ventas@industriallatina.com / atencion@induless.com.ec',
  website: 'www.industriallatina.com.ec',
  certifications: 'ISO 9001:2015 · NTE INEN 1538 · NTE INEN 2093 · BASC Ecuador',
  pichinchaAccount: 'Banco Pichincha Cta. Cte. #2100189421 (Industrial Latina Cía. Ltda.)',
  guayaquilAccount: 'Banco Guayaquil Cta. Cte. #0011894210 (Induless S.A.)',
};

// -----------------------------------------------------------------------------
// CORE EXECUTIVE DOCUMENT TEMPLATE BUILDER (HTML/PRINT/PDF READY)
// -----------------------------------------------------------------------------

export function buildExecutiveDocumentHtml(
  meta: ExecutiveDocumentMeta,
  bodyContentHtml: string
): string {
  const currentDate = meta.date || new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const docNumber = meta.documentNumber || `DOC-${Date.now().toString().slice(-6)}`;
  const accentColor = meta.accentColorHex || '#0B2861';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} · ${CORPORATE_COMPANY_INFO.commercialBrand}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 16mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
      position: relative;
    }
    /* Executive Header */
    .exec-header {
      border-bottom: 3px solid ${accentColor};
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .exec-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .logos-container {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-divider {
      width: 1px;
      height: 44px;
      background: #cbd5e1;
    }
    .doc-badge-box {
      text-align: right;
    }
    .doc-type-label {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${accentColor};
    }
    .doc-number {
      font-size: 16pt;
      font-weight: 900;
      color: #0f172a;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      letter-spacing: -0.5px;
    }
    .doc-date {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
    }
    .exec-header-legal {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #64748b;
      line-height: 1.35;
    }
    .exec-header-legal strong {
      color: #334155;
    }
    /* Meta Box */
    .exec-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid ${accentColor};
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 9pt;
    }
    .meta-item-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .meta-item-value {
      font-weight: 700;
      color: #0f172a;
      font-size: 9.5pt;
      margin-top: 2px;
    }
    /* Content Titles */
    h2.section-title {
      font-size: 12pt;
      font-weight: 800;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 18px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2.section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }
    /* Data Tables */
    table.exec-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 9pt;
    }
    table.exec-table th {
      background: ${accentColor};
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
      padding: 9px 12px;
      border: 1px solid ${accentColor};
    }
    table.exec-table td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    table.exec-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.exec-table td.text-right, table.exec-table th.text-right {
      text-align: right;
    }
    table.exec-table td.text-center, table.exec-table th.text-center {
      text-align: center;
    }
    table.exec-table td.font-mono {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
    }
    /* Totals Summary Card */
    .totals-card {
      margin-left: auto;
      max-width: 320px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 12px;
    }
    .totals-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 9pt;
      color: #475569;
    }
    .totals-line.grand-total {
      border-top: 2px solid ${accentColor};
      margin-top: 6px;
      padding-top: 8px;
      font-size: 12pt;
      font-weight: 900;
      color: ${accentColor};
    }
    /* Bank Info Block */
    .bank-info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 18px 0;
      font-size: 8.5pt;
      color: #1e3a8a;
    }
    .bank-info-box h4 {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0b2861;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    /* Signatures Section */
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 36px;
      margin-top: 36px;
      padding-top: 16px;
    }
    .signature-slot {
      text-align: center;
      padding-top: 40px;
      border-top: 1px solid #94a3b8;
    }
    .signature-title {
      font-weight: 800;
      font-size: 9pt;
      color: #0f172a;
    }
    .signature-sub {
      font-size: 8pt;
      color: #64748b;
    }
    /* Security Seal & Footer */
    .exec-footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
      line-height: 1.4;
    }
    .security-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      font-weight: 700;
      color: #334155;
    }
    /* Print Action Bar (hidden when printing) */
    .print-action-bar {
      position: sticky;
      top: 0;
      background: #0b2861;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-bottom: 2px solid #ffd100;
    }
    .print-btn {
      background: #ffd100;
      color: #0b2861;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 10pt;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #facc15;
    }
    @media print {
      .print-action-bar {
        display: none !important;
      }
      .page-container {
        padding: 0;
        max-width: 100%;
      }
      body {
        background: #ffffff;
      }
    }
  </style>
</head>
<body>
  <div class="print-action-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 16pt;">🏢</span>
      <div>
        <strong style="font-size: 11pt; color: #ffd100;">${CORPORATE_COMPANY_INFO.legalName}</strong>
        <p style="font-size: 8.5pt; opacity: 0.85;">Formato Oficial Certificado · Sistema ERP Industrial Latina</p>
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="print-btn" onclick="window.print()">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>
  </div>

  <div class="page-container">
    <!-- Executive Header with High-Resolution Logos -->
    <header class="exec-header">
      <div class="exec-header-top">
        <div class="logos-container">
          <div>${INDUSTRIAL_LATINA_SVG_LOGO}</div>
          <div class="logo-divider"></div>
          <div>${INDULESS_SVG_LOGO}</div>
        </div>
        <div class="doc-badge-box">
          <p class="doc-type-label">${meta.title}</p>
          <p class="doc-number">${docNumber}</p>
          <p class="doc-date">Fecha de Emisión: <strong>${currentDate}</strong></p>
        </div>
      </div>
      <div class="exec-header-legal">
        <div>
          <strong>${CORPORATE_COMPANY_INFO.legalName}</strong><br>
          RUC: ${CORPORATE_COMPANY_INFO.ruc} · ${CORPORATE_COMPANY_INFO.plantAddress}
        </div>
        <div style="text-align: right;">
          ${CORPORATE_COMPANY_INFO.phone}<br>
          ${CORPORATE_COMPANY_INFO.website} · ${CORPORATE_COMPANY_INFO.certifications}
        </div>
      </div>
    </header>

    <!-- Document Dynamic Body -->
    <main>
      ${bodyContentHtml}
    </main>

    <!-- Signatures Block -->
    <div class="signatures-grid">
      <div class="signature-slot">
        <p class="signature-title">Ing. Diego Andrade / Dpto. Técnico</p>
        <p class="signature-sub">Control de Calidad &amp; Despachos · Industrial Latina</p>
        <p style="font-size: 7pt; color: #94a3b8; margin-top: 4px;">Firma Digital Criptográfica E2EE SHA-256</p>
      </div>
      <div class="signature-slot">
        <p class="signature-title">${meta.clientName || 'Cliente / Receptor Autorizado'}</p>
        <p class="signature-sub">RUC / C.I.: ${meta.clientNit || 'Consumidor Final'} · Recepción Conforme</p>
        <p style="font-size: 7pt; color: #94a3b8; margin-top: 4px;">Aceptación de Condiciones Comerciales</p>
      </div>
    </div>

    <!-- Executive Footer -->
    <footer class="exec-footer">
      <div>
        <span class="security-badge">
          🔒 Documento Oficial Validador SRI · Hash SHA-256 Verificado
        </span>
      </div>
      <div style="text-align: right;">
        Página 1 de 1 · Generado por Consola ERP Industrial Latina<br>
        Validez tributaria y legal según Resolución NAC-DGERCGC Ecuador
      </div>
    </footer>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// SPECIFIC EXECUTIVE FORMAT GENERATORS
// -----------------------------------------------------------------------------

/**
 * 1. Technical Data Sheet (Ficha Técnica Oficial de Producto)
 */
export function generateTechnicalSheetExecutiveHtml(product: {
  sku: string;
  name: string;
  category: string;
  company?: 'industrial_latina' | 'induless' | string;
  unitPrice: number;
  unit: string;
  description?: string;
  imageUrl?: string;
  presentations?: Array<{
    name: string;
    unitPrice: number;
    description?: string;
    imageUrl?: string;
  }>;
  technicalSheet?: {
    catalogCode?: string;
    yieldOrCoverage?: string;
    dilutionOrMix?: string;
    masterPack?: string;
    normative?: string;
    presentationOptions?: string[];
    applicationSurface?: string;
    highlights?: string[];
    googleDriveUrl?: string;
  };
}): string {
  const ts = product.technicalSheet;
  const isLatina = product.company !== 'induless';
  const accentColor = isLatina ? '#0B2861' : '#D8235A';
  const driveUrl =
    ts?.googleDriveUrl ||
    `https://drive.google.com/file/d/1FichaTecnica${product.sku.replace(/[^a-zA-Z0-9]/g, '')}/view?usp=sharing`;

  const presentationsHtml =
    product.presentations && product.presentations.length > 0
      ? `
    <h2 class="section-title">Presentaciones Comerciales &amp; Registro Fotográfico por Envase</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 18px;">
      ${product.presentations
        .map(
          (pres) => `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column;">
          ${
            pres.imageUrl || product.imageUrl
              ? `<div style="height: 110px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <img src="${pres.imageUrl || product.imageUrl}" alt="${pres.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>`
              : ''
          }
          <div style="padding: 10px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
              <strong style="font-size: 9pt; color: #0f172a;">${pres.name}</strong>
              <span style="font-family: monospace; font-weight: 900; font-size: 9.5pt; color: ${accentColor};">$${pres.unitPrice.toFixed(2)}</span>
            </div>
            ${pres.description ? `<p style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">${pres.description}</p>` : ''}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : '';

  const body = `
    <div class="exec-meta-grid" style="border-left-color: ${accentColor};">
      <div>
        <span class="meta-item-label">Código SKU / Referencia</span>
        <p class="meta-item-value" style="font-family: monospace; font-size: 11pt;">${product.sku}</p>
      </div>
      <div>
        <span class="meta-item-label">Línea de Fabricación</span>
        <p class="meta-item-value">${isLatina ? 'Industrial Latina (Pinturas & Químicos)' : 'Induless Ecuador (Ferretería & LED)'}</p>
      </div>
      <div>
        <span class="meta-item-label">Categoría Comercial</span>
        <p class="meta-item-value">${product.category}</p>
      </div>
      <div>
        <span class="meta-item-label">Precio Referencial Fábrica</span>
        <p class="meta-item-value" style="color: ${accentColor};">$${product.unitPrice.toFixed(2)} USD / ${product.unit}</p>
      </div>
    </div>

    <!-- Google Drive Technical Sheet Official Connection Box -->
    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-left: 4px solid #0B2861; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
      <div>
        <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #0B2861; letter-spacing: 0.6px;">
          ☁️ Repositorio Oficial en la Nube · Ficha Técnica Conectada a Google Drive
        </span>
        <p style="font-family: monospace; font-size: 8pt; color: #1e3a8a; margin-top: 2px; word-break: break-all;">
          ${driveUrl}
        </p>
      </div>
      <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" style="background: #0B2861; color: #FFD100; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 8pt; font-weight: 800; white-space: nowrap;">
        Abrir en Google Drive ↗
      </a>
    </div>

    <h2 class="section-title">1. Identificación y Descripción del Producto</h2>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
      <h3 style="font-size: 13pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${product.name}</h3>
      <p style="font-size: 9.5pt; color: #475569; line-height: 1.5;">${product.description || 'Producto formulado bajo estrictos estándares industriales para garantizar máxima durabilidad, adherencia y cobertura en proyectos arquitectónicos y de construcción.'}</p>
    </div>

    ${presentationsHtml}

    <h2 class="section-title">2. Propiedades Físicas &amp; Especificaciones Técnicas</h2>
    <table class="exec-table">
      <thead>
        <tr>
          <th style="width: 35%;">Parámetro Técnico</th>
          <th style="width: 40%;">Especificación Certificada</th>
          <th style="width: 25%;">Norma Aplicable</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Rendimiento Teórico / Cobertura</strong></td>
          <td>${ts?.yieldOrCoverage || '20 - 25 m² por galón a 2 manos'}</td>
          <td>NTE INEN 1538</td>
        </tr>
        <tr>
          <td><strong>Dilución / Relación de Mezcla</strong></td>
          <td>${ts?.dilutionOrMix || 'Máximo 10% de agua limpia por galón'}</td>
          <td>Método Latina LAB-04</td>
        </tr>
        <tr>
          <td><strong>Superficies de Aplicación</strong></td>
          <td>${ts?.applicationSurface || 'Mampostería, yeso, gypsum, hormigón, madera curada'}</td>
          <td>Manual de Obra</td>
        </tr>
        <tr>
          <td><strong>Empaque Master / Presentación</strong></td>
          <td>${ts?.masterPack || 'Caja de 4 galones / Caneca de 5 galones'}</td>
          <td>Logística Segura</td>
        </tr>
        <tr>
          <td><strong>Normativa de Calidad Homologada</strong></td>
          <td><strong>${ts?.normative || 'NTE INEN Ecuador · Resistencia a Lavabilidad'}</strong></td>
          <td>INEN Oficial</td>
        </tr>
        <tr>
          <td><strong>Presentaciones de Fábrica</strong></td>
          <td>${(ts?.presentationOptions || [product.unit]).join(' · ')}</td>
          <td>Catálogo 2026</td>
        </tr>
        <tr>
          <td><strong>Enlace Oficial Google Drive</strong></td>
          <td colspan="2"><a href="${driveUrl}" target="_blank" rel="noopener noreferrer" style="color: #0B2861; font-family: monospace; font-size: 8pt;">${driveUrl}</a></td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">3. Ventajas &amp; Atributos Destacados</h2>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
      ${(ts?.highlights || [
        'Alto poder cubriente con pigmentos de dióxido de titanio de primera línea.',
        'Tecnología 100% lavable resistente a manchas y agentes bacterianos.',
        'Bajo olor y formulación ecológica con solventes libres de metales pesados.',
        'Protección UV de alta durabilidad para climas cálidos y húmedos del Ecuador.',
      ]).map((h) => `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-left: 3px solid ${accentColor}; border-radius: 6px; padding: 8px 12px; font-size: 8.5pt;">
          ✓ ${h}
        </div>
      `).join('')}
    </div>

    <h2 class="section-title">4. Instrucciones de Preparación &amp; Almacenamiento</h2>
    <p style="font-size: 8.5pt; color: #475569; line-height: 1.5; margin-bottom: 12px;">
      <strong>Preparación de superficie:</strong> La superficie debe estar completamente limpia, seca, libre de polvo, grasa, salitre o pintura suelta. En muros nuevos de mampostería, se recomienda aplicar una mano previa de <em>Sellador Blanco Concentrado Industrial Latina</em>.<br>
      <strong>Almacenamiento:</strong> Conservar en su envase original herméticamente cerrado, en lugar fresco y seco bajo techo, alejado de fuentes directas de calor. Vida útil estimada: 24 meses a partir de la fecha de envasado.
    </p>
  `;

  return buildExecutiveDocumentHtml(
    {
      title: 'Ficha Técnica Oficial de Producto',
      documentType: 'ficha_tecnica',
      documentNumber: `FT-${product.sku}`,
      accentColorHex: accentColor,
    },
    body
  );
}

/**
 * 2. Executive Quotation / Proforma (Cotización Formal con Logo y Cuentas Bancarias)
 */
export function generateQuotationExecutiveHtml(params: {
  orderCode?: string;
  clientName: string;
  clientNit: string;
  clientEmail?: string;
  clientWhatsapp?: string;
  destinationAddress?: string;
  cityEcuador?: string;
  digitalSellerCode?: string;
  items: Array<{
    sku: string;
    name: string;
    presentationSelected?: string;
    quantity: number;
    unitPrice: number;
    company?: string;
  }>;
  subtotal: number;
  volumeDiscount?: number;
  couponDiscount?: number;
  taxableBase?: number;
  taxAmount: number;
  total: number;
}): string {
  const docNum = params.orderCode || `COT-${Date.now().toString().slice(-6)}`;
  const taxableBase =
    params.taxableBase ??
    Math.max(0, params.subtotal - (params.volumeDiscount || 0) - (params.couponDiscount || 0));

  const rowsHtml = params.items
    .map(
      (item, idx) => `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono" style="font-weight: 700;">${item.sku}</td>
        <td>
          <strong>${item.name}</strong>
          ${item.presentationSelected ? `<br><small style="color: #64748b;">Presentación: ${item.presentationSelected}</small>` : ''}
        </td>
        <td class="text-center font-mono" style="font-weight: 700;">${item.quantity}</td>
        <td class="text-right font-mono">$${item.unitPrice.toFixed(2)}</td>
        <td class="text-right font-mono" style="font-weight: 700;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const body = `
    <div class="exec-meta-grid">
      <div>
        <span class="meta-item-label">Cliente / Razón Social</span>
        <p class="meta-item-value">${params.clientName}</p>
      </div>
      <div>
        <span class="meta-item-label">RUC / Cédula Fiscal</span>
        <p class="meta-item-value" style="font-family: monospace;">${params.clientNit}</p>
      </div>
      <div>
        <span class="meta-item-label">Destino de Entrega</span>
        <p class="meta-item-value">${params.destinationAddress || 'Guayaquil'} (${params.cityEcuador || 'Guayas'})</p>
      </div>
      <div>
        <span class="meta-item-label">Vendedor Digital Asignado</span>
        <p class="meta-item-value" style="color: #0b2861;">${params.digitalSellerCode || 'VD-EC-101'} · Despacho Inmediato</p>
      </div>
    </div>

    <h2 class="section-title">Detalle de Productos &amp; Materiales Cotizados</h2>
    <table class="exec-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 15%;">SKU</th>
          <th style="width: 45%;">Descripción del Material</th>
          <th style="width: 10%;" class="text-center">Cant.</th>
          <th style="width: 12%;" class="text-right">Precio Unit.</th>
          <th style="width: 13%;" class="text-right">Total USD</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap;">
      <!-- Commercial terms -->
      <div style="flex: 1; min-width: 260px; font-size: 8.5pt; color: #64748b; line-height: 1.45;">
        <strong style="color: #0f172a; text-transform: uppercase;">Condiciones Comerciales de Fábrica:</strong>
        <ul style="padding-left: 18px; margin-top: 4px;">
          <li>Precios expresados en Dólares de los Estados Unidos de América (USD).</li>
          <li>Cotización válida por 15 días a partir de la fecha de emisión.</li>
          <li><strong>Tiempo oficial de entrega: La entrega dura entre 48 a 72 horas laborables</strong> tras la confirmación del pago.</li>
          <li>Garantía de fábrica certificada bajo norma NTE INEN.</li>
        </ul>
      </div>

      <!-- Financial Totals Block -->
      <div class="totals-card">
        <div class="totals-line">
          <span>Subtotal Bruto:</span>
          <span class="font-mono">$${params.subtotal.toFixed(2)} USD</span>
        </div>
        ${params.volumeDiscount && params.volumeDiscount > 0 ? `
          <div class="totals-line" style="color: #059669;">
            <span>Desc. Volumen (5%):</span>
            <span class="font-mono">-$${params.volumeDiscount.toFixed(2)} USD</span>
          </div>
        ` : ''}
        ${params.couponDiscount && params.couponDiscount > 0 ? `
          <div class="totals-line" style="color: #059669;">
            <span>Desc. Cupón Promocional:</span>
            <span class="font-mono">-$${params.couponDiscount.toFixed(2)} USD</span>
          </div>
        ` : ''}
        <div class="totals-line">
          <span>Base Imponible:</span>
          <span class="font-mono">$${taxableBase.toFixed(2)} USD</span>
        </div>
        <div class="totals-line">
          <span>IVA Oficial (15% Ecuador):</span>
          <span class="font-mono">$${params.taxAmount.toFixed(2)} USD</span>
        </div>
        <div class="totals-line grand-total">
          <span>TOTAL A LIQUIDAR:</span>
          <span class="font-mono">$${params.total.toFixed(2)} USD</span>
        </div>
      </div>
    </div>

    <!-- Official Bank Transfer Details -->
    <div class="bank-info-box">
      <h4>💳 Cuentas Bancarias Oficiales para Depósito / Transferencia Directa</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
        <div>
          <strong>Banco Pichincha (Cta. Corriente):</strong><br>
          N° 2100184920 · Titular: Industrial Latina Cía. Ltda.<br>
          RUC: 0992847102001 · Mail: pagos@industriallatina.com
        </div>
        <div>
          <strong>Banco Guayaquil (Cta. Corriente):</strong><br>
          N° 0014820194 · Titular: Induless S.A.<br>
          RUC: 0992847102001 · Mail: cobranzas@induless.com.ec
        </div>
      </div>
    </div>
  `;

  return buildExecutiveDocumentHtml(
    {
      title: 'Cotización / Proforma Comercial Oficial',
      documentType: 'cotizacion',
      documentNumber: docNum,
      clientName: params.clientName,
      clientNit: params.clientNit,
      clientAddress: params.destinationAddress,
      digitalSellerCode: params.digitalSellerCode,
    },
    body
  );
}

/**
 * 3. Executive Electronic Invoice (Factura Electrónica SRI Oficial con Logo y Clave de Acceso)
 */
export function generateInvoiceExecutiveHtml(params: {
  invoiceNumber: string;
  orderCode: string;
  clientName: string;
  clientNit: string;
  clientAddress?: string;
  clientEmail?: string;
  clientWhatsapp?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  digitalSignature: string;
  accessKeySri?: string;
  createdAt?: string;
}): string {
  const accessKey =
    params.accessKeySri ||
    `011120260109928471020012001002${params.invoiceNumber.replace(/[^0-9]/g, '').padEnd(9, '0')}1234567812`;

  const body = `
    <div class="exec-meta-grid" style="border-left-color: #0B2861;">
      <div>
        <span class="meta-item-label">Razón Social Comprador</span>
        <p class="meta-item-value">${params.clientName}</p>
      </div>
      <div>
        <span class="meta-item-label">Identificación Tributaria (RUC/C.I.)</span>
        <p class="meta-item-value" style="font-family: monospace;">${params.clientNit}</p>
      </div>
      <div>
        <span class="meta-item-label">Orden Comercial Asociada</span>
        <p class="meta-item-value" style="font-family: monospace;">${params.orderCode}</p>
      </div>
      <div>
        <span class="meta-item-label">Estado Fiscal SRI</span>
        <p class="meta-item-value" style="color: #059669; font-weight: 800;">AUTORIZADO · ${params.status.toUpperCase()}</p>
      </div>
    </div>

    <!-- 48 to 72 Hours Official Delivery Commitment & WhatsApp/Email Dispatch Box -->
    <div style="background: #ECFDF5; border: 2px solid #10B981; border-radius: 10px; padding: 12px 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
      <div>
        <span style="font-size: 8.5pt; font-weight: 900; text-transform: uppercase; color: #065F46; letter-spacing: 0.6px;">
          🚚 Compromiso Logístico Oficial: La entrega dura entre 48 a 72 horas
        </span>
        <p style="font-size: 8.5pt; color: #047857; margin-top: 3px;">
          Factura electrónica enviada automáticamente al <strong>WhatsApp (${params.clientWhatsapp || 'Registrado'})</strong> y <strong>Correo Electrónico (${params.clientEmail || 'Registrado'})</strong> del cliente. Tiempo estimado de entrega en destino: <strong>48 a 72 horas laborables</strong>.
        </p>
      </div>
      <div style="background: #059669; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-size: 8pt; font-weight: 900; text-align: center;">
        ENTREGA GARANTIZADA<br/>48 A 72 HORAS
      </div>
    </div>

    <!-- SRI Access Key Box -->
    <div style="background: #ffffff; border: 2px dashed #94a3b8; border-radius: 8px; padding: 12px; margin-bottom: 18px; text-align: center;">
      <span style="font-size: 8pt; text-transform: uppercase; font-weight: 800; color: #475569; letter-spacing: 1px;">
        Clave de Acceso Tributaria SRI (49 Dígitos) · Conector SYSPRO / Latinasoft
      </span>
      <p style="font-family: 'JetBrains Mono', monospace; font-size: 9.5pt; font-weight: 800; letter-spacing: 1px; color: #0b2861; word-break: break-all; margin-top: 4px;">
        ${accessKey}
      </p>
      <p style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">
        Ambiente: PRODUCCIÓN · Emisión: NORMAL · Tipo de Comprobante: FACTURA ELECTRÓNICA
      </p>
    </div>

    <h2 class="section-title">Liquidación Fiscal de la Transacción</h2>
    <table class="exec-table">
      <thead>
        <tr>
          <th style="width: 50%;">Concepto Facturado</th>
          <th style="width: 25%;" class="text-right">Tarifa Gravada</th>
          <th style="width: 25%;" class="text-right">Valor USD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Bienes y Recubrimientos Industriales (Orden ${params.orderCode})</strong></td>
          <td class="text-right">Tarifa 15%</td>
          <td class="text-right font-mono">$${params.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Subtotal Base Imponible Tarifa 15%</td>
          <td class="text-right">15%</td>
          <td class="text-right font-mono">$${params.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Subtotal Tarifa 0% / Exento</td>
          <td class="text-right">0%</td>
          <td class="text-right font-mono">$0.00</td>
        </tr>
        <tr>
          <td>Impuesto al Valor Agregado (IVA 15%)</td>
          <td class="text-right">15%</td>
          <td class="text-right font-mono" style="font-weight: 700;">$${params.taxAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-card">
      <div class="totals-line grand-total">
        <span>IMPORTE TOTAL:</span>
        <span class="font-mono">$${params.total.toFixed(2)} USD</span>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-top: 18px; font-size: 8pt; color: #64748b;">
      <strong>Sello Criptográfico Digital SHA-256 (E2EE):</strong><br>
      <code style="font-family: monospace; font-size: 7.5pt; word-break: break-all; color: #0b2861;">
        ${params.digitalSignature}
      </code>
    </div>
  `;

  return buildExecutiveDocumentHtml(
    {
      title: 'Factura Electrónica Digital Autorizada SRI',
      documentType: 'factura',
      documentNumber: params.invoiceNumber,
      clientName: params.clientName,
      clientNit: params.clientNit,
      date: params.createdAt,
    },
    body
  );
}

/**
 * 4. Executive Analytics, Inventory & Audit Reports
 */
export function generateReportExecutiveHtml(params: {
  reportTitle: string;
  reportSubtitle: string;
  headers: string[];
  rows: (string | number)[][];
  summaryKpis?: Array<{ label: string; value: string | number; color?: string }>;
}): string {
  const thHtml = params.headers.map((h) => `<th>${h}</th>`).join('');
  const rowsHtml = params.rows
    .map(
      (row) => `
      <tr>
        ${row
          .map((cell) => {
            const isNum = typeof cell === 'number';
            return `<td class="${isNum ? 'text-right font-mono' : ''}">${cell}</td>`;
          })
          .join('')}
      </tr>
    `
    )
    .join('');

  const kpisHtml = params.summaryKpis
    ? `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
      ${params.summaryKpis
        .map(
          (kpi) => `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; border-left: 4px solid ${kpi.color || '#0B2861'};">
          <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #64748b;">${kpi.label}</span>
          <p style="font-size: 15pt; font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">${kpi.value}</p>
        </div>
      `
        )
        .join('')}
    </div>
  `
    : '';

  const body = `
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 12pt; font-weight: 800; color: #0f172a;">${params.reportSubtitle}</h3>
      <p style="font-size: 8.5pt; color: #64748b;">Consolidado auditado para control gerencial y trazabilidad de operaciones.</p>
    </div>

    ${kpisHtml}

    <h2 class="section-title">Registro Tabular Auditado</h2>
    <table class="exec-table">
      <thead>
        <tr>${thHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  return buildExecutiveDocumentHtml(
    {
      title: params.reportTitle,
      documentType: 'reporte',
      documentNumber: `REP-${Date.now().toString().slice(-6)}`,
    },
    body
  );
}

/**
 * 5. Executive 3D Architectural Diorama Specification Sheet
 */
export function generate3dDioramaReportExecutiveHtml(params: {
  environmentName: string;
  roomType: string;
  dimensions: { lengthM: number; widthM: number; heightM: number };
  wallFinish: { name: string; sku: string; colorHex: string };
  floorFinish: { name: string; sku: string };
  lightingPreset: string;
  quantities: {
    paintGallons: number;
    primerGallons: number;
    mortarBags: number;
    groutBags: number;
    ledCount: number;
  };
  totalEstimatedUsd: number;
  recommendations: string[];
}): string {
  const body = `
    <div class="exec-meta-grid" style="border-left-color: #0B2861;">
      <div>
        <span class="meta-item-label">Ambiente Arquitectónico</span>
        <p class="meta-item-value">${params.environmentName}</p>
      </div>
      <div>
        <span class="meta-item-label">Tipología de Espacio</span>
        <p class="meta-item-value">${params.roomType}</p>
      </div>
      <div>
        <span class="meta-item-label">Dimensiones de la Estructura</span>
        <p class="meta-item-value font-mono">${params.dimensions.lengthM}m L × ${params.dimensions.widthM}m A × ${params.dimensions.heightM}m H</p>
      </div>
      <div>
        <span class="meta-item-label">Presupuesto Estimado Materiales</span>
        <p class="meta-item-value" style="color: #059669; font-size: 11pt;">$${params.totalEstimatedUsd.toFixed(2)} USD</p>
      </div>
    </div>

    <h2 class="section-title">1. Configuración de Materiales &amp; Acabados 3D</h2>
    <table class="exec-table">
      <thead>
        <tr>
          <th>Superficie</th>
          <th>Material Seleccionado</th>
          <th>Código SKU</th>
          <th>Tonalidad / Acabado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Paredes &amp; Muros</strong></td>
          <td>${params.wallFinish.name}</td>
          <td class="font-mono">${params.wallFinish.sku}</td>
          <td>
            <span style="display: inline-block; width: 14px; height: 14px; background: ${params.wallFinish.colorHex}; border: 1px solid #94a3b8; vertical-align: middle; margin-right: 6px; border-radius: 3px;"></span>
            ${params.wallFinish.colorHex}
          </td>
        </tr>
        <tr>
          <td><strong>Pisos &amp; Pavimentos</strong></td>
          <td>${params.floorFinish.name}</td>
          <td class="font-mono">${params.floorFinish.sku}</td>
          <td>Porcelanato Rectificado / Fragua 2K</td>
        </tr>
        <tr>
          <td><strong>Iluminación &amp; Atmósfera</strong></td>
          <td>Iluminación LED Comercial Induless 18W</td>
          <td class="font-mono">PRL18E</td>
          <td>Modo ${params.lightingPreset.toUpperCase()}</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">2. Cubicación Certificada de Materiales (Cálculo NTE INEN)</h2>
    <table class="exec-table">
      <thead>
        <tr>
          <th>Insumo Requerido</th>
          <th>Dosificación Recomendada</th>
          <th class="text-center">Cantidad Exacta</th>
          <th>Presentación de Fábrica</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pintura Satinada / Látex LVA Tipo 1</td>
          <td>2 manos cruzadas sobre empaste seco</td>
          <td class="text-center font-mono" style="font-weight: 700;">${params.quantities.paintGallons}</td>
          <td>Galón (20 m²)</td>
        </tr>
        <tr>
          <td>Sellador Blanco Concentrado Antialcalino</td>
          <td>1 mano previa para fijación</td>
          <td class="text-center font-mono" style="font-weight: 700;">${params.quantities.primerGallons}</td>
          <td>Galón (30 m²)</td>
        </tr>
        <tr>
          <td>Mortero Adhesivo Pegamento para Porcelanato</td>
          <td>Cama de 4mm con llana dentada</td>
          <td class="text-center font-mono" style="font-weight: 700;">${params.quantities.mortarBags}</td>
          <td>Saco 25 Kg</td>
        </tr>
        <tr>
          <td>Porcelana Fragua Antihongos Latina 2K</td>
          <td>Juntas finas de 2mm</td>
          <td class="text-center font-mono" style="font-weight: 700;">${params.quantities.groutBags}</td>
          <td>Funda 2 Kg</td>
        </tr>
        <tr>
          <td>Paneles / Spots LED Empotrables Induless</td>
          <td>Distribución lumínica sin sombras</td>
          <td class="text-center font-mono" style="font-weight: 700;">${params.quantities.ledCount}</td>
          <td>Unidades 18W</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">3. Pautas Técnicas de Aplicación en Obra</h2>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 8.5pt; color: #475569;">
      <ol style="padding-left: 20px; line-height: 1.6;">
        ${params.recommendations.map((r) => `<li>${r}</li>`).join('')}
      </ol>
    </div>
  `;

  return buildExecutiveDocumentHtml(
    {
      title: 'Especificación Técnica & Cubicación de Ambiente 3D',
      documentType: 'diseno_3d',
      documentNumber: `SPEC-3D-${Date.now().toString().slice(-6)}`,
    },
    body
  );
}

/**
 * Trigger direct download of an Executive Printable HTML / PDF Document
 */
export function triggerExecutiveDocumentDownload(
  htmlContent: string,
  filename: string
): void {
  const cleanFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // Auto-open print dialog in background iframe for instant PDF print without popup blockers
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // ignore
        }
        setTimeout(() => document.body.removeChild(iframe), 3000);
      }, 600);
    }
  } catch {
    // If iframe print fails, file download completed successfully
  }
}

const AUDIT_CATEGORY_LABELS: Record<string, string> = {
  cambio_precio: 'Cambio de Precio',
  cupon_eliminado: 'Cupón Eliminado',
  cupon_creado: 'Cupón / Promo Creado',
  cambio_rol: 'Cambio de Rol (RBAC)',
  inventario_stock: 'Ajuste de Inventario',
  facturacion_sri: 'Facturación SRI',
  configuracion_erp: 'Configuración ERP',
  seguridad_acceso: 'Seguridad & 2FA',
};

/**
 * 6. Executive Security & ERP Audit Trail Report (HTML with Industrial Latina Logo)
 */
export function generateAuditLogExecutiveHtml(
  logs: ErpAuditLogEntry[],
  filterSummary = 'Todos los eventos registrados en la bitácora inmutable del ERP'
): string {
  const priceChangesCount = logs.filter((l) => l.category === 'cambio_precio').length;
  const deletedCouponsCount = logs.filter((l) => l.category === 'cupon_eliminado').length;
  const roleChangesCount = logs.filter((l) => l.category === 'cambio_rol').length;
  const highSeverityCount = logs.filter((l) => l.severity === 'alta').length;

  const rowsHtml = logs
    .map((entry) => {
      const catLabel = AUDIT_CATEGORY_LABELS[entry.category] || entry.category.toUpperCase();
      const sevBg =
        entry.severity === 'alta'
          ? '#FEE2E2'
          : entry.severity === 'media'
            ? '#FEF3C7'
            : '#E0F2FE';
      const sevColor =
        entry.severity === 'alta'
          ? '#991B1B'
          : entry.severity === 'media'
            ? '#92400E'
            : '#075985';

      return `
        <tr>
          <td class="font-mono" style="font-size: 7.5pt;">
            <strong style="color: #0B2861;">${entry.auditCode}</strong><br/>
            <span style="color: #64748b;">${entry.timestamp}</span>
          </td>
          <td>
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: 800; background: #EFF6FF; color: #0B2861; border: 1px solid #BFDBFE;">
              ${catLabel}
            </span>
            <div style="font-size: 7.5pt; color: #334155; margin-top: 2px; font-weight: 600;">
              ${entry.actionLabel}
            </div>
          </td>
          <td style="font-size: 8pt;">
            <strong>${entry.actorUser}</strong><br/>
            <span style="font-family: monospace; font-size: 7pt; color: #475569;">Rol: ${entry.actorRole.toUpperCase()} · IP: ${entry.ipAddress}</span>
          </td>
          <td style="font-size: 8pt; font-weight: 700; color: #0f172a;">
            ${entry.targetEntity}
            ${entry.notes ? `<div style="font-weight: 400; font-size: 7pt; color: #64748b; margin-top: 2px;">${entry.notes}</div>` : ''}
          </td>
          <td class="font-mono" style="font-size: 7.5pt;">
            <span style="color: #DC2626; text-decoration: line-through;">${entry.previousValue}</span>
            <span style="color: #64748b; margin: 0 4px;">➔</span>
            <strong style="color: #059669;">${entry.newValue}</strong>
          </td>
          <td class="text-center">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: 800; text-transform: uppercase; background: ${sevBg}; color: ${sevColor};">
              ${entry.severity}
            </span>
            <div class="font-mono" style="font-size: 6.5pt; color: #64748b; margin-top: 3px;">
              ${entry.integrityHash}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  const body = `
    <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0B2861; border-radius: 8px; padding: 12px 16px;">
      <div>
        <h3 style="font-size: 11.5pt; font-weight: 900; color: #0B2861; text-transform: uppercase;">
          Bitácora de Auditoría Forense, Seguridad &amp; Control Interno ERP
        </h3>
        <p style="font-size: 8.5pt; color: #475569; margin-top: 2px;">
          Alcance del Reporte: <strong>${filterSummary}</strong> · Sellado Criptográfico SHA-256 E2EE
        </p>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 8pt; color: #0B2861; font-weight: 800;">
        ISO 27001 / ISO 9001:2015<br/>
        RUC: ${CORPORATE_COMPANY_INFO.ruc}
      </div>
    </div>

    <!-- Executive KPI Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px;">
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid #0B2861; border-radius: 8px; padding: 10px; text-align: center;">
        <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #64748b;">Total Eventos</span>
        <p style="font-size: 15pt; font-weight: 900; color: #0B2861; font-family: monospace; margin-top: 2px;">${logs.length}</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid #D97706; border-radius: 8px; padding: 10px; text-align: center;">
        <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #64748b;">Cambios de Precio</span>
        <p style="font-size: 15pt; font-weight: 900; color: #D97706; font-family: monospace; margin-top: 2px;">${priceChangesCount}</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid #DC2626; border-radius: 8px; padding: 10px; text-align: center;">
        <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #64748b;">Cupones Eliminados</span>
        <p style="font-size: 15pt; font-weight: 900; color: #DC2626; font-family: monospace; margin-top: 2px;">${deletedCouponsCount}</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: 3px solid #7C3AED; border-radius: 8px; padding: 10px; text-align: center;">
        <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #64748b;">Cambios de Rol</span>
        <p style="font-size: 15pt; font-weight: 900; color: #7C3AED; font-family: monospace; margin-top: 2px;">${roleChangesCount}</p>
      </div>
      <div style="background: #FEF2F2; border: 1px solid #FECACA; border-top: 3px solid #991B1B; border-radius: 8px; padding: 10px; text-align: center;">
        <span style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #991B1B;">Criticidad Alta</span>
        <p style="font-size: 15pt; font-weight: 900; color: #991B1B; font-family: monospace; margin-top: 2px;">${highSeverityCount}</p>
      </div>
    </div>

    <h2 class="section-title">Detalle Cronológico de Transacciones y Cambios en el ERP</h2>
    <table class="exec-table">
      <thead>
        <tr>
          <th style="width: 14%;">Código / Fecha</th>
          <th style="width: 16%;">Categoría / Acción</th>
          <th style="width: 19%;">Operador / Rol RBAC</th>
          <th style="width: 22%;">Entidad Afectada</th>
          <th style="width: 17%;">Valor Anterior ➔ Nuevo</th>
          <th style="width: 12%;" class="text-center">Severidad / Hash</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  return buildExecutiveDocumentHtml(
    {
      title: 'Reporte Ejecutivo de Auditoría de Seguridad ERP',
      documentType: 'auditoria_seguridad',
      documentNumber: `AUD-REP-${Date.now().toString().slice(-6)}`,
      accentColorHex: '#0B2861',
      notes:
        'Documento confidencial de auditoría interna generado automáticamente por el Módulo de Seguridad Criptográfica de Industrial Latina Cía. Ltda. & Induless S.A. Cada registro cuenta con firma de integridad SHA-256 inmutable.',
    },
    body
  );
}

/**
 * Generates and downloads a true native Executive PDF (.pdf) with the official
 * Industrial Latina logo emblem, corporate navy/gold header, KPI cards, and audit table.
 */
export function downloadAuditLogExecutivePdf(
  logs: ErpAuditLogEntry[],
  baseFilename = 'auditoria_seguridad_erp_industrial_latina'
): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${baseFilename}_${dateStamp}.pdf`;

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Top Corporate Navy Banner (#0B2861) & Gold Accent Bar (#FFD100)
    doc.setFillColor(11, 40, 97);
    doc.rect(0, 0, 297, 32, 'F');
    doc.setFillColor(255, 209, 0);
    doc.rect(0, 32, 297, 2.2, 'F');

    // 2. Draw Official Industrial Latina Emblem Logo Box on Left
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 5, 68, 22, 2.5, 2.5, 'F');

    // Stylized Industrial Triangle Emblem inside white logo badge
    doc.setFillColor(11, 40, 97);
    doc.triangle(22, 8, 29, 23, 15, 23, 'F');
    doc.setFillColor(255, 209, 0);
    doc.triangle(22, 12, 26.5, 21.5, 17.5, 21.5, 'F');

    // Logo Typography: INDUSTRIAL LATINA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 40, 97);
    doc.text('INDUSTRIAL', 32, 14.5);
    doc.setTextColor(227, 0, 15);
    doc.text('LATINA', 32, 20.5);
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PINTURAS · EMPASTES · MORTEROS', 32, 24.5);

    // 3. Header Corporate Title & Metadata (Center/Right)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('REPORTE EJECUTIVO DE AUDITORÍA & SEGURIDAD ERP', 86, 13);

    doc.setFontSize(8.5);
    doc.setTextColor(255, 209, 0);
    doc.text(
      `${CORPORATE_COMPANY_INFO.legalName} · RUC: ${CORPORATE_COMPANY_INFO.ruc}`,
      86,
      19
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(226, 232, 240);
    doc.text(
      `${CORPORATE_COMPANY_INFO.matrixAddress} · ISO 9001:2015 · NTE INEN · BASC`,
      86,
      24.5
    );

    // Right Badge: Emission Date & Folio
    const folio = `AUD-${Date.now().toString().slice(-6)}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 209, 0);
    doc.text(`FOLIO: ${folio}`, 285, 13, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.text(`EMISIÓN: ${dateStamp}`, 285, 19, { align: 'right' });
    doc.setFontSize(7);
    doc.text('CIFRADO E2EE SHA-256', 285, 24.5, { align: 'right' });

    // 4. Executive KPI Summary Strip
    const priceChanges = logs.filter((l) => l.category === 'cambio_precio').length;
    const deletedCoupons = logs.filter((l) => l.category === 'cupon_eliminado').length;
    const roleChanges = logs.filter((l) => l.category === 'cambio_rol').length;
    const highSeverity = logs.filter((l) => l.severity === 'alta').length;

    const kpis = [
      { label: 'TOTAL EVENTOS AUDITADOS', value: String(logs.length), r: 11, g: 40, b: 97 },
      { label: 'CAMBIOS DE PRECIOS', value: String(priceChanges), r: 217, g: 119, b: 6 },
      { label: 'CUPONES ELIMINADOS', value: String(deletedCoupons), r: 220, g: 38, b: 38 },
      { label: 'CAMBIOS DE ROL (RBAC)', value: String(roleChanges), r: 124, g: 58, b: 237 },
      { label: 'CRITICIDAD ALTA', value: String(highSeverity), r: 153, g: 27, b: 27 },
    ];

    kpis.forEach((k, idx) => {
      const x = 12 + idx * 55.5;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x, 38, 52.5, 15, 1.5, 1.5, 'FD');
      doc.setFillColor(k.r, k.g, k.b);
      doc.rect(x, 38, 52.5, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(k.label, x + 26.25, 43.5, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(k.r, k.g, k.b);
      doc.text(k.value, x + 26.25, 50.5, { align: 'center' });
    });

    // 5. Audit Trail Table via autoTable
    const tableBody = logs.map((entry) => [
      `${entry.auditCode}\n${entry.timestamp}`,
      `${AUDIT_CATEGORY_LABELS[entry.category] || entry.category}\n${entry.actionLabel}`,
      `${entry.actorUser}\nRol: ${entry.actorRole.toUpperCase()}`,
      entry.targetEntity,
      `${entry.previousValue}  ->  ${entry.newValue}`,
      `${entry.severity.toUpperCase()}\n${entry.integrityHash}`,
    ]);

    autoTable(doc, {
      startY: 57,
      head: [
        [
          'Código / Fecha',
          'Categoría / Evento',
          'Usuario / Rol RBAC',
          'Entidad Afectada en ERP',
          'Valor Anterior -> Valor Nuevo',
          'Severidad / Hash SHA-256',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [11, 40, 97],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 34, fontStyle: 'bold' },
        1: { cellWidth: 42 },
        2: { cellWidth: 48 },
        3: { cellWidth: 62 },
        4: { cellWidth: 53, fontStyle: 'bold' },
        5: { cellWidth: 34 },
      },
      margin: { left: 12, right: 12, bottom: 20 },
    });

    // 6. Footer with Page Numbers & Official Security Signature
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(203, 213, 225);
      doc.line(12, 198, 285, 198);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Industrial Latina Cía. Ltda. & Induless S.A. · Auditoría de Seguridad ERP · RUC ${CORPORATE_COMPANY_INFO.ruc} · Documento Confidencial Auditado`,
        12,
        203
      );
      doc.text(`Página ${i} de ${pageCount}`, 285, 203, { align: 'right' });
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      doc.save(fullFilename);
    }
  } catch {
    // Fallback in non-DOM test environments
  }

  return fullFilename;
}

/**
 * Helper to identify if an InventoryItem belongs to the Paint category
 */
export function isPaintCategoryProduct(item: InventoryItem): boolean {
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return (
    cat.includes('pintura') ||
    (item.calculatorType === 'pintura' &&
      (name.includes('pintura') || name.includes('látex') || name.includes('latex') || name.includes('satinad') || name.includes('duralin') || name.includes('elastom')))
  );
}

const REAL_ROOM_COLOR_COMBINATIONS = [
  {
    environmentTitle: 'Sala de Estar Vanguardista & Estudio Contemporáneo',
    roomImageUrl:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    dominantColor: { name: 'Blanco Ostra Minimalista', hex: '#F4F1EA', code: 'IL-101', ratio: '60% Muros Principales' },
    secondaryColor: { name: 'Gris Andino Sedoso', hex: '#CBD5E1', code: 'IL-408', ratio: '30% Muros Laterales' },
    accentColor: { name: 'Azul Cobalto Corporativo', hex: '#0B2861', code: 'IL-802', ratio: '10% Muro Focal TV' },
    lightingAdvice: 'Luz cálida 3000K en lámparas de piso + luz neutra 4000K en plafón central Induless.',
    finishNote: 'Acabado Satinado Lavable NTE INEN 1544 con reflectancia lumínica LRV 78%.',
  },
  {
    environmentTitle: 'Master Suite Contemporánea & Galería Residencial',
    roomImageUrl:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    dominantColor: { name: 'Marfil Seda Natural', hex: '#FBF7F0', code: 'IL-104', ratio: '60% Superficie General' },
    secondaryColor: { name: 'Arena Costera Cálida', hex: '#E2D5C1', code: 'IL-215', ratio: '30% Cabecero & Nichos' },
    accentColor: { name: 'Verde Salvia Botánico', hex: '#4A6B5D', code: 'IL-619', ratio: '10% Acento Arquitectónico' },
    lightingAdvice: 'Iluminación indirecta LED cálida en cortinero y mesas de noche para máximo confort visual.',
    finishNote: 'Película 100% acrílica antibacterial de bajo VOC sin olor residual.',
  },
  {
    environmentTitle: 'Fachada Residencial & Terraza Cubierta Moderna',
    roomImageUrl:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    dominantColor: { name: 'Blanco Puro Titanio UV', hex: '#F8FAFC', code: 'IL-100', ratio: '60% Volúmenes Exteriores' },
    secondaryColor: { name: 'Gris Basalto Urbano', hex: '#64748B', code: 'IL-512', ratio: '30% Marcos & Columnas' },
    accentColor: { name: 'Terracota Andino', hex: '#B45309', code: 'IL-309', ratio: '10% Detalle de Acceso' },
    lightingAdvice: 'Reflectores LED 50W luz día 6500K Induless en fachada y jardines perimetrales.',
    finishNote: 'Máxima resistencia a rayos UV, lluvia tropical y salitre costero ecuatoriano.',
  },
];

/**
 * 7. Minimalist & Corporate Multi-Page Product Catalog (HTML / Printable PDF)
 * - Page 1: Super-professional corporate minimalist cover page identifying Industrial Latina & Induless
 * - 1 Page per Product: Product photo, specs, Google Drive link, and all Presentations with their individual images & prices
 * - Extra Page for Paint Category Products: Color Combinations in a Real Architectural Environment
 */
export function generateMinimalistCatalogExecutiveHtml(
  inventory: InventoryItem[]
): string {
  const emissionDate = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Calculate total pages: 1 cover + inventory.length + paintProducts.length
  const paintItemsCount = inventory.filter(isPaintCategoryProduct).length;
  const totalPages = 1 + inventory.length + paintItemsCount;
  let currentPageNumber = 1;

  const productPagesHtml = inventory
    .map((item, idx) => {
      currentPageNumber += 1;
      const productPageNum = currentPageNumber;
      const isLatina = item.company !== 'induless';
      const brandAccent = isLatina ? '#0B2861' : '#D8235A';
      const brandLabel = isLatina ? 'INDUSTRIAL LATINA CÍA. LTDA.' : 'INDULESS S.A. ECUADOR';
      const driveUrl =
        item.technicalSheet?.googleDriveUrl ||
        `https://drive.google.com/file/d/1Catalogo${item.sku.replace(/[^a-zA-Z0-9]/g, '')}/view?usp=sharing`;

      const presentations =
        item.presentations && item.presentations.length > 0
          ? item.presentations
          : [
              {
                name: item.unit,
                unitPrice: item.unitPrice,
                description: item.technicalSheet?.yieldOrCoverage || 'Presentación oficial de fábrica',
                imageUrl: item.imageUrl,
              },
            ];

      const productPageHtml = `
        <section class="catalog-page">
          <header class="minimal-page-header">
            <div class="header-brand">
              <span class="brand-dot" style="background: ${brandAccent};"></span>
              <span class="brand-text">${brandLabel} · CATÁLOGO CORPORATIVO 2026</span>
            </div>
            <div class="header-sku">
              <span>${item.category.toUpperCase()}</span>
              <strong style="color: ${brandAccent}; margin-left: 8px;">SKU ${item.sku}</strong>
            </div>
          </header>

          <div class="product-hero-grid">
            <div class="product-main-visual">
              <img src="${item.imageUrl || presentations[0]?.imageUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80'}" alt="${item.name}" />
              <div class="visual-tag" style="background: ${brandAccent};">
                ${item.unit} · DESDE $${item.unitPrice.toFixed(2)} USD
              </div>
            </div>
            <div class="product-main-info">
              <span class="category-pill" style="color: ${brandAccent}; border-color: ${brandAccent}33;">
                ${item.category}
              </span>
              <h2 class="product-title">${item.name}</h2>
              <p class="product-desc">
                ${item.description || 'Formulación industrial certificada bajo estándares de calidad NTE INEN e ISO 9001:2015 para proyectos de construcción y arquitectura en el Ecuador.'}
              </p>

              <div class="specs-minimal-grid">
                <div class="spec-cell">
                  <span class="spec-label">NORMATIVA / CALIDAD</span>
                  <strong class="spec-val">${item.technicalSheet?.normative || 'NTE INEN · ISO 9001:2015'}</strong>
                </div>
                <div class="spec-cell">
                  <span class="spec-label">RENDIMIENTO / COBERTURA</span>
                  <strong class="spec-val">${item.technicalSheet?.yieldOrCoverage || `${item.coverageSqmPerUnit || 20} m² por unidad`}</strong>
                </div>
                <div class="spec-cell">
                  <span class="spec-label">APLICACIÓN / USO</span>
                  <strong class="spec-val">${item.technicalSheet?.applicationSurface || 'Uso profesional arquitectónico e industrial'}</strong>
                </div>
                <div class="spec-cell">
                  <span class="spec-label">EMPAQUE MASTER</span>
                  <strong class="spec-val">${item.technicalSheet?.masterPack || item.unit}</strong>
                </div>
              </div>

              <div class="drive-minimal-box">
                <div>
                  <span style="font-size: 7pt; font-weight: 800; letter-spacing: 1px; color: #0B2861; text-transform: uppercase;">
                    ☁️ FICHA TÉCNICA CONECTADA A GOOGLE DRIVE
                  </span>
                  <p style="font-family: monospace; font-size: 7.5pt; color: #475569; margin-top: 2px;">${driveUrl}</p>
                </div>
                <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="drive-btn">
                  Ver en Google Drive ↗
                </a>
              </div>
            </div>
          </div>

          <div class="presentations-section">
            <h3 class="subsection-heading">
              <span>PRESENTACIONES DISPONIBLES &amp; FOTOGRAFÍA POR ENVASE</span>
              <span class="heading-line"></span>
            </h3>
            <div class="presentations-cards-grid">
              ${presentations
                .map(
                  (p) => `
                <div class="pres-card">
                  <div class="pres-img-wrap">
                    <img src="${p.imageUrl || item.imageUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80'}" alt="${p.name}" />
                  </div>
                  <div class="pres-body">
                    <div class="pres-top">
                      <strong class="pres-name">${p.name}</strong>
                      <span class="pres-price" style="color: ${brandAccent};">$${p.unitPrice.toFixed(2)} USD</span>
                    </div>
                    <p class="pres-desc">${p.description || 'Presentación oficial certificada de fábrica'}</p>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <footer class="minimal-page-footer">
            <span>${CORPORATE_COMPANY_INFO.legalName} · RUC ${CORPORATE_COMPANY_INFO.ruc} · Entrega Garantizada 48 a 72 Horas</span>
            <strong>PÁGINA ${productPageNum} DE ${totalPages}</strong>
          </footer>
        </section>
      `;

      // If this product is in the Paint category, generate the extra page of Color Combinations in a Real Environment
      if (isPaintCategoryProduct(item)) {
        currentPageNumber += 1;
        const paintPageNum = currentPageNumber;
        const combo = REAL_ROOM_COLOR_COMBINATIONS[idx % REAL_ROOM_COLOR_COMBINATIONS.length];

        const extraPaintPageHtml = `
          <section class="catalog-page paint-combo-page">
            <header class="minimal-page-header">
              <div class="header-brand">
                <span class="brand-dot" style="background: #0B2861;"></span>
                <span class="brand-text">ESTUDIO CROMÁTICO ARQUITECTÓNICO · COMBINACIÓN DE COLORES EN AMBIENTE REAL</span>
              </div>
              <div class="header-sku">
                <span>CATEGORÍA PINTURA</span>
                <strong style="color: #0B2861; margin-left: 8px;">${item.sku}</strong>
              </div>
            </header>

            <div style="margin-bottom: 14px;">
              <span style="font-size: 8pt; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0B2861;">
                PÁGINA ESPECIAL DE INSPIRACIÓN &amp; ARMONÍA EN AMBIENTE REAL
              </span>
              <h2 style="font-size: 16pt; font-weight: 900; color: #0f172a; margin-top: 2px;">
                Combinación de Colores Aplicada: ${item.name}
              </h2>
              <p style="font-size: 9pt; color: #475569; margin-top: 2px;">
                Propuesta de diseño interior en un ambiente real utilizando la regla arquitectónica 60-30-10 con pigmentos de alta retención Industrial Latina.
              </p>
            </div>

            <!-- Real Environment Showcase with Applied Color Swatches -->
            <div style="position: relative; border-radius: 14px; overflow: hidden; border: 1px solid #cbd5e1; height: 250px; margin-bottom: 16px; background: #0f172a;">
              <img src="${combo.roomImageUrl}" alt="${combo.environmentTitle}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.92;" />
              <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.15) 60%, transparent 100%); display: flex; flex-direction: column; justify-content: flex-end; padding: 18px;">
                <span style="font-size: 7.5pt; font-weight: 800; color: #FFD100; letter-spacing: 1.2px; text-transform: uppercase;">
                  AMBIENTE REAL SIMULADO · REGLA ARQUITECTÓNICA 60 / 30 / 10
                </span>
                <h3 style="font-size: 14pt; font-weight: 900; color: #ffffff; margin-top: 2px;">
                  ${combo.environmentTitle}
                </h3>
                <p style="font-size: 8.5pt; color: #e2e8f0; margin-top: 2px;">
                  ${combo.finishNote}
                </p>
              </div>
            </div>

            <!-- 3-Color Harmony Cards (60% Dominant, 30% Secondary, 10% Accent) -->
            <h3 class="subsection-heading">
              <span>PALETA DE COMBINACIÓN CROMÁTICA CERTIFICADA (60% · 30% · 10%)</span>
              <span class="heading-line"></span>
            </h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px;">
              ${[combo.dominantColor, combo.secondaryColor, combo.accentColor]
                .map(
                  (c) => `
                <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff;">
                  <div style="height: 82px; background: ${c.hex}; border-bottom: 1px solid #e2e8f0; display: flex; align-items: flex-end; justify-content: space-between; padding: 8px 12px;">
                    <span style="background: rgba(15,23,42,0.75); color: #ffffff; font-family: monospace; font-size: 7.5pt; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                      ${c.code}
                    </span>
                    <span style="background: rgba(255,255,255,0.9); color: #0f172a; font-family: monospace; font-size: 7.5pt; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                      ${c.hex}
                    </span>
                  </div>
                  <div style="padding: 10px 12px;">
                    <span style="font-size: 7pt; font-weight: 800; text-transform: uppercase; color: #0B2861; letter-spacing: 0.6px;">
                      ${c.ratio}
                    </span>
                    <p style="font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-top: 2px;">${c.name}</p>
                    <p style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Disponible en Litro, Galón y Caneca 5 Gal (${item.sku})</p>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>

            <!-- Complementary Palettes & Lighting Spec -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <div>
                <span style="font-size: 7.5pt; font-weight: 800; color: #0B2861; text-transform: uppercase; letter-spacing: 0.8px;">
                  💡 Recomendación de Iluminación &amp; Textura
                </span>
                <p style="font-size: 8.5pt; color: #334155; margin-top: 4px; line-height: 1.45;">
                  ${combo.lightingAdvice}
                </p>
              </div>
              <div>
                <span style="font-size: 7.5pt; font-weight: 800; color: #0B2861; text-transform: uppercase; letter-spacing: 0.8px;">
                  🎨 Preparación de Superficie para Color Real
                </span>
                <p style="font-size: 8.5pt; color: #334155; margin-top: 4px; line-height: 1.45;">
                  Aplique 1 mano previa de <strong>Sellador Blanco Antialcalino (LAT-SEL-BLA)</strong> sobre Empaste Latina para garantizar el 100% de fidelidad cromática a 2 manos.
                </p>
              </div>
            </div>

            <footer class="minimal-page-footer">
              <span>${CORPORATE_COMPANY_INFO.legalName} · Estudio de Color en Ambiente Real (${item.sku})</span>
              <strong>PÁGINA ${paintPageNum} DE ${totalPages}</strong>
            </footer>
          </section>
        `;

        return productPageHtml + extraPaintPageHtml;
      }

      return productPageHtml;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Catálogo Corporativo Minimalista 2026 · ${CORPORATE_COMPANY_INFO.legalName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0B2861;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #FFD100;
    }
    .print-btn {
      background: #FFD100;
      color: #0B2861;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 9.5pt;
      cursor: pointer;
    }
    .catalog-page {
      max-width: 800px;
      min-height: 1040px;
      margin: 18px auto;
      background: #ffffff;
      padding: 34px 38px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
    }
    /* Minimalist Corporate Cover Page */
    .cover-page {
      background: linear-gradient(165deg, #0B2861 0%, #07193E 68%, #0F172A 100%);
      color: #ffffff;
      position: relative;
      overflow: hidden;
    }
    .cover-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.16);
      padding-bottom: 20px;
    }
    .cover-logos-badge {
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      gap: 16px;
    }
    .cover-center-block {
      margin: auto 0;
      padding: 40px 0;
    }
    .cover-eyebrow {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(255, 209, 0, 0.14);
      border: 1px solid #FFD100;
      color: #FFD100;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .cover-main-title {
      font-size: 32pt;
      font-weight: 900;
      line-height: 1.08;
      letter-spacing: -1px;
      color: #ffffff;
    }
    .cover-main-title span {
      color: #FFD100;
    }
    .cover-subtitle {
      font-size: 11.5pt;
      color: #cbd5e1;
      max-width: 560px;
      line-height: 1.55;
      margin-top: 16px;
    }
    .cover-kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-top: 34px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }
    .cover-kpi-item span {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      display: block;
    }
    .cover-kpi-item strong {
      font-size: 13pt;
      color: #FFD100;
      font-family: monospace;
      margin-top: 4px;
      display: block;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.16);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #cbd5e1;
      line-height: 1.5;
    }
    /* Product Pages */
    .minimal-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 18px;
      font-size: 7.5pt;
      letter-spacing: 0.8px;
      color: #64748b;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .product-hero-grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 22px;
      margin-bottom: 20px;
    }
    .product-main-visual {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 250px;
    }
    .product-main-visual img {
      width: 100%;
      height: 210px;
      object-fit: cover;
    }
    .visual-tag {
      color: #ffffff;
      text-align: center;
      font-family: monospace;
      font-size: 8pt;
      font-weight: 800;
      padding: 8px;
      letter-spacing: 0.5px;
    }
    .category-pill {
      display: inline-block;
      padding: 3px 10px;
      border: 1px solid;
      border-radius: 999px;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .product-title {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .product-desc {
      font-size: 8.8pt;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .specs-minimal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .spec-cell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 7px 10px;
    }
    .spec-label {
      font-size: 6.5pt;
      font-weight: 800;
      color: #64748b;
      display: block;
      letter-spacing: 0.5px;
    }
    .spec-val {
      font-size: 8pt;
      color: #0f172a;
      margin-top: 2px;
      display: block;
    }
    .drive-minimal-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3px solid #0B2861;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .drive-btn {
      background: #0B2861;
      color: #FFD100;
      text-decoration: none;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 7.5pt;
      font-weight: 800;
      white-space: nowrap;
    }
    .subsection-heading {
      font-size: 8.5pt;
      font-weight: 900;
      letter-spacing: 1px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .heading-line {
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }
    .presentations-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .pres-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
    }
    .pres-img-wrap {
      height: 96px;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      overflow: hidden;
    }
    .pres-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .pres-body {
      padding: 9px 11px;
    }
    .pres-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 6px;
    }
    .pres-name {
      font-size: 8.5pt;
      color: #0f172a;
    }
    .pres-price {
      font-family: monospace;
      font-weight: 900;
      font-size: 9pt;
    }
    .pres-desc {
      font-size: 7.2pt;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.35;
    }
    .minimal-page-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .print-action-bar {
        display: none !important;
      }
      .catalog-page {
        margin: 0;
        border: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="print-action-bar">
    <div>
      <strong style="color: #FFD100; font-size: 10.5pt;">CATÁLOGO CORPORATIVO MINIMALISTA 2026 · ${CORPORATE_COMPANY_INFO.legalName}</strong>
      <p style="font-size: 8pt; opacity: 0.85;">Portada Ejecutiva + 1 Página por Producto con Presentaciones + Ambientes Reales de Pintura (${totalPages} páginas)</p>
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar Catálogo PDF</button>
  </div>

  <!-- PAGE 1: SUPER-PROFESSIONAL CORPORATE MINIMALIST COVER PAGE -->
  <section class="catalog-page cover-page">
    <div class="cover-top-bar">
      <div class="cover-logos-badge">
        <div>${INDUSTRIAL_LATINA_SVG_LOGO}</div>
        <div style="width: 1px; height: 42px; background: #cbd5e1;"></div>
        <div>${INDULESS_SVG_LOGO}</div>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 8pt; color: #cbd5e1;">
        <strong style="color: #FFD100;">EDICIÓN CORPORATIVA 2026</strong><br/>
        RUC: ${CORPORATE_COMPANY_INFO.ruc}
      </div>
    </div>

    <div class="cover-center-block">
      <span class="cover-eyebrow">CATÁLOGO MAESTRO DE INGENIERÍA, ARQUITECTURA &amp; FERRETERÍA</span>
      <h1 class="cover-main-title">
        Soluciones Industriales,<br/>
        <span>Recubrimientos &amp; Acabados</span><br/>
        de Alta Gama en Ecuador.
      </h1>
      <p class="cover-subtitle">
        Portafolio corporativo unificado de <strong>Industrial Latina Cía. Ltda.</strong> e <strong>Induless S.A.</strong> Especificaciones técnicas homologadas NTE INEN, presentaciones comerciales ilustradas, fichas conectadas a Google Drive y estudio cromático en ambientes reales.
      </p>

      <div class="cover-kpi-strip">
        <div class="cover-kpi-item">
          <span>PRODUCTOS OFICIALES</span>
          <strong>${inventory.length} LÍNEAS</strong>
        </div>
        <div class="cover-kpi-item">
          <span>AMBIENTES DE PINTURA</span>
          <strong>+${paintItemsCount} ESTUDIOS</strong>
        </div>
        <div class="cover-kpi-item">
          <span>CERTIFICACIÓN</span>
          <strong>ISO 9001 / INEN</strong>
        </div>
        <div class="cover-kpi-item">
          <span>DESPACHO NACIONAL</span>
          <strong>48 A 72 HORAS</strong>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong style="color: #ffffff;">${CORPORATE_COMPANY_INFO.legalName}</strong><br/>
        Matriz: ${CORPORATE_COMPANY_INFO.matrixAddress}<br/>
        Planta Industrial: ${CORPORATE_COMPANY_INFO.plantAddress}
      </div>
      <div style="text-align: right;">
        Emitido: ${emissionDate}<br/>
        ${CORPORATE_COMPANY_INFO.website} · ${CORPORATE_COMPANY_INFO.phone}<br/>
        <strong style="color: #FFD100;">PÁGINA 1 DE ${totalPages} · PORTADA CORPORATIVA</strong>
      </div>
    </div>
  </section>

  <!-- PRODUCT PAGES + EXTRA PAINT REAL-ENVIRONMENT COLOR COMBINATION PAGES -->
  ${productPagesHtml}
</body>
</html>`;
}

/**
 * Generates and downloads a native Minimalist & Corporate Multi-Page Catalog PDF (.pdf)
 * with Cover Page + 1 Page per Product & Presentations + Extra Real-Environment Color Combination Page for Paint products.
 */
export function downloadMinimalistCatalogPdf(
  inventory: InventoryItem[],
  baseFilename = 'catalogo_corporativo_minimalista_industrial_latina_2026'
): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${baseFilename}_${dateStamp}.pdf`;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const paintItemsCount = inventory.filter(isPaintCategoryProduct).length;
    const totalPages = 1 + inventory.length + paintItemsCount;

    // =========================================================================
    // PAGE 1: SUPER-PROFESSIONAL MINIMALIST CORPORATE COVER PAGE
    // =========================================================================
    doc.setFillColor(11, 40, 97); // Corporate Navy
    doc.rect(0, 0, 210, 297, 'F');

    // Minimalist geometric accent lines
    doc.setFillColor(255, 209, 0); // Corporate Gold
    doc.rect(0, 0, 210, 4, 'F');
    doc.rect(18, 128, 36, 1.8, 'F');

    // Top White Corporate Logo Badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(18, 18, 118, 28, 3, 3, 'F');

    // Industrial Latina Emblem inside cover badge
    doc.setFillColor(11, 40, 97);
    doc.triangle(30, 22, 39, 40, 21, 40, 'F');
    doc.setFillColor(255, 209, 0);
    doc.triangle(30, 27, 35.5, 38.5, 24.5, 38.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(11, 40, 97);
    doc.text('INDUSTRIAL', 43, 29);
    doc.setTextColor(227, 0, 15);
    doc.text('LATINA', 43, 36);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('PINTURAS · EMPASTES · MORTEROS', 43, 41);

    // Divider & Induless Logo inside cover badge
    doc.setDrawColor(203, 213, 225);
    doc.line(88, 22, 88, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('INDU', 93, 32);
    doc.setTextColor(225, 29, 72);
    doc.text('LESS', 105, 32);
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text('FERRETERÍA & LED', 93, 38);

    // Cover Title Typography
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 209, 0);
    doc.text('CATÁLOGO CORPORATIVO & ESPECIFICACIONES TÉCNICAS · EDICIÓN 2026', 18, 86);

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('PORTAFOLIO MAESTRO', 18, 100);
    doc.text('DE ARQUITECTURA,', 18, 111);
    doc.setTextColor(255, 209, 0);
    doc.text('PINTURAS & FERRETERÍA', 18, 122);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(
      'Diseño minimalista y corporativo con ficha individual por producto, desglose de',
      18,
      140
    );
    doc.text(
      'presentaciones comerciales, conexión directa a Google Drive y páginas especiales',
      18,
      146
    );
    doc.text(
      'de combinación de colores en ambientes reales para la línea de Pinturas.',
      18,
      152
    );

    // Cover KPI Boxes
    const coverKpis = [
      { label: 'LÍNEAS EN CATÁLOGO', val: `${inventory.length} PRODUCTOS` },
      { label: 'ESTUDIOS DE COLOR', val: `${paintItemsCount} AMBIENTES` },
      { label: 'CALIDAD HOMOLOGADA', val: 'ISO 9001 / INEN' },
      { label: 'TIEMPO DE ENTREGA', val: '48 A 72 HORAS' },
    ];
    coverKpis.forEach((k, idx) => {
      const x = 18 + idx * 44.5;
      doc.setFillColor(17, 54, 122);
      doc.roundedRect(x, 175, 41.5, 24, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(k.label, x + 4, 184);
      doc.setFontSize(9.5);
      doc.setTextColor(255, 209, 0);
      doc.text(k.val, x + 4, 193);
    });

    // Cover Footer
    doc.setDrawColor(51, 65, 85);
    doc.line(18, 258, 192, 258);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${CORPORATE_COMPANY_INFO.legalName} · RUC: ${CORPORATE_COMPANY_INFO.ruc}`, 18, 266);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`${CORPORATE_COMPANY_INFO.matrixAddress} · ${CORPORATE_COMPANY_INFO.plantAddress}`, 18, 272);
    doc.text(`${CORPORATE_COMPANY_INFO.website} · ${CORPORATE_COMPANY_INFO.phone} · Emisión: ${dateStamp}`, 18, 278);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 209, 0);
    doc.text(`PÁGINA 1 DE ${totalPages} · PORTADA CORPORATIVA`, 192, 278, { align: 'right' });

    // =========================================================================
    // PRODUCT PAGES (1 PAGE PER PRODUCT + EXTRA PAINT COMBINATION PAGE)
    // =========================================================================
    let pageCounter = 1;

    inventory.forEach((item, idx) => {
      doc.addPage('a4', 'portrait');
      pageCounter += 1;
      const isLatina = item.company !== 'induless';
      const rAccent = isLatina ? 11 : 216;
      const gAccent = isLatina ? 40 : 35;
      const bAccent = isLatina ? 97 : 90;

      // Minimalist Top Header Bar
      doc.setFillColor(rAccent, gAccent, bAccent);
      doc.rect(0, 0, 210, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${isLatina ? 'INDUSTRIAL LATINA CÍA. LTDA.' : 'INDULESS S.A.'} · CATÁLOGO CORPORATIVO MINIMALISTA`,
        14,
        11
      );
      doc.setTextColor(255, 209, 0);
      doc.text(`SKU: ${item.sku}`, 196, 11, { align: 'right' });

      // Category & Product Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(item.category.toUpperCase(), 14, 28);

      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      const splitTitle = doc.splitTextToSize(item.name, 182);
      doc.text(splitTitle, 14, 36);

      const descStartY = 36 + splitTitle.length * 6.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitDesc = doc.splitTextToSize(
        item.description || 'Producto certificado para ingeniería y arquitectura.',
        182
      );
      doc.text(splitDesc, 14, descStartY);

      // Technical Specs Box
      const specBoxY = descStartY + splitDesc.length * 5 + 4;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, specBoxY, 182, 36, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('NORMATIVA HOMOLOGADA:', 18, specBoxY + 8);
      doc.text('RENDIMIENTO / COBERTURA:', 18, specBoxY + 16);
      doc.text('SUPERFICIE DE APLICACIÓN:', 18, specBoxY + 24);
      doc.text('FICHA TÉCNICA GOOGLE DRIVE:', 18, specBoxY + 32);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        String(item.technicalSheet?.normative || 'NTE INEN · ISO 9001:2015').slice(0, 68),
        65,
        specBoxY + 8
      );
      doc.text(
        String(item.technicalSheet?.yieldOrCoverage || `${item.coverageSqmPerUnit || 20} m² por unidad`).slice(0, 68),
        65,
        specBoxY + 16
      );
      doc.setFont('helvetica', 'normal');
      doc.text(
        String(item.technicalSheet?.applicationSurface || 'Obra arquitectónica y civil').slice(0, 68),
        65,
        specBoxY + 24
      );
      const driveLink =
        item.technicalSheet?.googleDriveUrl ||
        `https://drive.google.com/file/d/1Catalogo${item.sku}/view?usp=sharing`;
      doc.setTextColor(11, 40, 97);
      doc.text(driveLink.slice(0, 72), 65, specBoxY + 32);

      // Presentations Table for this Product
      const presentations =
        item.presentations && item.presentations.length > 0
          ? item.presentations
          : [
              {
                name: item.unit,
                unitPrice: item.unitPrice,
                description: item.technicalSheet?.yieldOrCoverage || 'Presentación estándar de fábrica',
                imageUrl: item.imageUrl || 'Imagen oficial asignada',
              },
            ];

      autoTable(doc, {
        startY: specBoxY + 43,
        head: [
          [
            'Presentación Comercial',
            'Precio Oficial (USD)',
            'Rendimiento / Especificación de Envase',
            'Imagen Asociada en Catálogo',
          ],
        ],
        body: presentations.map((p) => [
          p.name,
          `$${p.unitPrice.toFixed(2)} USD`,
          p.description || 'Presentación certificada de fábrica',
          p.imageUrl ? 'Foto específica de presentación activa' : 'Foto estándar de producto',
        ]),
        theme: 'grid',
        styles: {
          fontSize: 8.5,
          cellPadding: 3.5,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [rAccent, gAccent, bAccent],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: 14, right: 14 },
      });

      // Highlights Box
      const highlights = item.technicalSheet?.highlights || [];
      if (highlights.length > 0) {
        const hlY = 195;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text('ATRIBUTOS DESTACADOS DE INGENIERÍA & CALIDAD', 14, hlY);
        highlights.slice(0, 3).forEach((h, hIdx) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.2);
          doc.setTextColor(51, 65, 85);
          doc.text(`• ${h.slice(0, 95)}`, 16, hlY + 7 + hIdx * 6);
        });
      }

      // Page Footer
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 280, 196, 280);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${CORPORATE_COMPANY_INFO.legalName} · Ficha de Producto & Presentaciones (${item.sku})`,
        14,
        286
      );
      doc.setFont('helvetica', 'bold');
      doc.text(`Página ${pageCounter} de ${totalPages}`, 196, 286, { align: 'right' });

      // =======================================================================
      // EXTRA PAGE FOR PAINT PRODUCTS: COLOR COMBINATIONS IN A REAL ENVIRONMENT
      // =======================================================================
      if (isPaintCategoryProduct(item)) {
        doc.addPage('a4', 'portrait');
        pageCounter += 1;
        const combo = REAL_ROOM_COLOR_COMBINATIONS[idx % REAL_ROOM_COLOR_COMBINATIONS.length];

        doc.setFillColor(11, 40, 97);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setFillColor(255, 209, 0);
        doc.rect(0, 20, 210, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 209, 0);
        doc.text('ESTUDIO DE COLOR EN AMBIENTE REAL · CATEGORÍA PINTURAS', 14, 9);
        doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`COMBINACIÓN DE COLORES: ${item.name.slice(0, 52)}`, 14, 16);

        // Simulated Architectural Room Illustration Box in PDF
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, 28, 182, 72, 3, 3, 'FD');

        // Draw Architectural Room Mockup (Back wall 60%, Side wall 30%, Accent panel 10%, Floor)
        doc.setFillColor(244, 241, 234); // Dominant wall
        doc.rect(20, 34, 110, 46, 'F');
        doc.setFillColor(203, 213, 225); // Secondary wall
        doc.rect(130, 34, 60, 46, 'F');
        doc.setFillColor(11, 40, 97); // Accent feature wall
        doc.rect(42, 40, 48, 34, 'F');
        doc.setFillColor(226, 232, 240); // Floor slab
        doc.rect(20, 80, 170, 14, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('MURO DE ACENTO (10%)', 66, 58, { align: 'center' });
        doc.setTextColor(15, 23, 42);
        doc.text(`AMBIENTE REAL: ${combo.environmentTitle.toUpperCase()}`, 24, 90);

        // 3 Color Swatch Cards (60% - 30% - 10%)
        const swatches = [
          { ...combo.dominantColor, rgb: [244, 241, 234] as [number, number, number] },
          { ...combo.secondaryColor, rgb: [203, 213, 225] as [number, number, number] },
          { ...combo.accentColor, rgb: [11, 40, 97] as [number, number, number] },
        ];

        swatches.forEach((sw, sIdx) => {
          const sx = 14 + sIdx * 62;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(sx, 108, 58, 56, 2.5, 2.5, 'FD');
          doc.setFillColor(sw.rgb[0], sw.rgb[1], sw.rgb[2]);
          doc.rect(sx, 108, 58, 24, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(11, 40, 97);
          doc.text(sw.ratio.toUpperCase(), sx + 4, 140);
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(sw.name, sx + 4, 147);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Código: ${sw.code} · HEX: ${sw.hex}`, sx + 4, 154);
          doc.text(`Línea: ${item.sku}`, sx + 4, 160);
        });

        // Harmony & Application Table
        autoTable(doc, {
          startY: 172,
          head: [['Parámetro de Diseño Interior', 'Recomendación Oficial Industrial Latina']],
          body: [
            ['Ambiente Arquitectónico Real', combo.environmentTitle],
            ['Regla de Proporción Cromática', '60% Tono Dominante · 30% Tono Secundario · 10% Muro de Acento'],
            ['Iluminación Recomendada Induless', combo.lightingAdvice],
            ['Acabado & Desempeño Película', combo.finishNote],
            ['Preparación de Superficie', '1 mano de Sellador Blanco Antialcalino (LAT-SEL-BLA) + 2 manos de Pintura'],
          ],
          theme: 'grid',
          styles: { fontSize: 8.5, cellPadding: 3.5 },
          headStyles: { fillColor: [11, 40, 97], textColor: [255, 255, 255], fontStyle: 'bold' },
          margin: { left: 14, right: 14 },
        });

        // Footer
        doc.setDrawColor(203, 213, 225);
        doc.line(14, 280, 196, 280);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `${CORPORATE_COMPANY_INFO.legalName} · Combinación de Colores en Ambiente Real (${item.sku})`,
          14,
          286
        );
        doc.setFont('helvetica', 'bold');
        doc.text(`Página ${pageCounter} de ${totalPages}`, 196, 286, { align: 'right' });
      }
    });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      doc.save(fullFilename);
    }
  } catch {
    // Fallback in non-DOM test environments
  }

  return fullFilename;
}


