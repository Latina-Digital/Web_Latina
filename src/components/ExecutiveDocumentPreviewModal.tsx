import React from 'react';
import {
  Download,
  Printer,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { triggerExecutiveDocumentDownload } from '../utils/executiveDocumentGenerator';

interface ExecutiveDocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  title?: string;
  documentHtml: string;
  filename: string;
}

export const ExecutiveDocumentPreviewModal: React.FC<
  ExecutiveDocumentPreviewModalProps
> = ({ isOpen, onClose, documentTitle, title, documentHtml, filename }) => {
  const displayTitle = documentTitle || title || 'Documento Corporativo Oficial';
  if (!isOpen) return null;

  const handlePrint = () => {
    try {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(documentHtml);
        doc.close();
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch {
            // ignore
          }
          setTimeout(() => document.body.removeChild(printIframe), 3000);
        }, 500);
      }
    } catch {
      window.print();
    }
  };

  const handleDownload = () => {
    triggerExecutiveDocumentDownload(documentHtml, filename);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="executive-doc-title"
      className="fixed inset-0 z-[9999] modal-layer-top flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[94vh] flex flex-col shadow-2xl border-2 border-[#0B2861] overflow-hidden skeuo-modal-3d">
        {/* Executive Modal Header Bar */}
        <header className="relative overflow-hidden px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0B2861] via-[#133A85] to-[#0B2861] text-white flex items-center justify-between gap-3 border-b-4 border-[#FFD100] shrink-0">
          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner border border-white/20 shrink-0">
              <FileText className="w-5 h-5 text-[#FFD100]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFD100] text-[#0B2861]">
                  Formato Ejecutivo Certificado
                </span>
                <span className="text-[10px] text-blue-200 hidden sm:inline">
                  RUC: 0992847102001 · SRI Ecuador
                </span>
              </div>
              <h3
                id="executive-doc-title"
                className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5"
              >
                {displayTitle}
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer skeuo-btn-3d"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#FFD100]" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] text-xs font-black uppercase tracking-wide transition-all shadow-md cursor-pointer skeuo-btn-3d"
              title="Descargar archivo ejecutivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer ml-1 skeuo-btn-3d"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Live Document Render Iframe */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden flex flex-col items-center">
          <div className="w-full h-full max-w-[850px] bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden">
            <iframe
              srcDoc={documentHtml}
              title={documentTitle}
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-modals"
            />
          </div>
        </div>

        {/* Executive Modal Footer Bar */}
        <footer className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium">
              Documento con logotipos de Industrial Latina &amp; Induless, sellos INEN y validez oficial.
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Archivo: {filename.endsWith('.html') ? filename : `${filename}.html`}
          </span>
        </footer>
      </div>
    </div>
  );
};
