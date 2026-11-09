import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  FileText,
  Filter,
  Headphones,
  History,
  KeyRound,
  Lock,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  CompanySocialNetworks,
  EcuadorFestiveThemeId,
  ErpAuditCategory,
  ErpAuditLogEntry,
  SupportTicket,
  ThirdPartyIntegration,
  UserProfile,
  UserRole,
} from '../types/erp';
import {
  decryptPayloadE2EE,
  encryptPayloadE2EE,
  getPermissionsForRole,
  verifyTwoFactorCode,
} from '../utils/erpLogic';
import {
  ECUADOR_FESTIVE_THEMES,
} from '../utils/ecuadorThemes';
import {
  downloadAuditLogExecutivePdf,
  generateAuditLogExecutiveHtml,
  triggerExecutiveDocumentDownload,
} from '../utils/downloadHelper';
import { ExecutiveDocumentPreviewModal } from './ExecutiveDocumentPreviewModal';

interface SecurityRolesAndIntegrationsViewProps {
  users: UserProfile[];
  currentRole: UserRole;
  onChangeActiveRole: (role: UserRole) => void;
  onCreateUser: (newUser: {
    displayName: string;
    department: string;
    role: UserRole;
    email: string;
    phone: string;
  }) => void;
  onToggleUser2FA: (userId: string) => void;
  integrations: ThirdPartyIntegration[];
  onSyncIntegration: (integrationId: string) => void;
  tickets: SupportTicket[];
  onCreateSupportTicket: (subject: string, priority: SupportTicket['priority']) => void;
  firebaseConnected: boolean;
  firebaseUserEmail: string | null;
  activeThemeId?: EcuadorFestiveThemeId;
  onSelectTheme?: (themeId: EcuadorFestiveThemeId) => void;
  socialNetworks?: CompanySocialNetworks;
  onOpenSocialModal?: () => void;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onStatusBanner: (msg: string) => void;
  auditLogs?: ErpAuditLogEntry[];
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
}

const AUDIT_CATEGORY_CONFIG: Record<
  ErpAuditCategory,
  { label: string; badgeClass: string }
