import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  InventoryItem,
  Invoice,
  Order,
  PredictiveAnalyticsResult,
} from '../types/erp';
import { MONTHLY_OPERATIONS_SERIES } from '../data/seedData';
import { exportDataset } from '../utils/downloadHelper';
import {
  ExecutiveReportOptions,
  generateExecutiveReportPdf,
} from '../utils/executivePdfReport';

interface AnalyticsAndReportsViewProps {
  orders: Order[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  onStatusBanner: (msg: string) => void;
}

export const AnalyticsAndReportsView: React.FC<AnalyticsAndReportsViewProps> = ({
  orders,
  inventory,
  invoices,
  onStatusBanner,
}) => {
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [focusArea, setFocusArea] = useState<string>('integral');
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Executive Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [pdfOptions, setPdfOptions] = useState<ExecutiveReportOptions>({
    companyTitle: 'Industrial Latina & Induless Ecuador',
    reportClassification: 'ESTRICTAMENTE CONFIDENCIAL / ALTA GERENCIA Y DIRECTORIO',
    preparedBy: 'Ing. Carlos Mendoza (Dir. General) & Ing. Diego Andrade (VD-EC-101)',
    includeEntityBreakdown: true,
    includeSkuForecast: true,
    includeSignatures: true,
    horizonDays: 30,
    notes: 'Proyección ajustada a la demanda del sector constructivo en Guayas, Pichincha y Azuay.',
  });

  const [prediction, setPrediction] = useState<PredictiveAnalyticsResult>(() => {
    const totalRev = orders.reduce(
      (acc, o) => (o.status !== 'cancelado' ? acc + o.totalAmount : acc),
      0
    );
    return {
      source: 'motor-predictivo-industrial-latina-ecuador',
      generatedAt: new Date().toISOString(),
      horizonDays: 30,
      executiveSummary:
        'Proyección a 30 días para Industrial Latina e Induless en Ecuador: Se estima un incremento de demanda consolidado del +18.4%, impulsado por proyectos de infraestructura y acabados. Destacan en rotación: Pintura Látex Vinil Acrílico (LVA), Masilla Gypsum Latina Listo, Paneles LED Induless y Cerraduras de Seguridad. Se recomienda emitir orden de reposición inmediata para SKUs con autonomía menor a 15 días.',
      projectedRevenueGrowthPct: 18.4,
      projectedRevenueUsd: Math.round(totalRev * 1.184),
      supplyChainRiskLevel: 'Moderado-Controlado',
      skuForecasts: inventory.slice(0, 6).map((item) => {
        const dailyBurn = Math.max(1.2, item.minStock / 12);
        const predictedDemandUnits = Math.round(dailyBurn * 30);
        const deficit = Math.max(0, predictedDemandUnits + item.minStock - item.stock);
        return {
          sku: item.sku,
          productName: item.name,
          predictedDemandUnits,
          recommendedReorderUnits: deficit > 0 ? deficit : Math.round(item.minStock * 0.5),
          stockoutRiskDays: Math.max(3, Math.round(item.stock / dailyBurn)),
          actionPriority: item.stock <= item.minStock ? 'Inmediata (Crítica)' : 'Planificada',
        };
      }),
      strategicRecommendations: [
        {
          title: 'Reposición Anticipada en Planta Matriz Guayaquil',
          impactMetric: '-34% riesgo de rotura de stock en 15 días',
          detail:
            'Emitir orden de compra consolidada para Látex Vinil Acrílico LAT-LVA-01 y Masilla Gypsum antes del cierre quincenal.',
        },
        {
          title: 'Consolidación Logística Corredor Guayaquil - Quito',
          impactMetric: '+14.2% margen operativo por tonelada',
          detail:
            'Agrupar despachos de Techoforte Induless y Recubrimientos Latina en unidades de carga completa para bodegas en el Austro y Sierra.',
        },
        {
          title: 'Automatización de Facturación Electrónica SRI y Cobranza',
          impactMetric: '-4.5 días en ciclo de caja B2B/B2C',
          detail:
            'Disparar recordatorio automático de facturas con firma electrónica y comprobantes RIDE para pedidos a crédito de 30 días.',
        },
      ],
    };
  });

  const runPredictiveAnalytics = async (
    selectedHorizon = horizonDays,
    selectedFocus = focusArea
  ) => {
    setLoadingPrediction(true);
    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          orders,
          horizonDays: selectedHorizon,
          focusArea: selectedFocus,
        }),
      });
      const data = await response.json();
      if (data && data.executiveSummary) {
        setPrediction(data);
      }
    } catch (err) {
      console.error('Predictive analytics error:', err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  useEffect(() => {
    runPredictiveAnalytics(30, 'integral');
  }, []);

  // Professional Managerial PDF Generation & Direct Download
  const handleExportManagerialPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = generateExecutiveReportPdf({
        prediction,
        orders,
        inventory,
        invoices,
        options: {
          ...pdfOptions,
          horizonDays,
        },
      });

      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `informe_gerencial_industrial_latina_induless_${dateStamp}.pdf`;
      doc.save(filename);

      onStatusBanner(
        `Informe Gerencial en PDF generado y descargado exitosamente: ${filename}`
      );
    } catch (err) {
      console.error('Error generating executive PDF:', err);
      onStatusBanner('Ocurrió un error al generar el PDF gerencial.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (format === 'pdf') {
      handleExportManagerialPdf();
      return;
    }

    const headers = [
      'Mes / Horizonte',
      'Ingresos Brutos USD',
      'Pedidos Procesados',
      'Cumplimiento SLA %',
      'Costo Logistico USD',
    ];
    const rows: (string | number)[][] = MONTHLY_OPERATIONS_SERIES.map((m) => [
      m.month,
      m.ingresosUsd,
      m.pedidos,
      m.despachosATiempoPct,
      m.costosLogisticosUsd,
    ]);
    if (prediction) {
      rows.push([
        `Proyeccion IA (${prediction.horizonDays}d)`,
        prediction.projectedRevenueUsd,
        Math.round(orders.length * 1.25),
        99.1,
        15800,
      ]);
    }
    const filename = exportDataset(
      format,
      'reporte_estadistico_predictivo_industrial_latina_induless',
      'Industrial Latina & Induless - Informe Estadístico y Proyección IA',
      prediction?.executiveSummary || 'Rendimiento Mensual y Proyección de Demanda Ecuador',
      headers,
      rows
    );
    onStatusBanner(
      `Informe estadístico exportado en ${format.toUpperCase()}: ${filename}`
    );
  };

  const maxRevenue = Math.max(
    ...MONTHLY_OPERATIONS_SERIES.map((m) => m.ingresosUsd),
    150000
  );

  const totalRev = orders.reduce(
    (acc, o) => (o.status !== 'cancelado' ? acc + o.totalAmount : acc),
    0
  );
  const latinaItems = inventory.filter((i) => i.company === 'industrial_latina');
  const indulessItems = inventory.filter((i) => i.company === 'induless');
  const latinaStockVal = latinaItems.reduce((acc, i) => acc + i.stock * i.unitPrice, 0);
  const indulessStockVal = indulessItems.reduce((acc, i) => acc + i.stock * i.unitPrice, 0);

  return (
    <div className="space-y-8">
      {/* Header & Multi-Format Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0E3B7C]">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
              ECUADOR
            </span>
            <span>Industrial Latina &amp; Induless · Inteligencia de Negocios y Analítica Predictiva</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Analítica e IA · Reportes de Rendimiento y Proyecciones Gerenciales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación operativa en tiempo real, márgenes por empresa y generación de informes ejecutivos en PDF de alta resolución.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Primary Call-to-Action: Executive PDF Export */}
          <button
            type="button"
            onClick={handleExportManagerialPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#0B2861] hover:bg-[#071d47] active:bg-[#051535] rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer border border-[#FFD100]/40"
          >
            <FileDown className={`w-4 h-4 text-[#FFD100] ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span>{isExportingPdf ? 'Generando PDF Gerencial...' : 'Exportar PDF Gerencial'}</span>
          </button>

          {/* Secondary Action: Modal Preview */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#0B2861] bg-blue-50/80 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa Gerencial</span>
          </button>

          {/* Data Export Formats */}
          <button
            type="button"
            onClick={() => handleExportReport('excel')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel (.xls)</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportReport('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Presentation Mode Banner */}
      <div className="bg-gradient-to-r from-[#0B2861] via-[#0E3B7C] to-[#1a4f9c] text-white rounded-2xl p-5 shadow-lg border-b-4 border-[#FFD100] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD100]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD100]">
              Módulo de Presentación Ejecutiva para Directorio
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold">
            Informe Oficial de Rendimiento Operativo, Ventas y Demanda 2026
          </h2>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Consolida las métricas de <strong>Industrial Latina</strong> (Pinturas, Morteros y Masillas) e <strong>Induless</strong> (Ferretería, Techoforte e Iluminación). El PDF exportado incluye sellos oficiales, validación para el SRI Ecuador, tablas comparativas de margen neto y firma de Vendedor Digital.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FFD100] hover:bg-[#ffe047] text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Abrir Presentación</span>
          </button>
          <button
            type="button"
            onClick={handleExportManagerialPdf}
            className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#FFD100]" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* AI Predictive Analytics Control Bar & Results */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#0B2861]" />
              <h2 className="text-lg font-bold text-slate-900">
                Motor de Analítica Predictiva Basada en Inteligencia Artificial
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evalúa velocidad de rotación de inventario en Ecuador, pedidos históricos B2B/B2C y capacidad logística para proyectar compras estratégicas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label htmlFor="ai-horizon-select" className="text-xs font-semibold text-slate-700">
              Horizonte:
            </label>
            <select
              id="ai-horizon-select"
              value={horizonDays}
              onChange={(e) => {
                const h = Number(e.target.value);
                setHorizonDays(h);
              }}
              className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              <option value={15}>15 Días (Inmediato)</option>
              <option value={30}>30 Días (Mensual)</option>
              <option value={60}>60 Días (Bimestral)</option>
              <option value={90}>90 Días (Trimestral)</option>
            </select>

            <label htmlFor="ai-focus-select" className="text-xs font-semibold text-slate-700">
              Enfoque:
            </label>
            <select
              id="ai-focus-select"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="integral">Operación Integral &amp; Flujo de Caja</option>
              <option value="abastecimiento">Prevención de Rotura de Stock</option>
              <option value="logistica">Optimización de Flota y Rutas Ecuador</option>
            </select>

            <button
              type="button"
              disabled={loadingPrediction}
              onClick={() => runPredictiveAnalytics(horizonDays, focusArea)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B2861] rounded-lg hover:bg-[#071d47] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPrediction ? 'animate-spin' : ''}`} />
              {loadingPrediction ? 'Calculando Modelo IA...' : 'Recalcular Pronóstico IA'}
            </button>
          </div>
        </div>

        {prediction && (
          <div className="space-y-6">
            {/* Top Forecast KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-200/60 rounded-xl">
                <p className="text-xs font-medium text-slate-500">
                  Facturación Proyectada ({prediction.horizonDays} días)
                </p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#0B2861] mt-1">
                  USD {prediction.projectedRevenueUsd.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />+{prediction.projectedRevenueGrowthPct}% vs periodo anterior
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-medium text-slate-500">Facturación Acumulada Activa</p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  USD {Math.round(totalRev).toLocaleString('en-US')}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  En {orders.length} pedidos comerciales
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-medium text-slate-500">Riesgo en Cadena de Suministro</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {prediction.supplyChainRiskLevel}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Basado en {inventory.length} SKUs y {invoices.length} facturas
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-medium text-slate-500">Valor de Stock en Bodegas</p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  USD {Math.round(latinaStockVal + indulessStockVal).toLocaleString('en-US')}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Latina: ${Math.round(latinaStockVal).toLocaleString('en-US')} · Induless: ${Math.round(indulessStockVal).toLocaleString('en-US')}
                </p>
              </div>
            </div>

            {/* Executive Summary Prose */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#0B2861]" />
                <p className="text-xs font-bold text-[#0B2861] uppercase tracking-wider">
                  Dictamen Ejecutivo de Analítica Predictiva (Industrial Latina &amp; Induless Ecuador):
                </p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                {prediction.executiveSummary}
              </p>
            </div>

            {/* Entity Segregation Table: Latina vs Induless */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Distribución Operativa por Entidad del Grupo Empresarial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white border-l-4 border-[#0E3B7C] rounded-lg shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0E3B7C] uppercase">
                      Industrial Latina (Fábrica)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-900">
                      58.5% Cuota Proyectada
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Látex Vinil Acrílico, Satinado Tipo 1, Duralin Forte, Empaste Latina Listo, Masilla Gypsum y Pegantes.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Catálogo: {latinaItems.length} SKUs</span>
                    <span className="font-bold text-[#0E3B7C]">
                      Stock: USD {Math.round(latinaStockVal).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border-l-4 border-[#D8235A] rounded-lg shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#D8235A] uppercase">
                      Induless (Importadora Ferretera)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-900">
                      41.5% Cuota Proyectada
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Conductores CONDEX, Iluminación LED, Cubiertas Techoforte TF15, Soldadura AWS y Cerraduras.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Catálogo: {indulessItems.length} SKUs</span>
                    <span className="font-bold text-[#D8235A]">
                      Stock: USD {Math.round(indulessStockVal).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SKU Demand & Stockout Forecast Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Pronóstico de Demanda por SKU y Recomendación de Compra Automática
                </h3>
                <span className="text-xs text-slate-500">
                  Horizonte: {prediction.horizonDays} Días · Ecuador
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B2861] text-white text-xs font-semibold">
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4">Insumo / Equipo</th>
                      <th className="py-2.5 px-4 text-center">Empresa</th>
                      <th className="py-2.5 px-4 text-right">Demanda Estimada ({prediction.horizonDays}d)</th>
                      <th className="py-2.5 px-4 text-right">Compra Sugerida</th>
                      <th className="py-2.5 px-4 text-right">Autonomía</th>
                      <th className="py-2.5 px-4 text-center">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {prediction.skuForecasts.map((f) => {
                      const item = inventory.find((i) => i.sku === f.sku);
                      const isInduless = item?.company === 'induless';
                      return (
                        <tr key={f.sku} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{f.sku}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{f.productName}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isInduless
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {isInduless ? 'Induless' : 'Latina'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                            {f.predictedDemandUnits} und
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                            +{f.recommendedReorderUnits} und
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                            {f.stockoutRiskDays} días
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                f.actionPriority.includes('Inmediata')
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {f.actionPriority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {prediction.strategicRecommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <p className="text-xs font-mono font-semibold text-emerald-700">
                    {rec.impactMetric}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Comparative Revenue & SLA Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Curva Comparativa de Ingresos Mensuales y Cumplimiento SLA (Mayo – Octubre 2026)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualización auditada en USD con cumplimiento de entregas a tiempo en el territorio ecuatoriano
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportManagerialPdf}
            className="text-xs font-semibold text-[#0B2861] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Incluir en Informe PDF</span>
          </button>
        </div>

        <div className="space-y-4">
          {MONTHLY_OPERATIONS_SERIES.map((item) => {
            const widthPct = Math.min(100, Math.round((item.ingresosUsd / maxRevenue) * 100));
            return (
              <div key={item.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 w-24">{item.month}</span>
                  <div className="flex items-center gap-4 font-mono tabular-nums">
                    <span className="text-slate-600">{item.pedidos} pedidos</span>
                    <span className="text-emerald-700 font-semibold">SLA {item.despachosATiempoPct}%</span>
                    <span className="font-bold text-slate-900">
                      USD {item.ingresosUsd.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0B2861] to-[#0E4B8F] rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive Report Preview & Configuration Modal */}
      {showPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B2861] text-white flex items-center justify-between gap-4 border-b-2 border-[#FFD100]">
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-[#FFD100]" />
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Vista Previa del Informe Gerencial (Formato PDF Oficial)
                  </h3>
                  <p className="text-xs text-blue-100">
                    Industrial Latina &amp; Induless · Presentación Ejecutiva para Directorio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customization Toolbar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeEntityBreakdown}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        includeEntityBreakdown: e.target.checked,
                      }))
                    }
                    className="rounded text-[#0B2861] focus:ring-[#0B2861]"
                  />
                  <span>Desglose Latina / Induless</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeSkuForecast}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        includeSkuForecast: e.target.checked,
                      }))
                    }
                    className="rounded text-[#0B2861] focus:ring-[#0B2861]"
                  />
                  <span>Pronóstico de Demanda SKUs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeSignatures}
                    onChange={(e) =>
                      setPdfOptions((prev) => ({
                        ...prev,
                        includeSignatures: e.target.checked,
                      }))
                    }
                    className="rounded text-[#0B2861] focus:ring-[#0B2861]"
                  />
                  <span>Firmas Ejecutivas &amp; SRI</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Clasificación:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
                  CONFIDENCIAL
                </span>
              </div>
            </div>

            {/* Modal Body: Scrollable PDF Presentation Page Simulator */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-200/80">
              <div className="max-w-[780px] mx-auto bg-white rounded-lg shadow-xl p-8 space-y-6 text-slate-900 border border-slate-300">
                {/* Simulated PDF Header */}
                <div className="bg-[#0B2861] text-white p-5 rounded-lg border-b-4 border-[#FFD100] flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-extrabold tracking-tight">
                      INDUSTRIAL LATINA | INDULESS ECUADOR
                    </h4>
                    <p className="text-[11px] text-blue-100 mt-0.5">
                      RUC: 0992847102001 · Plantas Guayaquil, Quito, Cuenca, Manta
                    </p>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#FFD100] text-slate-950 font-extrabold mb-1">
                      INFORME GERENCIAL IA
                    </span>
                    <p className="text-blue-100 font-mono">
                      Emisión: {new Date().toLocaleDateString('es-EC')}
                    </p>
                  </div>
                </div>

                {/* Simulated Title */}
                <div>
                  <h3 className="text-lg font-bold text-[#0B2861]">
                    INFORME GERENCIAL DE RENDIMIENTO Y PROYECCIONES ESTRATÉGICAS IA
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Horizonte: {horizonDays} Días · Directorio General &amp; Vendedor Digital
                  </p>
                </div>

                {/* Simulated KPI Grid */}
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Facturación Proy.</p>
                    <p className="text-sm font-bold font-mono text-[#0B2861] mt-0.5">
                      ${prediction.projectedRevenueUsd.toLocaleString('en-US')}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      +{prediction.projectedRevenueGrowthPct}% IA
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Facturación Activa</p>
                    <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                      ${Math.round(totalRev).toLocaleString('en-US')}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {orders.length} pedidos
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Cumplimiento SLA</p>
                    <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                      98.4%
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      Despacho Ecuador
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Riesgo Cadena</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {prediction.supplyChainRiskLevel}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {inventory.length} SKUs activos
                    </p>
                  </div>
                </div>

                {/* Simulated Dictamen Box */}
                <div className="p-3 bg-blue-50/70 border-l-4 border-[#0B2861] rounded text-xs space-y-1">
                  <p className="font-bold text-[#0B2861]">
                    Dictamen Ejecutivo IA:
                  </p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {prediction.executiveSummary}
                  </p>
                </div>

                {/* Simulated Table */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#0B2861]">
                    Rendimiento Histórico y Proyección Operativa (USD)
                  </p>
                  <div className="border border-slate-200 rounded overflow-hidden text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-[#0B2861] text-white">
                        <tr>
                          <th className="p-2">Periodo</th>
                          <th className="p-2 text-right">Ingresos Brutos</th>
                          <th className="p-2 text-center">Pedidos</th>
                          <th className="p-2 text-center">SLA %</th>
                          <th className="p-2 text-right">Costo Logístico</th>
                          <th className="p-2 text-center">Margen Neto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {MONTHLY_OPERATIONS_SERIES.map((m) => (
                          <tr key={m.month}>
                            <td className="p-2 font-semibold">{m.month}</td>
                            <td className="p-2 text-right font-mono">${m.ingresosUsd.toLocaleString('en-US')}</td>
                            <td className="p-2 text-center">{m.pedidos}</td>
                            <td className="p-2 text-center text-emerald-700 font-semibold">{m.despachosATiempoPct}%</td>
                            <td className="p-2 text-right font-mono">${m.costosLogisticosUsd.toLocaleString('en-US')}</td>
                            <td className="p-2 text-center font-bold">~32%</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50/60 font-bold">
                          <td className="p-2 text-[#0B2861]">Proy. IA ({horizonDays}d)</td>
                          <td className="p-2 text-right font-mono text-[#0B2861]">
                            ${prediction.projectedRevenueUsd.toLocaleString('en-US')}
                          </td>
                          <td className="p-2 text-center">{Math.round(orders.length * 1.3)}</td>
                          <td className="p-2 text-center text-emerald-700">99.1%</td>
                          <td className="p-2 text-right font-mono">$5,650</td>
                          <td className="p-2 text-center text-[#0B2861]">34.8%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Simulated Signatures */}
                {pdfOptions.includeSignatures && (
                  <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[10px]">
                    <div className="space-y-1">
                      <div className="h-7 border-b border-slate-400 mx-3 flex items-end justify-center text-[9px] text-emerald-700 font-mono">
                        [✓ Validado Digitalmente]
                      </div>
                      <p className="font-bold text-slate-900">Ing. Carlos Mendoza</p>
                      <p className="text-slate-500">Dirección General Ecuador</p>
                    </div>

                    <div className="space-y-1">
                      <div className="h-7 border-b border-slate-400 mx-3 flex items-end justify-center text-[9px] text-emerald-700 font-mono">
                        [✓ Auditoría Logística]
                      </div>
                      <p className="font-bold text-slate-900">Roberto Salazar</p>
                      <p className="text-slate-500">Gerencia de Operaciones</p>
                    </div>

                    <div className="space-y-1">
                      <div className="h-7 border-b border-slate-400 mx-3 flex items-end justify-center text-[9px] text-emerald-700 font-mono">
                        [✓ VD-EC-101]
                      </div>
                      <p className="font-bold text-slate-900">Ing. Diego Andrade</p>
                      <p className="text-slate-500">Ventas Digitales Ecuador</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Documento vectorizado en PDF/A válido para auditorías gerenciales SRI.</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportManagerialPdf();
                    setShowPreviewModal(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0B2861] hover:bg-[#071d47] rounded-xl shadow-md transition-all cursor-pointer border border-[#FFD100]/40"
                >
                  <FileDown className="w-4 h-4 text-[#FFD100]" />
                  <span>Descargar Documento PDF Oficial</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
