import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Invoice, InvoiceStatus, Order, UserRole } from '../types/erp';
import {
  calculateInvoiceAmounts,
  generateDigitalSignature,
  getPermissionsForRole,
} from '../utils/erpLogic';
import {
  exportDataset,
  generateInvoiceExecutiveHtml,
  triggerExecutiveDocumentDownload,
} from '../utils/downloadHelper';

interface InvoicesViewProps {
  invoices: Invoice[];
  orders: Order[];
  currentRole: UserRole;
  onCreateManualInvoice: (newInv: {
    orderCode: string;
    clientName: string;
    clientNit: string;
    subtotal: number;
  }) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onStatusBanner: (msg: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  orders,
  currentRole,
  onCreateManualInvoice,
  onUpdateInvoiceStatus,
  onStatusBanner,
}) => {
  const permissions = getPermissionsForRole(currentRole);

  const [selectedOrderCode, setSelectedOrderCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientNit, setClientNit] = useState('');
  const [subtotal, setSubtotal] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<Invoice | null>(null);

  const computedPreview = calculateInvoiceAmounts(subtotal);

  const handleOrderSelectChange = (code: string) => {
    setSelectedOrderCode(code);
    const matchingOrder = orders.find((o) => o.orderCode === code);
    if (matchingOrder) {
      setClientName(matchingOrder.clientName);
      setClientNit(matchingOrder.clientNit);
      setSubtotal(Math.round((matchingOrder.unitPrice * matchingOrder.quantity) * 100) / 100);
    }
  };

  const handleEmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!permissions.canIssueInvoice) {
      setFormError('Su rol actual no cuenta con permisos fiscales para emitir facturas digitales.');
      return;
    }
    if (clientName.trim().length < 2 || clientNit.trim().length < 4) {
      setFormError('Complete la razón social y el NIT / RFC fiscal del receptor.');
      return;
    }
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      setFormError('El subtotal antes de impuestos debe ser mayor a USD 0.00.');
      return;
    }

    onCreateManualInvoice({
      orderCode: selectedOrderCode,
      clientName: clientName.trim(),
      clientNit: clientNit.trim(),
      subtotal: Number(subtotal),
    });
  };

  const handleDownloadSingleInvoicePdf = (inv: Invoice) => {
    const filename = `factura_${inv.invoiceNumber.toLowerCase()}`;
    const invoiceHtml = generateInvoiceExecutiveHtml({
      invoiceNumber: inv.invoiceNumber,
      orderCode: inv.orderCode,
      clientName: inv.clientName,
      clientNit: inv.clientNit,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      status: inv.status,
      digitalSignature: inv.digitalSignature,
      createdAt: inv.createdAt,
    });
    triggerExecutiveDocumentDownload(invoiceHtml, filename);
    onStatusBanner(`Comprobante fiscal ejecutivo descargado con logotipo oficial y sello SRI: ${filename}.html`);
  };

  const handleExportAllInvoices = (format: 'pdf' | 'excel' | 'csv') => {
    const headers = [
      'Folio Factura',
      'Orden Asociada',
      'Cliente Receptor',
      'NIT / RFC',
      'Subtotal USD',
      'IVA 16% USD',
      'Total USD',
      'Estado',
      'Sello Digital SHA256',
    ];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.orderCode,
      inv.clientName,
      inv.clientNit,
      inv.subtotal,
      inv.taxAmount,
      inv.total,
      inv.status,
      inv.digitalSignature,
    ]);
    const filename = exportDataset(
      format,
      'facturacion_digital_industrial_latina',
      'Industrial Latina - Libro de Facturacion Electronica Digital',
      `Total comprobantes emitidos: ${invoices.length}`,
      headers,
      rows
    );
    onStatusBanner(`Libro de facturación exportado en ${format.toUpperCase()}: ${filename}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Timbrado Fiscal Electrónico CFDI 4.0 / FE · Sello Criptográfico SHA-256 · Exportación PDF, Excel y CSV
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Emisión de Facturas Digitales y Control Tributario
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleExportAllInvoices('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Libro PDF
          </button>
          <button
            type="button"
            onClick={() => handleExportAllInvoices('excel')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => handleExportAllInvoices('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Digital Invoice Issuance Form */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Emitir Nuevo Comprobante Fiscal Digital
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Genera firma electrónica SHA-256 inmediata y envía copia automática por correo y WhatsApp al cliente.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            Certificado Fiscal Activo
          </span>
        </div>

        {formError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800">
            {formError}
          </div>
        )}

        <form onSubmit={handleEmitInvoice} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label htmlFor="inv-order-code" className="block text-xs font-semibold text-slate-700 mb-1">
              Vincular a Pedido Comercial
            </label>
            <select
              id="inv-order-code"
              value={selectedOrderCode}
              onChange={(e) => handleOrderSelectChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.orderCode}>
                  {o.orderCode} — {o.clientName}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="inv-client-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Razón Social del Receptor
            </label>
            <input
              id="inv-client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="inv-client-nit" className="block text-xs font-semibold text-slate-700 mb-1">
              NIT / RUC / RFC
            </label>
            <input
              id="inv-client-nit"
              type="text"
              value={clientNit}
              onChange={(e) => setClientNit(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="inv-subtotal" className="block text-xs font-semibold text-slate-700 mb-1">
              Subtotal Neto (USD)
            </label>
            <input
              id="inv-subtotal"
              type="number"
              min={1}
              step="0.01"
              value={subtotal}
              onChange={(e) => setSubtotal(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Timbrar Factura
            </button>
          </div>

          <div className="md:col-span-12 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
              <span>Subtotal: USD {computedPreview.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>·</span>
              <span>IVA (16%): USD {computedPreview.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>·</span>
              <span className="font-bold text-slate-900">
                Total Fiscal: USD {computedPreview.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="font-mono text-slate-500">
              Pre-sello: {generateDigitalSignature('FE-NEXT', clientNit || 'NIT', computedPreview.total)}
            </span>
          </div>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Folio Fiscal</th>
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Cliente / NIT</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">IVA (16%)</th>
                <th className="py-3 px-4 text-right">Total (USD)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Sello Criptográfico</th>
                <th className="py-3 px-4 text-right">Descarga / Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{inv.orderCode}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{inv.clientName}</div>
                    <div className="font-mono text-slate-500">{inv.clientNit}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${inv.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${inv.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        inv.status === 'pagada'
                          ? 'text-emerald-700'
                          : inv.status === 'emitida'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 max-w-44 truncate" title={inv.digitalSignature}>
                    {inv.digitalSignature}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {inv.status === 'emitida' && (
                        <button
                          type="button"
                          onClick={() => onUpdateInvoiceStatus(inv.id, 'pagada')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Marcar Pagada
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoicePreview(inv)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 whitespace-nowrap shrink-0"
                      >
                        Ver Detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleInvoicePdf(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Certificate Modal */}
      {selectedInvoicePreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
          className="fixed inset-0 z-[9999] modal-layer-top flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white border-2 border-[#0B2861] rounded-3xl max-w-xl w-full p-6 space-y-4 skeuo-modal-3d">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-mono text-slate-500">
                  COMPROBANTE FISCAL DIGITAL CERTIFICADO · INDUSTRIAL LATINA S.A.
                </p>
                <h3 id="invoice-modal-title" className="text-lg font-bold text-slate-900 mt-1">
                  Factura Electrónica {selectedInvoicePreview.invoiceNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoicePreview(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-slate-500">Receptor Corporativo</p>
                <p className="font-bold text-slate-900 mt-0.5">{selectedInvoicePreview.clientName}</p>
                <p className="font-mono text-slate-600">NIT: {selectedInvoicePreview.clientNit}</p>
              </div>
              <div>
                <p className="text-slate-500">Referencia Comercial</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">
                  Pedido: {selectedInvoicePreview.orderCode}
                </p>
                <p className="text-slate-600">Estado: {selectedInvoicePreview.status.toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono tabular-nums border-t border-b border-slate-200 py-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal Base Gravable:</span>
                <span>USD {selectedInvoicePreview.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Impuesto al Valor Agregado (16%):</span>
                <span>USD {selectedInvoicePreview.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>Total Comprobante Fiscal:</span>
                <span>USD {selectedInvoicePreview.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-xs">
              <p className="font-semibold text-slate-700">Sello Criptográfico E2EE SHA-256:</p>
              <p className="font-mono text-slate-600 bg-slate-100 p-2 rounded mt-1 break-all">
                {selectedInvoicePreview.digitalSignature}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoicePreview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cerrar Vista
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSingleInvoicePdf(selectedInvoicePreview)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar PDF Oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
