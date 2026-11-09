import { buildCsvContent, buildExcelXmlContent, buildPdfDocumentStream } from './erpLogic';
import {
  generateReportExecutiveHtml,
  triggerExecutiveDocumentDownload,
  generateTechnicalSheetExecutiveHtml,
  generateQuotationExecutiveHtml,
  generateInvoiceExecutiveHtml,
  generate3dDioramaReportExecutiveHtml,
  generateAuditLogExecutiveHtml,
  downloadAuditLogExecutivePdf,
  CORPORATE_COMPANY_INFO,
} from './executiveDocumentGenerator';

export {
  generateTechnicalSheetExecutiveHtml,
  generateQuotationExecutiveHtml,
  generateInvoiceExecutiveHtml,
  generateReportExecutiveHtml,
  generate3dDioramaReportExecutiveHtml,
  generateAuditLogExecutiveHtml,
  downloadAuditLogExecutivePdf,
  triggerExecutiveDocumentDownload,
  CORPORATE_COMPANY_INFO,
};

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportDataset(
  format: 'csv' | 'excel' | 'pdf',
  baseFilename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][]
): string {
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const csv = buildCsvContent(headers, rows);
    const filename = `${baseFilename}_${dateStamp}.csv`;
    triggerFileDownload(filename, csv, 'text/csv;charset=utf-8;');
    return filename;
  }

  if (format === 'excel') {
    const xls = buildExcelXmlContent(title, headers, rows);
    const filename = `${baseFilename}_${dateStamp}.xls`;
    triggerFileDownload(filename, xls, 'application/vnd.ms-excel;charset=utf-8;');
    return filename;
  }

  // Format === 'pdf': Generate Executive Document with Company Logos, Certified Stamps & Printable Grid
  const executiveHtml = generateReportExecutiveHtml({
    reportTitle: title,
    reportSubtitle: subtitle,
    headers,
    rows,
    summaryKpis: [
      { label: 'Total de Registros', value: rows.length, color: '#0B2861' },
      { label: 'Fecha de Emisión', value: dateStamp, color: '#059669' },
      { label: 'Entidad Emisora', value: 'Industrial Latina & Induless', color: '#D8235A' },
    ],
  });

  const filename = `${baseFilename}_ejecutivo_${dateStamp}`;
  triggerExecutiveDocumentDownload(executiveHtml, filename);

  // Also build PDF stream as secondary binary backup
  const pdfLines = [
    headers.join(' | '),
    ...rows.map((r) => r.map((c) => String(c)).join(' | ')),
  ];
  const pdf = buildPdfDocumentStream(title, subtitle, pdfLines);
  triggerFileDownload(`${baseFilename}_${dateStamp}.pdf`, pdf, 'application/pdf');

  return `${filename}.pdf`;
}
