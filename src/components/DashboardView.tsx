import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Gift,
  Globe,
  LifeBuoy,
  Package,
  Palette,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import {
  CompanySocialNetworks,
  DiscountCoupon,
  EcuadorFestiveThemeId,
  InventoryItem,
  Invoice,
  NotificationLog,
  Order,
  Shipment,
  SupportTicket,
} from '../types/erp';
import {
  computeDashboardMetrics,
  computeRealtimeSummaryInsights,
} from '../utils/erpLogic';
import { MONTHLY_OPERATIONS_SERIES } from '../data/seedData';
import { exportDataset } from '../utils/downloadHelper';
import {
  ECUADOR_FESTIVE_THEMES,
  getActiveFestiveTheme,
} from '../utils/ecuadorThemes';

interface DashboardViewProps {
  orders: Order[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  shipments: Shipment[];
  notifications: NotificationLog[];
  supportTickets?: SupportTicket[];
  activeThemeId?: EcuadorFestiveThemeId;
  onSelectTheme?: (themeId: EcuadorFestiveThemeId) => void;
  socialNetworks?: CompanySocialNetworks;
  onOpenSocialModal?: () => void;
  coupons?: DiscountCoupon[];
  onOpenCouponModal?: () => void;
  onNavigate: (tab: string, trackingPreset?: string) => void;
  onStatusBanner: (msg: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  inventory,
  invoices,
  shipments,
  notifications,
  supportTickets = [],
  activeThemeId = 'quito',
  onSelectTheme,
  socialNetworks,
  onOpenSocialModal,
  coupons = [],
  onOpenCouponModal,
  onNavigate,
  onStatusBanner,
}) => {
  const [quickTrackInput, setQuickTrackInput] = useState('');
  const currentTheme = getActiveFestiveTheme(activeThemeId);
  const metrics = computeDashboardMetrics(orders, inventory, invoices);
  const realtimeInsights = computeRealtimeSummaryInsights(
    orders,
    shipments,
    supportTickets
  );
  const criticalNotifications = notifications.filter(
    (n) => n.severity === 'critica' || n.severity === 'alerta'
  );

  const handleExportSummary = (format: 'pdf' | 'excel' | 'csv') => {
    const headers = ['Indicador Operativo', 'Valor Actual', 'Unidad / Contexto'];
    const rows: (string | number)[][] = [
      ['Total Revenue Today (Ingresos Hoy)', realtimeInsights.totalRevenueToday, 'USD (Tiempo Real)'],
      ['Active Shipments (Envios Activos)', realtimeInsights.activeShipmentsCount, 'Unidades en Ruta'],
      ['Pending Tickets (Tickets Pendientes)', realtimeInsights.pendingTicketsCount, 'Mesa de Ingenieria 24/7'],
      ['Facturacion Acumulada Activa', metrics.totalRevenue, 'USD (16% IVA incluido)'],
      ['Pedidos Comerciales Activos', metrics.activeOrdersCount, 'Ordenes B2B'],
      ['Pedidos Liquidados en Pasarela', metrics.paidOrdersCount, 'Ordenes Pagadas'],
      ['Valoracion Total de Inventario', metrics.inventoryValuation, 'USD en 4 centros'],
      ['SKUs en Alerta de Reorden', metrics.criticalStockCount, 'Insumos bajo minimo'],
      ['Facturas Emitidas por Cobrar', metrics.pendingInvoicesTotal, 'USD pendientes'],
    ];
    const filename = exportDataset(
      format,
      'resumen_ejecutivo_industrial_latina',
      'Industrial Latina - Resumen Ejecutivo Diario',
      'Operaciones Comerciales, Inventario y Facturacion Digital',
      headers,
      rows
    );
    onStatusBanner(`Reporte ejecutivo exportado correctamente: ${filename}`);
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('envios', quickTrackInput.trim() || 'IL-ENV-8901');
  };

  return (
    <div className="space-y-8">
      {/* Executive Header & Direct Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Operaciones en Tiempo Real · Encriptación E2EE AES-256-GCM Activa · Sincronización Multi-Planta
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Panel de Control Ejecutivo — Industrial Latina
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleExportSummary('pdf')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            Exportar Resumen PDF
          </button>
          <button
            type="button"
            onClick={() => handleExportSummary('excel')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Exportar Excel (.xls)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('pedidos')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg il-btn-primary whitespace-nowrap shrink-0"
          >
            Nuevo Pedido B2B
            <ArrowUpRight className="w-3.5 h-3.5 text-il-yellow" />
          </button>
        </div>
      </div>

      {/* Control Maestro ERP: Temática Ecuatoriana Global, Redes Sociales & Cupones Comerciales (Exclusivo ERP) */}
      <section aria-label="Control Maestro ERP: Temática, Redes y Cupones" className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0B2861]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B2861]">
              Configuración Maestra Exclusiva del ERP (Temática, Redes Oficiales &amp; Cupones)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Ajustes reflejados en tiempo real en la tienda pública
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Gestor de Temática Ecuatoriana en Vivo */}
          <div className="il-card-surface rounded-2xl p-5 border-2 border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#0B2861] to-[#1E4E9E] text-[#FFD100] shadow-xs">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-display">
                      Temática Ecuatoriana
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Acopla toda la plataforma a la festividad
                    </p>
                  </div>
                </div>

                {/* Active Theme Badge */}
                <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${currentTheme.badgeBg} ${currentTheme.badgeText} shadow-xs`}>
                  <span className="text-sm">{currentTheme.iconSymbol}</span>
                  <span className="truncate max-w-[80px]">{currentTheme.name.split('(')[0]}</span>
                </div>
              </div>

              {/* Active Theme Highlight Banner */}
              <div className={`p-3 rounded-xl bg-gradient-to-r ${currentTheme.bannerGradient} text-white shadow-md relative overflow-hidden`}>
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white/20 text-white font-bold">
                      {currentTheme.festiveEmoji} {currentTheme.heroBadge}
                    </span>
                    <span className="font-mono text-[#FFD100]">{currentTheme.dates}</span>
                  </div>
                  <p className="text-xs font-black tracking-tight line-clamp-1">
                    {currentTheme.festiveSalute}
                  </p>
                  <p className="text-[11px] text-white/90 line-clamp-1">
                    {currentTheme.bannerMessage}
                  </p>
                </div>
              </div>

              {/* 8 Themes Quick Switcher Grid */}
              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Seleccionar Temática Activa:</span>
                  <span className="text-[10px] text-slate-500 font-normal">8 Festividades</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(ECUADOR_FESTIVE_THEMES) as EcuadorFestiveThemeId[]).map((themeKey) => {
                    const t = ECUADOR_FESTIVE_THEMES[themeKey];
                    const isSelected = t.id === activeThemeId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (onSelectTheme) {
                            onSelectTheme(t.id);
                            onStatusBanner(`Temática aplicada: ${t.name}. Toda la interfaz se ha acoplado con éxito.`);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-16 ${
                          isSelected
                            ? 'border-[#0B2861] bg-blue-50/70 ring-2 ring-[#0B2861] shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{t.iconSymbol}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3 h-3 text-[#0B2861]" />
                          )}
                        </div>
                        <p className={`text-[10px] font-bold line-clamp-1 ${isSelected ? 'text-[#0B2861]' : 'text-slate-800'}`}>
                          {t.name.split('(')[0].replace('Fiestas de ', '').replace('Carnaval de ', '')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2 text-center">
              <span className="text-[10px] text-slate-400">
                Control exclusivo ERP · Cero selectores en la web pública
              </span>
            </div>
          </div>

          {/* Card 2: Configuración de Redes Sociales Oficiales */}
          <div className="il-card-surface rounded-2xl p-5 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-display">
                      Redes Sociales Oficiales
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Enlaces corporativos vinculados
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  5 Canales
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 font-medium text-slate-700 text-[11px]">
                    <i className="fa-brands fa-facebook text-blue-600"></i>
                    <span>Facebook</span>
                  </span>
                  {socialNetworks?.facebook ? (
                    <a
                      href={socialNetworks.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Enlace Activo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No configurado</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 font-medium text-slate-700 text-[11px]">
                    <i className="fa-brands fa-instagram text-pink-600"></i>
                    <span>Instagram</span>
                  </span>
                  {socialNetworks?.instagram ? (
                    <a
                      href={socialNetworks.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-pink-600 hover:underline flex items-center gap-1"
                    >
                      Enlace Activo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No configurado</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 font-medium text-slate-700 text-[11px]">
                    <i className="fa-brands fa-tiktok text-slate-900"></i>
                    <span>TikTok</span>
                  </span>
                  {socialNetworks?.tiktok ? (
                    <a
                      href={socialNetworks.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-slate-800 hover:underline flex items-center gap-1"
                    >
                      Enlace Activo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No configurado</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 font-medium text-slate-700 text-[11px]">
                    <i className="fa-brands fa-youtube text-red-600"></i>
                    <span>YouTube</span>
                  </span>
                  {socialNetworks?.youtube ? (
                    <a
                      href={socialNetworks.youtube}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      Enlace Activo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No configurado</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 font-medium text-slate-700 text-[11px]">
                    <i className="fa-brands fa-whatsapp text-emerald-600"></i>
                    <span>WhatsApp Ventas</span>
                  </span>
                  {socialNetworks?.whatsapp ? (
                    <a
                      href={socialNetworks.whatsapp.startsWith('http') ? socialNetworks.whatsapp : `https://wa.me/${socialNetworks.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      Canal Activo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No configurado</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onOpenSocialModal}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#FFD100]" />
                <span>Configurar Redes Sociales</span>
              </button>
            </div>
          </div>

          {/* Card 3: Gestión de Cupones por Cédula/RUC & Flyers Flash (Exclusivo ERP) */}
          <div className="il-card-surface rounded-2xl p-5 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-display">
                      Cupones &amp; Flyers Flash
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Descuentos por Cédula/RUC y Promos
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {coupons.length} Cupones
                </span>
              </div>

              {/* Coupons list preview */}
              <div className="space-y-2 text-xs max-h-52 overflow-y-auto pr-1">
                {coupons.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#0B2861] text-xs tracking-wider">
                          {c.code}
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                          {c.discountPct ? `${c.discountPct}% OFF` : `$${c.discountFixedUsd || 0} OFF`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-[170px] mt-0.5">
                        {c.description || 'Descuento para clientes'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">
                      {c.expiresAt ? c.expiresAt.split('T')[0] : 'Vigente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onOpenCouponModal}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Gift className="w-4 h-4 text-[#FFD100]" />
                <span>Gestionar Cupones &amp; Flyers Flash</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Data Visualization Summary Cards: Total Revenue Today, Active Shipments, Pending Tickets */}
      <section aria-label="Real-Time Operational Summary Cards" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-il-blue" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-il-blue">
              Indicadores Visuales en Tiempo Real (Instant Insights)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Sincronización Activa · Plazo Intradía
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Total Revenue Today */}
          <div
            className="il-card-surface rounded-xl p-5 flex flex-col justify-between border-t-4 border-2"
            style={{
              borderColor: '#e2e8f0',
              borderTopColor: currentTheme.primaryColor,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-il-blue block">
                      Total Revenue Today · Ingresos de Hoy
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                      {currentTheme.iconSymbol}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                    USD {realtimeInsights.totalRevenueToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div
                  className="p-2.5 rounded-lg text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Intraday Sparkline Bar Visualization */}
              <div className="pt-2">
                <div className="flex items-end justify-between gap-2 h-14 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  {realtimeInsights.revenueSparkline.map((pct, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          idx === realtimeInsights.revenueSparkline.length - 1
                            ? 'bg-il-blue'
                            : 'bg-il-blue/40'
                        }`}
                        style={{ height: `${Math.max(18, pct)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>08:00</span>
                  <span>11:00</span>
                  <span>14:00</span>
                  <span>17:00</span>
                  <span>19:00</span>
                  <span className="text-il-blue font-bold">Ahora</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                {realtimeInsights.todayOrdersCount} órdenes hoy ({realtimeInsights.dailyTargetProgressPct}% meta diaria)
              </span>
              <button
                type="button"
                onClick={() => onNavigate('pedidos')}
                className="font-semibold text-il-blue hover:underline whitespace-nowrap shrink-0"
              >
                Ver transacciones →
              </button>
            </div>
          </div>

          {/* Card 2: Active Shipments */}
          <div
            className="il-card-surface rounded-xl p-5 flex flex-col justify-between border-t-4 border-2"
            style={{
              borderColor: '#e2e8f0',
              borderTopColor: currentTheme.secondaryColor || '#F5C400',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Active Shipments · Envíos Activos
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                      {currentTheme.iconSymbol}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                      {realtimeInsights.activeShipmentsCount}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      en ruta de {realtimeInsights.totalShipmentsCount} guías totales
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FEF9E6] text-[#0A3B72] shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              {/* Multi-Stage Logistics Pipeline Progress Visualization */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Avance Promedio de Flota</span>
                  <span className="font-mono font-bold text-il-blue">
                    {realtimeInsights.avgShipmentProgressPct}% completado
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
                  <div
                    className="h-full rounded-l-full transition-all"
                    style={{
                      width: `${realtimeInsights.avgShipmentProgressPct}%`,
                      backgroundColor: currentTheme.primaryColor,
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div className="bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200/80">
                    <span className="text-slate-500 block">Planta/ISO</span>
                    <strong className="text-slate-900">
                      {realtimeInsights.shipmentStageBreakdown.preparacion +
                        realtimeInsights.shipmentStageBreakdown.control_calidad}
                    </strong>
                  </div>
                  <div className="bg-il-blue-soft/60 px-2.5 py-1.5 rounded border border-il-blue/20">
                    <span className="text-il-blue block">En Tránsito</span>
                    <strong className="text-il-blue">
                      {realtimeInsights.shipmentStageBreakdown.en_transito +
                        realtimeInsights.shipmentStageBreakdown.centro_distribucion}
                    </strong>
                  </div>
                  <div className="bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                    <span className="text-emerald-700 block">Entregados</span>
                    <strong className="text-emerald-800">
                      {realtimeInsights.shipmentStageBreakdown.entregado}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Monitoreo GPS satelital activo
              </span>
              <button
                type="button"
                onClick={() => onNavigate('envios')}
                className="font-semibold text-il-blue hover:underline whitespace-nowrap shrink-0"
              >
                Rastrear flota →
              </button>
            </div>
          </div>

          {/* Card 3: Pending Tickets */}
          <div
            className="il-card-surface rounded-xl p-5 flex flex-col justify-between border-t-4 border-2"
            style={{
              borderColor: '#e2e8f0',
              borderTopColor: currentTheme.accentColor,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider block"
                      style={{ color: currentTheme.accentColor }}
                    >
                      Pending Tickets · Tickets Pendientes
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                      {currentTheme.iconSymbol}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                      {realtimeInsights.pendingTicketsCount}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      en atención · {realtimeInsights.resolvedTicketsCount} resueltos
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FDECEC] text-il-red shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
              </div>

              {/* SLA Resolution & Priority Distribution Visualization */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Cumplimiento SLA Soporte 24/7</span>
                  <span className="font-mono font-bold text-emerald-700">98.9% SLA</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${
                        realtimeInsights.totalTicketsCount > 0
                          ? Math.round(
                              (realtimeInsights.pendingTicketsCount /
                                realtimeInsights.totalTicketsCount) *
                                100
                            )
                          : 30
                      }%`,
                    }}
                    title="Tickets en atención"
                  />
                  <div
                    className="h-full bg-emerald-600 flex-1"
                    title="Tickets resueltos"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-mono text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    Prioridad Alta P1/P2: <strong>{realtimeInsights.highPriorityPendingCount}</strong>
                  </span>
                  <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    Tiempo Resp.: <strong>&lt; 12 min</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Ingeniería de guardia 24/7 asignada
              </span>
              <button
                type="button"
                onClick={() => onNavigate('seguridad')}
                className="font-semibold text-il-blue hover:underline whitespace-nowrap shrink-0"
              >
                Abrir mesa 24/7 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Full-Width KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="bg-white border-2 rounded-xl p-5 shadow-xs transition-all hover:shadow-md"
          style={{
            borderColor: '#e2e8f0',
            borderTopWidth: '4px',
            borderTopColor: currentTheme.primaryColor,
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">Volumen de Pedidos Activos</p>
            <span className="text-xs">{currentTheme.iconSymbol}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            USD {metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-700 font-medium mt-2">
            {metrics.activeOrdersCount} órdenes activas · {metrics.paidOrdersCount} cobradas en pasarela
          </p>
        </div>

        <div
          className="bg-white border-2 rounded-xl p-5 shadow-xs transition-all hover:shadow-md"
          style={{
            borderColor: '#e2e8f0',
            borderTopWidth: '4px',
            borderTopColor: currentTheme.secondaryColor || '#FFD100',
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">Valoración de Inventario en Vivo</p>
            <span className="text-xs">{currentTheme.iconSymbol}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            USD {metrics.inventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {inventory.length} referencias industriales · 4 centros logísticos
          </p>
        </div>

        <div
          className="bg-white border-2 rounded-xl p-5 shadow-xs transition-all hover:shadow-md"
          style={{
            borderColor: '#e2e8f0',
            borderTopWidth: '4px',
            borderTopColor: currentTheme.accentColor,
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">Alertas Críticas de Stock</p>
            <span className="text-xs">{currentTheme.iconSymbol}</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-2">
            {metrics.criticalStockCount} SKUs bajo mínimo
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-600">Reposición prioritaria requerida</span>
            <button
              type="button"
              onClick={() => onNavigate('inventario')}
              className="text-xs font-semibold text-slate-900 underline hover:text-slate-700 whitespace-nowrap shrink-0"
            >
              Revisar almacén
            </button>
          </div>
        </div>

        <div
          className="bg-white border-2 rounded-xl p-5 shadow-xs transition-all hover:shadow-md"
          style={{
            borderColor: '#e2e8f0',
            borderTopWidth: '4px',
            borderTopColor: currentTheme.primaryColor,
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">Facturación Digital &amp; Envío en Ruta</p>
            <span className="text-xs">{currentTheme.iconSymbol}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {invoices.length} CFDI · {realtimeInsights.activeShipmentsCount} en tránsito
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Por cobrar: <span className="font-mono tabular-nums">USD {metrics.pendingInvoicesTotal.toLocaleString('en-US')}</span>
          </p>
        </div>
      </div>

      {/* Quick Online Customer Shipment Tracking Bar & Critical Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                Consulta Rápida de Envíos en Línea y Despachos Activos
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('envios')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline whitespace-nowrap shrink-0"
              >
                Abrir portal de rastreo
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Ingrese el número de guía logística (ej. <span className="font-mono">IL-ENV-8901</span>) o razón social para verificar telemetría de ruta.
            </p>

            <form onSubmit={handleQuickTrackSubmit} className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <label htmlFor="dashboard-quick-track" className="sr-only">
                Código de guía o cliente
              </label>
              <input
                id="dashboard-quick-track"
                type="text"
                value={quickTrackInput}
                onChange={(e) => setQuickTrackInput(e.target.value)}
                placeholder="Ej. IL-ENV-8901, PED-2026-102 o Constructora Andina..."
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg il-btn-primary whitespace-nowrap shrink-0"
              >
                <Truck className="w-4 h-4 text-il-yellow" />
                Consultar Envío
              </button>
            </form>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2.5">
                Guías activas monitoreadas en tiempo real ({shipments.length})
              </p>
              <div className="divide-y divide-slate-100">
                {shipments.slice(0, 4).map((shp) => (
                  <div key={shp.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{shp.trackingCode}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-800 font-semibold truncate">{shp.clientName}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5 truncate">
                        {shp.origin} → {shp.destination} · {shp.carrier}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {shp.progress}%
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('envios', shp.trackingCode)}
                        className="text-xs font-semibold text-slate-900 underline hover:text-slate-600 whitespace-nowrap shrink-0"
                      >
                        Ver ruta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Critical Alerts & Security Status */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Alertas Críticas en Tiempo Real</h2>
              <button
                type="button"
                onClick={() => onNavigate('notificaciones')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline whitespace-nowrap shrink-0"
              >
                Configurar alertas
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monitoreo automático de stock mínimo, vencimientos fiscales y despachos
            </p>

            <div className="mt-4 divide-y divide-slate-100">
              {metrics.criticalStockItems.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Stock Bajo Mínimo: {item.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        SKU <span className="font-mono">{item.sku}</span> · Disponible:{' '}
                        <span className="font-mono font-semibold text-amber-700 tabular-nums">
                          {item.stock} {item.unit}
                        </span>{' '}
                        (Mínimo: <span className="font-mono tabular-nums">{item.minStock}</span>) · {item.warehouse}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('inventario')}
                    className="text-xs font-semibold text-slate-900 underline hover:text-slate-600 whitespace-nowrap shrink-0"
                  >
                    Reabastecer
                  </button>
                </div>
              ))}

              {criticalNotifications.slice(0, 2).map((notif) => (
                <div key={notif.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Package className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{notif.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Canal: {notif.channel.toUpperCase()} · Destino: {notif.recipientName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              2FA TOTP & Cifrado E2EE Verificados
            </span>
            <button
              type="button"
              onClick={() => onNavigate('seguridad')}
              className="font-semibold text-slate-900 underline hover:text-slate-600 whitespace-nowrap shrink-0"
            >
              Auditoría de seguridad
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Performance & Operational Trend Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Evolución Mensual de Operaciones Comerciales y Eficiencia Logística
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Histórico auditado mayo – octubre 2026 · Cifras expresadas en dólares estadounidenses (USD)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reportes')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            Ejecutar Pronóstico con IA Predictiva
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">Periodo</th>
                <th className="py-2.5 px-4 text-right">Facturación Bruta (USD)</th>
                <th className="py-2.5 px-4 text-right">Pedidos Procesados</th>
                <th className="py-2.5 px-4 text-right">Entregas a Tiempo (SLA)</th>
                <th className="py-2.5 pl-4 text-right">Costo Logístico (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {MONTHLY_OPERATIONS_SERIES.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{row.month}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ${row.ingresosUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {row.pedidos} órdenes
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                    {row.despachosATiempoPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pl-4 text-right font-mono tabular-nums text-slate-600">
                    ${row.costosLogisticosUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
