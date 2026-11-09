import React from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutGrid,
  Palette,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  EcuadorFestiveThemeId,
  StorefrontSectionId,
  StorefrontSectionsVisibilityMap,
} from '../types/erp';
import {
  STOREFRONT_SECTION_DESCRIPTORS,
  computeAdaptiveNavbarMetrics,
  getActiveStorefrontSections,
} from '../utils/storefrontSectionsConfig';
import {
  ECUADOR_FESTIVE_THEMES,
  getActiveFestiveTheme,
} from '../utils/ecuadorThemes';
import { ThematicCornerIllustration } from './ThematicCornerIllustration';

interface ErpStorefrontSectionsManagerViewProps {
  sectionsVisibility: StorefrontSectionsVisibilityMap;
  onToggleSection: (sectionId: StorefrontSectionId, forceValue?: boolean) => void;
  onSetAllSections: (enableAll: boolean) => void;
  activeThemeId: EcuadorFestiveThemeId;
  onSelectTheme: (themeId: EcuadorFestiveThemeId) => void;
  onSwitchToStorefront: () => void;
}

export const ErpStorefrontSectionsManagerView: React.FC<
  ErpStorefrontSectionsManagerViewProps
> = ({
  sectionsVisibility,
  onToggleSection,
  onSetAllSections,
  activeThemeId,
  onSelectTheme,
  onSwitchToStorefront,
}) => {
  const activeTheme = getActiveFestiveTheme(activeThemeId);
  const activeSections = getActiveStorefrontSections(sectionsVisibility);
  const navMetrics = computeAdaptiveNavbarMetrics(sectionsVisibility);
  const allThemes = Object.values(ECUADOR_FESTIVE_THEMES);

  return (
    <div className="space-y-8" data-testid="erp-storefront-sections-manager">
      {/* Header Banner with 3D Glassmorphism & Thematic Illustration */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-r ${activeTheme.bannerGradient} skeuo-glass-panel border-2`}
        style={{ borderColor: activeTheme.secondaryColor }}
      >
        <ThematicCornerIllustration themeId={activeThemeId} position="top-right" size="lg" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pr-12">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/25 text-xs font-black uppercase tracking-wider text-[#FFD100]">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Control Maestro ERP · Arquitectura Web &amp; Ambientación 3D</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display">
              Gestión de Apartados de la Página Web &amp; Temáticas Interactivas
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Active o desactive en tiempo real los apartados visibles en la barra superior de la tienda pública.
              La navegación se acopla automáticamente a los módulos activos manteniendo siempre los logotipos de{' '}
              <strong>Industrial Latina</strong> e <strong>Induless</strong> en alta definición y máximo protagonismo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              data-testid="erp-enable-all-sections-btn"
              onClick={() => onSetAllSections(true)}
              className="px-4 py-2.5 rounded-xl bg-[#FFD100] text-[#0B2861] font-black text-xs uppercase tracking-wide cursor-pointer skeuo-btn-3d"
            >
              Activar Todos ({STOREFRONT_SECTION_DESCRIPTORS.length})
            </button>
            <button
              type="button"
              data-testid="erp-essential-sections-btn"
              onClick={() => onSetAllSections(false)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs cursor-pointer skeuo-btn-3d"
            >
              Modo Catálogo Esencial
            </button>
            <button
              type="button"
              onClick={onSwitchToStorefront}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wide cursor-pointer skeuo-btn-3d"
            >
              Ver Tienda Pública →
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview of Coupled Top Bar + High-Resolution Logos */}
      <div className="skeuo-glass-card rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#0B2861] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#E3000F]" />
              <span>Vista Previa en Vivo · Barra Superior Acoplada ({activeSections.length} apartados activos)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Observe cómo la barra superior se adapta dinámicamente sin comprimir los logotipos oficiales.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
            Protagonismo de Logos HD Activo
          </span>
        </div>

        {/* Simulated Storefront Navbar Preview */}
        <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-inner flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Protected High-Res Logos Pedestal */}
          <div className="logo-pedestal-3d px-4 py-2 rounded-2xl flex items-center gap-4 shrink-0">
            <img
              src="/assets/aistudio/Industrial_Latina_2_f5b18e35.png"
              alt="Industrial Latina"
              className="h-11 sm:h-12 w-auto object-contain logo-hd-render"
            />
            <span className="h-8 w-0.5 bg-slate-200 rounded-full" aria-hidden="true" />
            <img
              src="/assets/aistudio/Induless_2_fe52db1f.png"
              alt="Induless"
              className="h-9 sm:h-10 w-auto object-contain logo-hd-render"
            />
          </div>

          {/* Dynamically Coupled Active Sections */}
          <div className={`flex flex-wrap items-center justify-end ${navMetrics.containerGapClass}`}>
            {activeSections.map((sec) => (
              <span
                key={sec.id}
                className={`${navMetrics.itemPaddingClass} ${navMetrics.fontSizeClass} font-extrabold uppercase tracking-wider rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5`}
              >
                <span>{sec.navShortLabel}</span>
                {sec.badgeText && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-black rounded ${sec.badgeColorClass || 'bg-[#FFD100] text-[#0B2861]'}`}>
                    {sec.badgeText}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Individual Storefront Sections Toggle Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-[#0B2861]" />
            <span>Interruptores de Visibilidad por Apartado Web</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-600">
            {activeSections.length} de {STOREFRONT_SECTION_DESCRIPTORS.length} activos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STOREFRONT_SECTION_DESCRIPTORS.map((sec) => {
            const isEnabled = Boolean(sectionsVisibility[sec.id]);
            return (
              <div
                key={sec.id}
                data-testid={`erp-section-card-${sec.id}`}
                className={`skeuo-glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                  isEnabled
                    ? 'border-2 border-[#0B2861]/30'
                    : 'opacity-70 bg-slate-100/80 border border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        ID: {sec.id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <span>{sec.label}</span>
                        {sec.badgeText && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-black rounded ${sec.badgeColorClass}`}>
                            {sec.badgeText}
                          </span>
                        )}
                      </h3>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      data-testid={`erp-section-toggle-${sec.id}`}
                      onClick={() => onToggleSection(sec.id)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer skeuo-btn-3d shrink-0 ${
                        isEnabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>ACTIVO</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>OCULTO</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sec.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500">
                    Botón en Barra: <strong className="text-slate-800">{sec.navShortLabel}</strong>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-extrabold ${
                      isEnabled ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Visible en Web
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Desactivado
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Interactive Thematic Ambience Selector (Including Halloween & Black Friday) */}
      <div className="skeuo-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#E3000F]">
              <Sparkles className="w-4 h-4" />
              <span>Eskeuomorfismo 3D · Glassmorphism · Dibujitos SVG &amp; Partículas Canvas</span>
            </div>
            <h2 className="text-xl font-black text-[#0B2861] mt-1 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              <span>Selector de Ambientación Temática Global (Incluye Halloween y Black Friday)</span>
            </h2>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-[#0B2861] text-[#FFD100] text-xs font-black">
            Activa: {activeTheme.iconSymbol} {activeTheme.name.split('(')[0]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allThemes.map((t) => {
            const isSelected = t.id === activeThemeId;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`erp-theme-card-${t.id}`}
                onClick={() => onSelectTheme(t.id)}
                className={`group relative text-left rounded-2xl p-5 transition-all cursor-pointer skeuo-glass-card overflow-hidden ${
                  isSelected
                    ? 'ring-4 ring-[#0B2861] border-2 border-[#FFD100]'
                    : 'hover:border-slate-300'
                }`}
              >
                <ThematicCornerIllustration themeId={t.id} position="top-right" size="md" />

                <div className="pr-12 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.iconSymbol}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ TEMÁTICA ACTIVA' : 'APLICAR TEMA'}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{t.name}</h3>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{t.tagline}</p>
                  <p className="text-[10px] font-mono text-slate-500">{t.illustrationLabel}</p>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-1.5 pt-2">
                    {t.particleColors.map((hex, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-black/15 shadow-2xs"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
