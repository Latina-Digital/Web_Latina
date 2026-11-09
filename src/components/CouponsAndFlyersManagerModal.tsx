import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  DiscountCoupon,
  EcuadorFestiveThemeId,
  FlashFlyerPromo,
  InventoryItem,
} from '../types/erp';
import {
  ECUADOR_FESTIVE_THEMES,
  getActiveFestiveTheme,
} from '../utils/ecuadorThemes';

interface CouponsAndFlyersManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: DiscountCoupon[];
  onAddCoupon: (coupon: DiscountCoupon) => void;
  onDeleteCoupon: (id: string) => void;
  onToggleCouponActive?: (id: string) => void;
  onToggleAllCoupons?: (enabled: boolean) => void;
  flyers: FlashFlyerPromo[];
  onAddFlyer: (flyer: FlashFlyerPromo) => void;
  onDeleteFlyer: (id: string) => void;
  inventory: InventoryItem[];
  activeThemeId: EcuadorFestiveThemeId;
  onShowToast?: (msg: string) => void;
}

export const CouponsAndFlyersManagerModal: React.FC<
  CouponsAndFlyersManagerModalProps
> = ({
  isOpen,
  onClose,
  coupons,
  onAddCoupon,
  onDeleteCoupon,
  onToggleCouponActive,
  onToggleAllCoupons,
  flyers,
  onAddFlyer,
  onDeleteFlyer,
  inventory,
  activeThemeId,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'cupones' | 'flyers'>('cupones');
  const activeTheme = getActiveFestiveTheme(activeThemeId);

  // New Coupon Form State
  const [newCode, setNewCode] = useState('');
  const [newDiscountPct, setNewDiscountPct] = useState(15);
  const [newOnlyNewClients, setNewOnlyNewClients] = useState(true);
  const [newMinPurchase, setNewMinPurchase] = useState(30);
  const [newExpiresAt, setNewExpiresAt] = useState('2026-12-31');
  const [newDescription, setNewDescription] = useState('Descuento especial por festividades');
  const [newThemeAffinity, setNewThemeAffinity] =
    useState<EcuadorFestiveThemeId>(activeThemeId);

  // New Flyer Form State
  const [newFlyerTitle, setNewFlyerTitle] = useState('¡Flash Promocional de Temporada!');
  const [newFlyerSubtitle, setNewFlyerSubtitle] = useState('Precios especiales de fábrica por 48 horas');
  const [newFlyerBadge, setNewFlyerBadge] = useState('OFERTA FLASH 48H');
  const [newFlyerSku, setNewFlyerSku] = useState(inventory[0]?.sku || 'LAT-LVA-01');
  const [newFlyerOriginalPrice, setNewFlyerOriginalPrice] = useState(24.99);
  const [newFlyerPromoPrice, setNewFlyerPromoPrice] = useState(19.99);
  const [newFlyerCountdownDays, setNewFlyerCountdownDays] = useState(3);
  const [newFlyerTheme, setNewFlyerTheme] =
    useState<EcuadorFestiveThemeId>(activeThemeId);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const created: DiscountCoupon = {
      id: `coup_${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      discountPct: Number(newDiscountPct),
      onlyNewClients: newOnlyNewClients,
      minPurchaseUsd: Number(newMinPurchase),
      expiresAt: newExpiresAt,
      description: newDescription.trim(),
      active: true,
      themeAffinity: newThemeAffinity,
    };

    onAddCoupon(created);
    setNewCode('');
    onShowToast?.(`¡Cupón '${created.code}' creado y activado en el sistema!`);
  };

  const handleCreateFlyer = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = inventory.find((i) => i.sku === newFlyerSku) || inventory[0];
    const endsDate = new Date();
    endsDate.setDate(endsDate.getDate() + newFlyerCountdownDays);

    const discountCalculated = Math.round(
      ((newFlyerOriginalPrice - newFlyerPromoPrice) / newFlyerOriginalPrice) * 100
    );

    const created: FlashFlyerPromo = {
      id: `flyer_${Date.now()}`,
      title: newFlyerTitle.trim(),
      subtitle: newFlyerSubtitle.trim(),
      badge: newFlyerBadge.trim(),
      sku: targetItem.sku,
      productName: targetItem.name,
      originalPrice: Number(newFlyerOriginalPrice),
      promotionalPrice: Number(newFlyerPromoPrice),
      discountPct: Math.max(5, discountCalculated),
      countdownEndsAt: endsDate.toISOString(),
      bannerGradient: getActiveFestiveTheme(newFlyerTheme).bannerGradient,
      activeTheme: newFlyerTheme,
      active: true,
    };

    onAddFlyer(created);
    onShowToast?.('¡Nuevo Flyer Flash promocional publicado en la tienda!');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupons-modal-title"
      className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl border-2 border-[#0B2861] skeuo-modal-3d">
        {/* Header */}
        <div
          className={`relative overflow-hidden px-6 py-4 bg-gradient-to-r ${activeTheme.modalHeaderGradient || activeTheme.bannerGradient} text-white flex items-center justify-between border-b-2 border-[#FFD100]`}
        >
          <div className="relative z-10 flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-[#FFD100]" />
            <div>
              <h3 id="coupons-modal-title" className="text-base font-extrabold font-display">
                Módulo Comercial: Cupones de Descuento &amp; Flyers Flash
              </h3>
              <p className="text-[11px] text-blue-100">
                Adaptados a las Fechas Festivas del Ecuador · Restricción por Cédula/RUC Nuevo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer skeuo-btn-3d"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cupones')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'cupones'
                ? 'bg-white border-slate-200 text-[#0B2861] font-black -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#E3000F]" />
              <span>Gestor de Cupones ({coupons.length})</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flyers')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'flyers'
                ? 'bg-white border-slate-200 text-[#0B2861] font-black -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FFD100]" />
              <span>Flyers Flash Promocionales ({flyers.length})</span>
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === 'cupones' && (
            <div className="space-y-6">
              {/* Form to create new coupon */}
              <form onSubmit={handleCreateCoupon} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <span className="text-xs font-black text-[#0B2861] uppercase tracking-wide block">
                  + Crear Nuevo Cupón de Descuento
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Código del Cupón *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="Ej. GUAYAQUIL2026"
                      className="w-full px-3 py-2 font-mono font-black text-xs uppercase bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Descuento (%):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={70}
                      value={newDiscountPct}
                      onChange={(e) => setNewDiscountPct(Number(e.target.value))}
                      className="w-full px-3 py-2 font-mono font-bold text-xs bg-white border border-slate-300 rounded-xl text-center"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Compra Mínima USD:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newMinPurchase}
                      onChange={(e) => setNewMinPurchase(Number(e.target.value))}
                      className="w-full px-3 py-2 font-mono font-bold text-xs bg-white border border-slate-300 rounded-xl text-center"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Válido Hasta:
                    </label>
                    <input
                      type="date"
                      value={newExpiresAt}
                      onChange={(e) => setNewExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Temática Festiva Asociada:
                    </label>
                    <select
                      value={newThemeAffinity}
                      onChange={(e) =>
                        setNewThemeAffinity(e.target.value as EcuadorFestiveThemeId)
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                    >
                      {Object.values(ECUADOR_FESTIVE_THEMES).map((th) => (
                        <option key={th.id} value={th.id}>
                          {th.name.split('(')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-800 select-none">
                      <input
                        type="checkbox"
                        checked={newOnlyNewClients}
                        onChange={(e) => setNewOnlyNewClients(e.target.checked)}
                        className="accent-[#0B2861] rounded w-4 h-4"
                      />
                      <span className="font-bold text-[11px] leading-tight">
                        Exclusivo por Cédula / RUC nuevo (Primera compra)
                      </span>
                    </label>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Descripción del Beneficio:
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Ej. 15% OFF en pinturas satinadas por Fiestas de Guayaquil"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#FFD100]" />
                    <span>Guardar y Publicar Cupón</span>
                  </button>
                </div>
              </form>

              {/* Coupons List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cupones Registrados ({coupons.filter((c) => c.active).length} activos de {coupons.length}):
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-extrabold text-[#0B2861]">
                    <input
                      type="checkbox"
                      data-testid="modal-master-coupon-checkbox"
                      checked={coupons.length > 0 && coupons.every((c) => c.active)}
                      onChange={(e) => {
                        onToggleAllCoupons?.(e.target.checked);
                        onShowToast?.(
                          e.target.checked
                            ? 'Todos los cupones han sido activados.'
                            : 'Todos los cupones han sido desactivados.'
                        );
                      }}
                      className="w-4 h-4 accent-[#0B2861] rounded cursor-pointer"
                    />
                    <span>Check Activar / Desactivar Todos los Cupones</span>
                  </label>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {coupons.map((c) => {
                    const cTheme = getActiveFestiveTheme(c.themeAffinity || 'corporativo');
                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          c.active ? 'hover:bg-slate-50/80' : 'bg-slate-50/60 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <label
                            className="flex items-center gap-1.5 pt-1 cursor-pointer select-none"
                            title={c.active ? 'Desactivar cupón' : 'Activar cupón'}
                          >
                            <input
                              type="checkbox"
                              data-testid={`modal-coupon-checkbox-${c.code}`}
                              checked={c.active}
                              onChange={() => {
                                onToggleCouponActive?.(c.id);
                                onShowToast?.(
                                  `Cupón ${c.code} ${!c.active ? 'activado' : 'desactivado'}.`
                                );
                              }}
                              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                            />
                          </label>
                          <span className="text-xl p-1.5 rounded-xl bg-slate-100">{cTheme.iconSymbol}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-mono font-black text-sm px-2 py-0.5 rounded-md ${
                                  c.active
                                    ? 'text-[#0B2861] bg-slate-100'
                                    : 'text-slate-400 bg-slate-100 line-through'
                                }`}
                              >
                                {c.code}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                -{c.discountPct}% OFF
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  c.active
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-300 text-slate-700'
                                }`}
                              >
                                {c.active ? 'Activo' : 'Desactivado'}
                              </span>
                              {c.onlyNewClients && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                                  Solo Cliente Nuevo
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-xs mt-1">{c.description}</p>
                            <span className="text-[10px] text-slate-400">
                              Válido hasta: {c.expiresAt} · Compra mín: ${c.minPurchaseUsd}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={c.active}
                              onChange={() => onToggleCouponActive?.(c.id)}
                              className="w-3.5 h-3.5 accent-emerald-600 rounded"
                            />
                            <span>{c.active ? 'Activo' : 'Inactivo'}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => onDeleteCoupon(c.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Eliminar cupón"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flyers' && (
            <div className="space-y-6">
              {/* Form to create new flyer flash */}
              <form onSubmit={handleCreateFlyer} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#E3000F]" />
                  <span>+ Crear Flyer Flash / Oferta Relámpago</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Título Promocional *
                    </label>
                    <input
                      type="text"
                      required
                      value={newFlyerTitle}
                      onChange={(e) => setNewFlyerTitle(e.target.value)}
                      placeholder="Ej. ¡Flash Julino · Guayaquil!"
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Badge de Oferta:
                    </label>
                    <input
                      type="text"
                      value={newFlyerBadge}
                      onChange={(e) => setNewFlyerBadge(e.target.value)}
                      placeholder="OFERTA RELÁMPAGO 48H"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Subtítulo Explicativo:
                    </label>
                    <input
                      type="text"
                      value={newFlyerSubtitle}
                      onChange={(e) => setNewFlyerSubtitle(e.target.value)}
                      placeholder="Ej. Duralín Forte Galón con 25% de ahorro directo"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Producto en Promoción:
                    </label>
                    <select
                      value={newFlyerSku}
                      onChange={(e) => {
                        const selSku = e.target.value;
                        setNewFlyerSku(selSku);
                        const match = inventory.find((i) => i.sku === selSku);
                        if (match) {
                          setNewFlyerOriginalPrice(match.unitPrice);
                          setNewFlyerPromoPrice(Math.round(match.unitPrice * 0.8 * 100) / 100);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                    >
                      {inventory.map((inv) => (
                        <option key={inv.sku} value={inv.sku}>
                          {inv.name} ({inv.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Temática Festiva de la Oferta:
                    </label>
                    <select
                      value={newFlyerTheme}
                      onChange={(e) =>
                        setNewFlyerTheme(e.target.value as EcuadorFestiveThemeId)
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                    >
                      {Object.values(ECUADOR_FESTIVE_THEMES).map((th) => (
                        <option key={th.id} value={th.id}>
                          {th.name.split('(')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Precio Normal ($):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newFlyerOriginalPrice}
                        onChange={(e) => setNewFlyerOriginalPrice(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Precio Flash ($):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newFlyerPromoPrice}
                        onChange={(e) => setNewFlyerPromoPrice(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs font-mono font-black text-center text-[#E3000F] bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Días de Vigencia:</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={newFlyerCountdownDays}
                        onChange={(e) => setNewFlyerCountdownDays(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#E3000F] hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-[#FFD100]" />
                    <span>Publicar Flyer Flash</span>
                  </button>
                </div>
              </form>

              {/* Active Flyers Gallery */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Flyers Flash Activos:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flyers.map((f) => {
                    const fTheme = getActiveFestiveTheme(f.activeTheme);
                    return (
                      <div
                        key={f.id}
                        className={`rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-md flex flex-col justify-between`}
                      >
                        <div className={`p-4 bg-gradient-to-r ${f.bannerGradient} text-white space-y-1 relative`}>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#FFD100] text-[#0B2861]">
                              {f.badge}
                            </span>
                            <span className="text-lg">{fTheme.iconSymbol}</span>
                          </div>
                          <h4 className="text-base font-black leading-tight pt-1">{f.title}</h4>
                          <p className="text-[11px] text-slate-200">{f.subtitle}</p>
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">
                                SKU: {f.sku}
                              </span>
                              <p className="font-extrabold text-slate-900 text-xs truncate max-w-[160px]">
                                {f.productName}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs line-through text-slate-400 font-mono block">
                                ${f.originalPrice.toFixed(2)}
                              </span>
                              <strong className="text-base font-black text-[#E3000F] font-mono block">
                                ${f.promotionalPrice.toFixed(2)}
                              </strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Activo en Tienda</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onDeleteFlyer(f.id)}
                              className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                            >
                              Eliminar Flyer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
