import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Gift,
  Palette,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { EcuadorFestiveThemeId } from '../types/erp';
import {
  ECUADOR_FESTIVE_THEMES,
  FestiveThemeConfig,
  getActiveFestiveTheme,
} from '../utils/ecuadorThemes';

interface EcuadorFestiveThemeBarProps {
  activeThemeId: EcuadorFestiveThemeId;
  onSelectTheme?: (themeId: EcuadorFestiveThemeId) => void;
  onOpenCouponManager?: () => void;
  isReadOnly?: boolean;
}

export const EcuadorFestiveThemeBar: React.FC<EcuadorFestiveThemeBarProps> = ({
  activeThemeId,
  onSelectTheme,
  onOpenCouponManager,
  isReadOnly = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const theme = getActiveFestiveTheme(activeThemeId);
  const themeList = Object.values(ECUADOR_FESTIVE_THEMES);

  return (
    <aside
      aria-label="Barra temática festiva del Ecuador"
      data-z-layer="erp-bar"
      style={{ zIndex: 9999 }}
      className={`erp-interactive-bar w-full bg-gradient-to-r ${theme.bannerGradient} text-white transition-all duration-500 border-b-2 border-[#FFD100]/60 shadow-md relative z-[9999]`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Festive Message & Dynamic Icon Symbol */}
        <div className="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span className="text-xl animate-bounce-subtle shrink-0" role="img" aria-label="Festividad">
            {theme.iconSymbol}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/30 text-[#FFD100] font-black uppercase tracking-wider text-[10px] border border-white/20">
            {theme.name.split('(')[0].trim()}
          </span>
          <p className="font-semibold text-blue-50 text-[11px] sm:text-xs">
            {theme.bannerMessage}
          </p>
        </div>

        {/* Informative Festive Celebration Badge for Public Storefront (Zero Configuration) */}
        {isReadOnly || !onSelectTheme ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-black/30 border border-white/20 text-[#FFD100] text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
              <span>{theme.festiveEmoji}</span>
              <span>{theme.dates}</span>
            </span>
          </div>
        ) : (
          /* Admin / Internal Theme Switcher & Actions */
          <div className="flex items-center gap-2 shrink-0">
            {onOpenCouponManager && (
              <button
                type="button"
                onClick={onOpenCouponManager}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Crear Cupones & Flyers Flash"
              >
                <Gift className="w-3.5 h-3.5 text-[#FFD100]" />
                <span className="hidden md:inline">Cupones &amp; Flyers Flash</span>
              </button>
            )}

            {/* Festive Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                aria-expanded={isDropdownOpen}
                aria-label="Seleccionar temática festiva de Ecuador"
              >
                <Palette className="w-3.5 h-3.5 text-[#FFD100]" />
                <span className="hidden sm:inline">Temática:</span>
                <span className="text-[#FFD100] font-black">{theme.name.split('(')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-950/95 border-2 border-[#FFD100] p-2 shadow-2xl backdrop-blur-md z-50 text-white animate-fade-in-up"
              >
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FFD100]" />
                    <span className="text-xs font-black uppercase text-[#FFD100]">
                      Fechas Festivas del Ecuador
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-1 max-h-80 overflow-y-auto space-y-1">
                  {themeList.map((t) => {
                    const isSelected = t.id === activeThemeId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSelectTheme(t.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#0B2861] to-[#009FE3] border border-[#FFD100] font-black'
                            : 'hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{t.iconSymbol}</span>
                          <div className="truncate">
                            <span className="font-extrabold block text-white truncate text-[11px] sm:text-xs">
                              {t.name}
                            </span>
                            <span className="text-[10px] text-slate-300 block truncate">
                              {t.dates}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-black text-[#FFD100] shrink-0">
                            ✓ ACTIVO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </aside>
  );
};