> = {
  cambio_precio: {
    label: 'Cambio de Precio',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  cupon_eliminado: {
    label: 'Cupón Eliminado',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
  },
  cupon_creado: {
    label: 'Cupón / Promo Creado',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  cambio_rol: {
    label: 'Cambio de Rol (RBAC)',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  inventario_stock: {
    label: 'Ajuste de Inventario',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  facturacion_sri: {
    label: 'Facturación SRI',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  configuracion_erp: {
    label: 'Configuración ERP',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  seguridad_acceso: {
    label: 'Seguridad & 2FA',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
  },
};

export const SecurityRolesAndIntegrationsView: React.FC<
  SecurityRolesAndIntegrationsViewProps
> = ({
  users,
  currentRole,
  onChangeActiveRole,
  onCreateUser,
  onToggleUser2FA,
  integrations,
  onSyncIntegration,
  tickets,
  onCreateSupportTicket,
  firebaseConnected,
  firebaseUserEmail,
  activeThemeId = 'quito',
  onSelectTheme,
  onOpenSocialModal,
  onSignInGoogle,
  onSignOutGoogle,
  onStatusBanner,
  auditLogs = [],
  onUpdateUserRole,
}) => {
  const activePermissions = getPermissionsForRole(currentRole);

  // Audit Module Filters & Preview State
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'todas' | ErpAuditCategory>('todas');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [executiveModalDoc, setExecutiveModalDoc] = useState<{
    isOpen: boolean;
    title: string;
    html: string;
    filename: string;
  } | null>(null);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (auditCategoryFilter !== 'todas' && entry.category !== auditCategoryFilter) {
        return false;
      }
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const hay = `${entry.auditCode} ${entry.actionLabel} ${entry.targetEntity} ${entry.actorUser} ${entry.previousValue} ${entry.newValue} ${entry.notes || ''}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [auditLogs, auditCategoryFilter, auditSearchQuery]);

  const auditKpis = useMemo(() => {
    return {
      total: auditLogs.length,
      priceChanges: auditLogs.filter((l) => l.category === 'cambio_precio').length,
      deletedCoupons: auditLogs.filter((l) => l.category === 'cupon_eliminado').length,
      roleChanges: auditLogs.filter((l) => l.category === 'cambio_rol').length,
      highSeverity: auditLogs.filter((l) => l.severity === 'alta').length,
    };
  }, [auditLogs]);

  const handleExportAuditExecutivePdf = (openPreviewOnly = false) => {
    const filterDesc =
      auditCategoryFilter === 'todas'
        ? 'Historial Completo de Cambios en el ERP (Precios, Cupones, Roles y Seguridad)'
        : `Filtro Activo: ${AUDIT_CATEGORY_CONFIG[auditCategoryFilter]?.label || auditCategoryFilter}`;

    const docHtml = generateAuditLogExecutiveHtml(filteredAuditLogs, filterDesc);
    const baseName = `auditoria_seguridad_erp_industrial_latina`;

    setExecutiveModalDoc({
      isOpen: true,
      title: `Reporte Ejecutivo de Auditoría ERP · Industrial Latina (${filteredAuditLogs.length} registros)`,
      html: docHtml,
      filename: baseName,
    });

    if (!openPreviewOnly) {
      const pdfFile = downloadAuditLogExecutivePdf(filteredAuditLogs, baseName);
      triggerExecutiveDocumentDownload(docHtml, baseName);
      onStatusBanner(
        `Historial de Auditoría (${filteredAuditLogs.length} eventos) exportado en PDF Ejecutivo con el logo de Industrial Latina: ${pdfFile}`
      );
    }
  };

  // New User Profile State
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('Logística & Despachos');
  const [role, setRole] = useState<UserRole>('logistica');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // 2FA TOTP Verification Tester
  const [totpInput, setTotpInput] = useState('482910');
  const [totpVerified, setTotpVerified] = useState<boolean | null>(true);

  // E2EE Live Cipher Inspector
  const [samplePlainText, setSamplePlainText] = useState(
    'ORDEN-CONFIDENCIAL: Constructora Andina | USD 31,552.00 | Cuenta SPEI 014982100'
  );
  const encryptedSample = encryptPayloadE2EE(samplePlainText);
  const decryptedSample = decryptPayloadE2EE(encryptedSample.cipherText);

  // Priority 24/7 Support Form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState<SupportTicket['priority']>(
    'P1 - Crítica (SLA 15 min)'
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    if (!activePermissions.canManageUsers) {
      setUserFormError('Solo el rol Administrador puede crear o modificar perfiles de usuario.');
      return;
    }
    if (displayName.trim().length < 2 || email.trim().length < 5) {
      setUserFormError('Ingrese nombre completo y correo corporativo válido.');
      return;
    }
    onCreateUser({
      displayName: displayName.trim(),
      department: department.trim(),
      role,
      email: email.trim(),
      phone: phone.trim() || '+57 300 000 0000',
    });
    setDisplayName('');
    setEmail('');
    setPhone('');
  };

  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = verifyTwoFactorCode(totpInput);
    setTotpVerified(ok);
    if (ok) {
      onStatusBanner('Código 2FA TOTP (482910) validado criptográficamente con éxito.');
    }
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    onCreateSupportTicket(ticketSubject.trim(), ticketPriority);
    setTicketSubject('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Control de Acceso Basado en Roles (RBAC) · Cifrado E2EE · Autenticación 2FA · Integración Cloud & APIs
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Perfiles, Seguridad Criptográfica, APIs y Soporte Empresarial 24/7
          </h1>
        </div>

        {/* Active Role Simulator & Cloud Auth Status */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="active-role-select" className="text-xs font-semibold text-slate-700">
              Vista de Rol Activo:
            </label>
            <select
              id="active-role-select"
              value={currentRole}
              onChange={(e) => onChangeActiveRole(e.target.value as UserRole)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="admin">Administrador General (Control Total)</option>
              <option value="finanzas">Finanzas & Facturación</option>
              <option value="logistica">Logística & Almacén</option>
              <option value="operador">Operador de Planta</option>
              <option value="cliente">Cliente Corporativo (Consulta)</option>
            </select>
          </div>

          {firebaseUserEmail ? (
            <button
              type="button"
              onClick={onSignOutGoogle}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0"
            >
              Sesión Cloud: {firebaseUserEmail} (Salir)
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Cloud className="w-3.5 h-3.5" />
              Autenticar Google Cloud Sync
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MÓDULO DE AUDITORÍA FORENSE & TRAZABILIDAD AUTOMÁTICA ERP
         ========================================================================= */}
      <section
        id="modulo-auditoria-erp"
        aria-label="Módulo de Auditoría de Cambios en el ERP"
        className="bg-white border-2 border-[#0B2861] rounded-2xl overflow-hidden shadow-md"
      >
        {/* Corporate Header Bar */}
        <div className="bg-gradient-to-r from-[#0B2861] via-[#133b8a] to-[#0B2861] text-white p-5 sm:p-6 border-b-4 border-[#FFD100] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[#FFD100] text-[#0B2861] shadow-sm shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFD100] text-[#0B2861] text-[10px] font-black uppercase tracking-wider">
                  Bitácora Inmutable SHA-256
                </span>
                <span className="text-[11px] text-blue-200 font-mono">
                  RUC: 0992847102001 · Industrial Latina Cía. Ltda.
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                Módulo de Auditoría Automática de Cambios en el ERP
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Registra automáticamente en tiempo real cada cambio de precio, cupón eliminado, modificación de rol (RBAC), stock y configuración.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleExportAuditExecutivePdf(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#FFD100]" />
              <span>Vista Previa del Documento</span>
            </button>

            <button
              type="button"
              data-testid="export-audit-pdf-btn"
              onClick={() => handleExportAuditExecutivePdf(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] text-xs font-black uppercase tracking-wide shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Historial en PDF Ejecutivo (Logo Industrial Latina)</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-[#0B2861]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Total Eventos Auditados
              </span>
              <p
                data-testid="audit-total-count"
                className="text-2xl font-black font-mono text-[#0B2861] mt-1"
              >
                {auditKpis.total}
              </p>
              <span className="text-[10px] text-slate-500">Bitácora activa 24/7</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 border-l-4 border-l-amber-600">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Cambios de Precios
              </span>
              <p
                data-testid="audit-price-changes-count"
                className="text-2xl font-black font-mono text-amber-700 mt-1"
              >
                {auditKpis.priceChanges}
              </p>
              <span className="text-[10px] text-amber-800">Actualizaciones de tarifa</span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 border-l-4 border-l-red-600">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-900 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Cupones Eliminados
              </span>
              <p
                data-testid="audit-deleted-coupons-count"
                className="text-2xl font-black font-mono text-red-700 mt-1"
              >
                {auditKpis.deletedCoupons}
              </p>
              <span className="text-[10px] text-red-800">Bajas de promociones</span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 border-l-4 border-l-purple-600">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Cambios de Rol (RBAC)
              </span>
              <p
                data-testid="audit-role-changes-count"
                className="text-2xl font-black font-mono text-purple-700 mt-1"
              >
                {auditKpis.roleChanges}
              </p>
              <span className="text-[10px] text-purple-800">Permisos modificados</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFD100] flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Criticidad Alta
              </span>
              <p className="text-2xl font-black font-mono text-white mt-1">
                {auditKpis.highSeverity}
              </p>
              <span className="text-[10px] text-slate-300">Sellado SHA-256 verificado</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#0B2861]" /> Filtrar por evento:
              </span>
              {(
                [
                  { id: 'todas', label: 'Todos los Eventos' },
                  { id: 'cambio_precio', label: 'Cambios de Precios' },
                  { id: 'cupon_eliminado', label: 'Cupones Eliminados' },
                  { id: 'cambio_rol', label: 'Cambios de Rol' },
                  { id: 'inventario_stock', label: 'Inventario & Stock' },
                  { id: 'configuracion_erp', label: 'Configuración ERP' },
                ] as const
              ).map((tab) => {
                const active = auditCategoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAuditCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0B2861] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-80">
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Buscar SKU, cupón, usuario, código AUD..."
                aria-label="Buscar en bitácora de auditoría"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2861]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4">Código / Fecha</th>
                  <th className="py-3 px-4">Categoría &amp; Operación</th>
                  <th className="py-3 px-4">Operador / Rol RBAC</th>
                  <th className="py-3 px-4">Entidad Afectada en ERP</th>
                  <th className="py-3 px-4">Valor Anterior ➔ Valor Nuevo</th>
                  <th className="py-3 px-4 text-right">Severidad / Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No se encontraron registros de auditoría para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((entry) => {
                    const cfg = AUDIT_CATEGORY_CONFIG[entry.category] || {
                      label: entry.category,
                      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
                    };
                    return (
                      <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <div className="font-bold text-[#0B2861]">{entry.auditCode}</div>
                          <div className="text-[11px] text-slate-500">{entry.timestamp}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cfg.badgeClass}`}
                          >
                            {cfg.label}
                          </span>
                          <div className="font-semibold text-slate-800 mt-1">
                            {entry.actionLabel}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{entry.actorUser}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            Rol: <strong className="text-slate-700 uppercase">{entry.actorRole}</strong> · {entry.ipAddress}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{entry.targetEntity}</div>
                          {entry.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{entry.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 line-through text-[11px]">
                              {entry.previousValue}
                            </span>
                            <span className="text-slate-400 font-bold">➔</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                              {entry.newValue}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              entry.severity === 'alta'
                                ? 'bg-red-100 text-red-800'
                                : entry.severity === 'media'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {entry.severity}
                          </span>
                          <div className="font-mono text-[10px] text-slate-400 mt-1">
                            {entry.integrityHash}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Control Maestro de Temática Ecuatoriana & Redes Sociales */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0B2861] text-[#FFD100]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Temática Ecuatoriana & Canales Oficiales de Redes Sociales
              </h2>
              <p className="text-xs text-slate-500">
                Ajuste la identidad visual y los canales oficiales desde el ERP para sincronizar todo el portal.
              </p>
            </div>
          </div>
          {onOpenSocialModal && (
            <button
              type="button"
              onClick={onOpenSocialModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0B2861] hover:bg-blue-950 rounded-xl shadow-xs cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FFD100]" />
              <span>Configurar Redes Sociales</span>
            </button>
          )}
        </div>

        {/* 8 Themes Selector */}
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-700 mb-2">
            Temática Activa en la Web Pública y ERP:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {(Object.keys(ECUADOR_FESTIVE_THEMES) as EcuadorFestiveThemeId[]).map((tKey) => {
              const th = ECUADOR_FESTIVE_THEMES[tKey];
              const isSel = th.id === activeThemeId;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    if (onSelectTheme) {
                      onSelectTheme(th.id);
                      onStatusBanner(`Temática aplicada: ${th.name}`);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSel
                      ? 'border-[#0B2861] bg-blue-50 ring-2 ring-[#0B2861] font-bold text-[#0B2861]'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{th.iconSymbol}</span>
                  <span className="text-[10px] leading-tight line-clamp-1">{th.name.split('(')[0].replace('Fiestas de ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Security Core: 2FA Authenticator + E2EE Cipher Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 2FA TOTP Authentication Module */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-800" />
                Autenticación de Dos Factores (2FA TOTP RFC-6238)
              </h2>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                ACTIVO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Protege operaciones críticas (emisión de facturas, cambios de rol y despachos) mediante tokens dinámicos de 6 dígitos.
            </p>

            <form onSubmit={handleVerifyTotp} className="mt-4 space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Semilla TOTP Sincronizada</p>
                  <p className="font-mono text-slate-500 mt-0.5">
                     Token de prueba activo: <strong>482910</strong>
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-1 border border-slate-200 rounded">
                  SHA1 · 30s
                </span>
              </div>

              <div className="flex gap-2">
                <label htmlFor="totp-code-input" className="sr-only">
                  Código de 6 dígitos 2FA
                </label>
                <input
                  id="totp-code-input"
                  type="text"
                  maxLength={6}
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value)}
                  placeholder="482910"
                  className="flex-1 px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  Validar Token 2FA
                </button>
              </div>

              {totpVerified !== null && (
                <p
                  className={`text-xs font-semibold ${
                    totpVerified ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {totpVerified
                    ? 'Verificación de doble factor completada: Sesión de alta seguridad autorizada.'
                    : 'Código TOTP inválido. Use el token sincronizado 482910.'}
                </p>
              )}
            </form>
          </div>

          {/* RBAC Active Permissions Summary */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-900 mb-2">
              Matriz de Permisos del Rol Seleccionado ({currentRole.toUpperCase()}):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="text-slate-700">
                Crear Pedidos:{' '}
                <strong className={activePermissions.canCreateOrder ? 'text-emerald-700' : 'text-slate-400'}>
                  {activePermissions.canCreateOrder ? 'Permitido' : 'Restringido'}
                </strong>
              </div>
              <div className="text-slate-700">
                Editar Stock:{' '}
                <strong className={activePermissions.canEditInventory ? 'text-emerald-700' : 'text-slate-400'}>
                  {activePermissions.canEditInventory ? 'Permitido' : 'Restringido'}
                </strong>
              </div>
              <div className="text-slate-700">
                Emitir CFDI:{' '}
                <strong className={activePermissions.canIssueInvoice ? 'text-emerald-700' : 'text-slate-400'}>
                  {activePermissions.canIssueInvoice ? 'Permitido' : 'Restringido'}
                </strong>
              </div>
              <div className="text-slate-700">
                Gestionar Roles:{' '}
                <strong className={activePermissions.canManageUsers ? 'text-emerald-700' : 'text-slate-400'}>
                  {activePermissions.canManageUsers ? 'Permitido' : 'Restringido'}
                </strong>
              </div>
              <div className="text-slate-700">
                Exportar Finanzas:{' '}
                <strong className={activePermissions.canExportFinancials ? 'text-emerald-700' : 'text-slate-400'}>
                  {activePermissions.canExportFinancials ? 'Permitido' : 'Restringido'}
                </strong>
              </div>
              <div className="text-slate-700">
                Actualizar Rutas:{' '}
                <strong className={activePermissions.canUpdateShipments ? 'text-emerald-700' : 'text-slate-400'}>
                  {activePermissions.canUpdateShipments ? 'Permitido' : 'Restringido'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* End-to-End Encryption (E2EE) Inspector */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-800" />
                Encriptación de Extremo a Extremo (E2EE AES-256-GCM)
              </h2>
              <span className="text-xs font-mono text-slate-500">
                PII Split-Collection Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verifica en tiempo real el sellado criptográfico de datos financieros y de clientes antes de su sincronización en la nube.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="e2ee-plaintext" className="block text-xs font-semibold text-slate-700 mb-1">
                  Carga Útil Comercial (Texto Plano en Memoria Segura)
                </label>
                <input
                  id="e2ee-plaintext"
                  type="text"
                  value={samplePlainText}
                  onChange={(e) => setSamplePlainText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Paquete Cifrado Generado (Transmitido a Nube):
                </p>
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg break-all">
                  {encryptedSample.cipherText}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>
                  Verificación Decodificada:{' '}
                  <strong className="font-mono text-slate-900">{decryptedSample.slice(0, 42)}...</strong>
                </span>
                <span className="font-mono text-emerald-700 font-semibold">
                  Tag: {encryptedSample.authTag}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Firestore Zero-Trust Rules + Aislamiento PII Verificados
            </span>
            <span className="font-mono text-slate-500">
              {firebaseConnected ? 'Cloud Online' : 'Modo Local Seguro'}
            </span>
          </div>
        </div>
      </div>

      {/* User Profiles & Custom Role Management */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-800" />
            Gestión de Perfiles de Usuario y Roles de Acceso Personalizados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administre operadores, auditores financieros y clientes con huella criptográfica E2EE y estado 2FA individual.
          </p>
        </div>

        {userFormError && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800">
            {userFormError}
          </div>
        )}

        <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <label htmlFor="usr-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre Completo
            </label>
            <input
              id="usr-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Ing. Diana Pineda"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="usr-dept" className="block text-xs font-semibold text-slate-700 mb-1">
              Departamento
            </label>
            <input
              id="usr-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="usr-role" className="block text-xs font-semibold text-slate-700 mb-1">
              Rol de Acceso
            </label>
            <select
              id="usr-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              <option value="logistica">Logística & Almacén</option>
              <option value="finanzas">Finanzas & Facturación</option>
              <option value="operador">Operador de Planta</option>
              <option value="cliente">Cliente Corporativo</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="usr-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Corporativo (PII Aislado)
            </label>
            <input
              id="usr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="d.pineda@industriallatina.com"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Crear Perfil
            </button>
          </div>
        </form>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4">Usuario / Departamento</th>
                <th className="py-2.5 px-4">Rol RBAC</th>
                <th className="py-2.5 px-4">Contacto (Bóveda PII)</th>
                <th className="py-2.5 px-4">Huella Llave E2EE</th>
                <th className="py-2.5 px-4 text-right">Estado 2FA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{u.displayName}</div>
                    <div className="text-slate-500">{u.department}</div>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {onUpdateUserRole ? (
                      <select
                        aria-label={`Cambiar rol de ${u.displayName}`}
                        value={u.role}
                        onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 hover:border-[#0B2861] focus:outline-none focus:ring-2 focus:ring-[#0B2861] cursor-pointer"
                      >
                        <option value="admin">ADMIN</option>
                        <option value="finanzas">FINANZAS</option>
                        <option value="logistica">LOGISTICA</option>
                        <option value="operador">OPERADOR</option>
                        <option value="cliente">CLIENTE</option>
                      </select>
                    ) : (
                      u.role.toUpperCase()
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    <div>{u.email}</div>
                    <div className="text-slate-400">{u.phone}</div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{u.e2eeKeyFingerprint}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleUser2FA(u.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors whitespace-nowrap shrink-0 ${
                        u.twoFactorEnabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {u.twoFactorEnabled ? '2FA Activo' : 'Activar 2FA'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Third-Party APIs, Cloud Storage & 24/7 Priority Enterprise Support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Third-Party Financial APIs & Cloud Storage */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-base font-bold text-slate-900">
            Integración con APIs Financieras de Terceros y Almacenamiento en la Nube
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Sincronización bidireccional cifrada con ERPs contables, autoridades fiscales y bóvedas multi-nube.
          </p>

          <div className="divide-y divide-slate-100">
            {integrations.map((intg) => (
              <div
                key={intg.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{intg.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      {intg.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-mono text-slate-500 mt-0.5">
                    {intg.endpoint} · {intg.syncedRecords} registros sincronizados · Última sync: {intg.lastSync}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSyncIntegration(intg.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sincronizar API
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 24/7 Priority Enterprise Support */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-slate-800" />
                Soporte Técnico Prioritario 24/7
              </h2>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                SLA 15 MIN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Atención directa de ingeniería para plantas industriales y operaciones críticas sin interrupción.
            </p>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 mb-5">
              <div>
                <label htmlFor="support-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                  Requerimiento Técnico o Incidencia Operativa
                </label>
                <input
                  id="support-subject"
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Ej. Asistencia en conciliación de lote SAP / Facturación..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <select
                  aria-label="Nivel de prioridad de soporte"
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as SupportTicket['priority'])}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="P1 - Crítica (SLA 15 min)">P1 - Crítica (SLA 15 min)</option>
                  <option value="P2 - Alta (SLA 1h)">P2 - Alta (SLA 1h)</option>
                  <option value="P3 - Normal (SLA 4h)">P3 - Normal (SLA 4h)</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  Abrir Ticket 24/7
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-3">
              {tickets.map((tkt) => (
                <div key={tkt.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-900">{tkt.ticketCode}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {tkt.status === 'en_atencion' ? 'En Atención Activa' : 'Resuelto'}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 mt-0.5">{tkt.subject}</p>
                  <p className="text-slate-500 mt-0.5">
                    {tkt.priority} · {tkt.assignedEngineer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Document Preview Modal */}
      {executiveModalDoc && (
        <ExecutiveDocumentPreviewModal
          isOpen={executiveModalDoc.isOpen}
          onClose={() => setExecutiveModalDoc(null)}
          documentTitle={executiveModalDoc.title}
          documentHtml={executiveModalDoc.html}
          filename={executiveModalDoc.filename}
        />
      )}
    </div>
  );
};
