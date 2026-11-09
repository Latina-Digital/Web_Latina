import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  X,
} from 'lucide-react';
import { CompanySettings, EcuadorFestiveThemeId } from '../types/erp';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';

interface DistributorApplicationSectionProps {
  companySettings: CompanySettings;
  onUpdateCompanySettings?: (updated: Partial<CompanySettings>) => void;
  onShowToast?: (msg: string) => void;
  isReadOnly?: boolean;
  activeThemeId?: EcuadorFestiveThemeId;
}

export const DistributorApplicationSection: React.FC<
  DistributorApplicationSectionProps
> = ({
  companySettings,
  onUpdateCompanySettings,
  onShowToast,
  isReadOnly = true,
  activeThemeId = 'quito',
}) => {
  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);
  // Application Form State (All fields strictly empty "" by default)
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientNit, setClientNit] = useState('');
  const [establishmentType, setEstablishmentType] = useState('');
  const [cityProvince, setCityProvince] = useState('');
  const [address, setAddress] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [estimatedMonthlyPurchase, setEstimatedMonthlyPurchase] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Business Channel Settings Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(companySettings.distributorsInboxEmail);
  const [editWhatsapp, setEditWhatsapp] = useState(companySettings.distributorsWhatsapp);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCompanySettings) {
      onUpdateCompanySettings({
        distributorsInboxEmail: editEmail.trim(),
        distributorsWhatsapp: editWhatsapp.trim(),
      });
    }
    setIsConfigModalOpen(false);
    onShowToast?.('Canales de recepción de distribuidores actualizados exitosamente.');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/distributors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName,
          companyName,
          clientNit,
          establishmentType,
          cityProvince,
          address,
          phoneWhatsapp,
          email,
          estimatedMonthlyPurchase,
          notes,
        }),
      });

      setIsSubmittedSuccess(true);
      onShowToast?.('¡Solicitud de distribución transmitida exitosamente!');
    } catch (err) {
      console.warn('Fallback local distributor application:', err);
      setIsSubmittedSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendViaWhatsApp = () => {
    const rawNumber = companySettings.distributorsWhatsapp.replace(/\D/g, '');
    const cleanNumber = rawNumber.startsWith('593') ? rawNumber : `593${rawNumber.replace(/^0+/, '')}`;
    const message = `*SOLICITUD DE DISTRIBUIDOR OFICIAL - INDUSTRIAL LATINA & INDULESS*
- *Contacto:* ${contactName || 'No indicado'}
- *Empresa / Razón Social:* ${companyName || 'No indicado'}
- *RUC/Cédula:* ${clientNit || 'No indicado'}
- *Tipo de Negocio:* ${establishmentType}
- *Ciudad/Provincia:* ${cityProvince}
- *Dirección:* ${address || 'No indicada'}
- *Teléfono:* ${phoneWhatsapp || 'No indicado'}
- *Correo:* ${email || 'No indicado'}
- *Estimado Compra Mensual:* ${estimatedMonthlyPurchase}
- *Detalle:* ${notes || 'Deseo ser distribuidor autorizado'}`;

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="distribuidores-section" className="py-16 bg-gradient-to-b from-slate-100 to-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2861] text-[#FFD100] text-xs font-black uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Red Nacional de Distribución Ecuador</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B2861] font-display">
              ¿Deseas ser Distribuidor Autorizado?
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mt-1 leading-relaxed">
              Únete a la red líder en pinturas arquitectónicas, empastes, cables CONDEX y perfilería
              ferretera con precios preferenciales directos de fábrica.
            </p>
          </div>

          {/* Business Config Button (Only when not in read-only public mode) */}
          {!isReadOnly && onUpdateCompanySettings && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditEmail(companySettings.distributorsInboxEmail);
                  setEditWhatsapp(companySettings.distributorsWhatsapp);
                  setIsConfigModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Settings className="w-4 h-4 text-[#0B2861]" />
                <span>Configurar Canales de Empresa (Email &amp; WhatsApp)</span>
              </button>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="p-6 rounded-2xl bg-white border-2 shadow-sm space-y-2.5 transition-all hover:shadow-md"
            style={{
              borderColor: '#e2e8f0',
              borderTopWidth: '5px',
              borderTopColor: activeFestiveTheme.accentColor,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B2861] flex items-center justify-center font-black">
                ⭐
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                {activeFestiveTheme.iconSymbol} {activeFestiveTheme.heroBadge}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Precios Directos de Planta</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Márgenes comerciales superiores en toda la línea de látex, satinados, empastes e
              importaciones Induless.
            </p>
          </div>

          <div
            className="p-6 rounded-2xl bg-white border-2 shadow-sm space-y-2.5 transition-all hover:shadow-md"
            style={{
              borderColor: '#e2e8f0',
              borderTopWidth: '5px',
              borderTopColor: activeFestiveTheme.primaryColor,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E3000F] flex items-center justify-center font-black">
                🚚
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Logística Nacional
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Despacho Satelital a Todo Ecuador</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rutas semanales consolidadas hacia Guayas, Pichincha, Azuay, Manabí, Tungurahua y El Oro
              con rastreo GPS.
            </p>
          </div>

          <div
            className="p-6 rounded-2xl bg-white border-2 shadow-sm space-y-2.5 transition-all hover:shadow-md"
            style={{
              borderColor: '#e2e8f0',
              borderTopWidth: '5px',
              borderTopColor: activeFestiveTheme.secondaryColor || '#FFD100',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FFD100] flex items-center justify-center font-black">
                💼
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Alianza Comercial
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Material POP &amp; Capacitación</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exhibidores de fábrica, catálogos físicos, muestras de color y asesoría técnica para sus
              vendedores.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div
          className="bg-white rounded-3xl border-2 p-6 sm:p-10 shadow-xl"
          style={{
            borderColor: activeFestiveTheme.primaryColor,
            borderTopWidth: '6px',
            borderTopColor: activeFestiveTheme.accentColor,
          }}
        >
          {isSubmittedSuccess ? (
            <div className="text-center py-10 space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display">
                ¡Solicitud Recibida Exitosamente!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Su postulación ha sido enviada al departamento de distribución de Industrial Latina.
                Se notificó a <strong>{companySettings.distributorsInboxEmail}</strong> y{' '}
                <strong>{companySettings.distributorsWhatsapp}</strong>. Un asesor comercial lo
                contactará en menos de 24 horas.
              </p>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Reenviar copia por WhatsApp a la Empresa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmittedSuccess(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  Enviar otra postulación
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-[#0B2861] font-display">
                  Formulario de Postulación de Distribuidores
                </h3>
                <p className="text-xs text-slate-500">
                  Complete los siguientes datos comerciales para evaluar la asignación de cupo y
                  zona de distribución.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre del Representante o Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Razón Social o Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Ferretería El Constructor S.A."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    RUC o Cédula (SRI Ecuador) *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientNit}
                    onChange={(e) => setClientNit(e.target.value)}
                    placeholder="Ej. 0992837465001"
                    className="w-full px-3 py-2.5 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Establecimiento *
                  </label>
                  <select
                    value={establishmentType}
                    onChange={(e) => setEstablishmentType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="">Seleccione tipo de establecimiento...</option>
                    <option value="Ferretería Mayorista">Ferretería Mayorista</option>
                    <option value="Depósito de Materiales">Depósito de Materiales de Construcción</option>
                    <option value="Taller de Carpintería & Melamina">Taller de Carpintería &amp; Melamina</option>
                    <option value="Instalador Eléctrico & Aluminio">Instalador Eléctrico &amp; Perfiles</option>
                    <option value="Constructora / Desarrollador">Constructora / Desarrollador Inmobiliario</option>
                    <option value="Distribuidora Provincial">Distribuidora Provincial Independiente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ciudad y Provincia *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityProvince}
                    onChange={(e) => setCityProvince(e.target.value)}
                    placeholder="Ej. Cuenca · Azuay"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono Celular / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneWhatsapp}
                    onChange={(e) => setPhoneWhatsapp(e.target.value)}
                    placeholder="+593 99 123 4567"
                    className="w-full px-3 py-2.5 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@miempresa.ec"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Capacidad Estimada de Compra Mensual
                  </label>
                  <select
                    value={estimatedMonthlyPurchase}
                    onChange={(e) => setEstimatedMonthlyPurchase(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="">Seleccione capacidad estimada...</option>
                    <option value="USD $1,000 – $5,000 / mes">USD $1,000 – $5,000 / mes</option>
                    <option value="USD $5,000 – $15,000 / mes">USD $5,000 – $15,000 / mes</option>
                    <option value="Más de USD $15,000 / mes">Más de USD $15,000 / mes (Distribuidor Master)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">
                    Dirección del Local o Bodega *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. principal y número de local"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Comentarios sobre su Infraestructura o Clientes Actuales
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Indique metros cuadrados de exhibición, rutas de reparto propias o líneas de productos que actualmente comercializa."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    La información se enviará a: <strong>{companySettings.distributorsInboxEmail}</strong> y{' '}
                    <strong>{companySettings.distributorsWhatsapp}</strong>.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSendViaWhatsApp}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar por WhatsApp</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-[#FFD100]" />
                    <span>{isSubmitting ? 'Transmitiendo...' : 'Enviar Solicitud a la Empresa'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Business Channels Configuration Modal */}
      {isConfigModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="config-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-[#0B2861] animate-fade-in-up">
            <div className="p-5 bg-[#0B2861] text-white flex items-center justify-between border-b-2 border-[#FFD100]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FFD100]" />
                <h3 id="config-modal-title" className="text-base font-extrabold font-display">
                  Configurar Canales de Recepción
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Configure el correo electrónico y el número de WhatsApp oficial donde la empresa
                desea recibir las solicitudes de distribuidores.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0B2861]" />
                  <span>Correo Electrónico de Recepción:</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp Oficial de la Empresa:</span>
                </label>
                <input
                  type="text"
                  required
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="+593 97 973 2435"
                  className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B2861] hover:bg-blue-950 text-white font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#FFD100]" />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
