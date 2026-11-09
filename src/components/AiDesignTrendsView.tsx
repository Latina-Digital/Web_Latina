import React, { useEffect, useState } from 'react';
import {
  Check,
  Compass,
  Lightbulb,
  Palette,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { InventoryItem } from '../types/erp';

export interface TrendItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  suitableRooms?: string[];
  relatedProducts: {
    sku: string;
    name: string;
    role: string;
    company: string;
    estimatedPrice: number;
  }[];
}

import { EcuadorFestiveThemeId } from '../types/erp';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';

interface AiDesignTrendsViewProps {
  inventory: InventoryItem[];
  onAddToCart: (item: InventoryItem, qty: number) => void;
  onShowToast?: (msg: string) => void;
  activeThemeId?: EcuadorFestiveThemeId;
}

export const AiDesignTrendsView: React.FC<AiDesignTrendsViewProps> = ({
  inventory,
  onAddToCart,
  onShowToast,
  activeThemeId = 'quito',
}) => {
  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [introManifesto, setIntroManifesto] = useState<string>('');
  const [yearEdition, setYearEdition] = useState<string>('Bienal Ecuador 2025-2026');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userPromptQuery, setUserPromptQuery] = useState<string>('');
  const [isConsultingAi, setIsConsultingAi] = useState<boolean>(false);

  const fetchTrends = async (customContext?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'arquitectura_2026',
          roomType: customContext || 'general',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.trends && Array.isArray(data.trends)) {
          setTrends(data.trends);
        }
        if (data.introManifesto) setIntroManifesto(data.introManifesto);
        if (data.yearEdition) setYearEdition(data.yearEdition);
      }
    } catch (err) {
      console.warn('Error fetching trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleCustomAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPromptQuery.trim()) return;
    setIsConsultingAi(true);
    await fetchTrends(userPromptQuery.trim());
    setIsConsultingAi(false);
    onShowToast?.('¡Tendencias arquitectónicas actualizadas por IA!');
  };

  const handleAddLookToCart = (trend: TrendItem) => {
    let addedCount = 0;
    trend.relatedProducts.forEach((prod) => {
      const inv = inventory.find((i) => i.sku === prod.sku);
      if (inv) {
        onAddToCart(inv, 1);
        addedCount++;
      }
    });
    onShowToast?.(`¡Se añadieron ${addedCount} productos de la tendencia "${trend.title}" al carrito!`);
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2861] text-[#FFD100] text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor de Tendencias Arquitectónicas &amp; IA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B2861] font-display">
            Tendencias de Diseño Conectadas a Productos Reales
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            {introManifesto ||
              'Análisis en tiempo real impulsado por IA que interpreta las vanguardias de color y materiales en Ecuador y las conecta con pinturas Industrial Latina y ferretería Induless.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchTrends()}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0B2861] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar Análisis IA</span>
          </button>
        </div>
      </div>

      {/* Interactive AI Prompt Consultation Bar */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0B2861] to-[#13314C] text-white shadow-xl space-y-3 border-2 border-[#FFD100]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-[#FFD100] flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span>Consulta a la IA: Relaciona una Tendencia con el Catálogo</span>
          </span>
          <span className="text-[10px] text-blue-200">Gemini 3.8 Flash Engine</span>
        </div>

        <form onSubmit={handleCustomAiQuery} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={userPromptQuery}
            onChange={(e) => setUserPromptQuery(e.target.value)}
            placeholder="Ej. 'Deseo remodelar un restaurante moderno en Guayaquil con estilo Japandi y plantas'"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD100]"
          />
          <button
            type="submit"
            disabled={isConsultingAi || !userPromptQuery.trim()}
            className="px-6 py-3 rounded-2xl bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            {isConsultingAi ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isConsultingAi ? 'Analizando con IA...' : 'Generar Tendencia con IA'}</span>
          </button>
        </form>
      </div>

      {/* Trends Grid */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-[#0B2861] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">
            Conectando con el motor de IA para correlacionar paletas y productos...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {trends.map((trend) => (
            <div
              key={trend.id}
              className="bg-white rounded-3xl overflow-hidden border-2 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              style={{
                borderColor: '#e2e8f0',
                borderTopWidth: '5px',
                borderTopColor: activeFestiveTheme.accentColor,
              }}
            >
              <div>
                {/* Palette Bar Header */}
                <div className="p-6 border-b border-slate-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0B2861]">
                        {trend.tagline}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                        <span>{activeFestiveTheme.iconSymbol}</span>
                        <span>{activeFestiveTheme.heroBadge}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: trend.primaryHex }}
                        title={`Color Principal: ${trend.primaryHex}`}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: trend.secondaryHex }}
                        title={`Color Secundario: ${trend.secondaryHex}`}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: trend.accentHex }}
                        title={`Color Acento: ${trend.accentHex}`}
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 leading-snug font-display">
                    {trend.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">{trend.description}</p>

                  {trend.suitableRooms && trend.suitableRooms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {trend.suitableRooms.map((room, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600"
                        >
                          {room}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Related Products Breakdown */}
                <div className="p-6 space-y-3">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wide block">
                    Productos del Catálogo Relacionados por la IA:
                  </span>

                  <div className="space-y-2">
                    {trend.relatedProducts.map((prod) => {
                      const isInduless = prod.company.toLowerCase().includes('induless');
                      const invItem = inventory.find((i) => i.sku === prod.sku);
                      return (
                        <div
                          key={prod.sku}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isInduless
                                    ? 'bg-[#D8235A] text-white'
                                    : 'bg-[#0B2861] text-[#FFD100]'
                                }`}
                              >
                                {isInduless ? 'Induless' : 'Latina'}
                              </span>
                              <span className="font-mono font-bold text-slate-500">{prod.sku}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600 font-medium truncate">{prod.role}</span>
                            </div>
                            <h4 className="font-extrabold text-slate-900 truncate mt-0.5">
                              {prod.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono font-extrabold text-slate-900">
                              ${prod.estimatedPrice.toFixed(2)}
                            </span>
                            {invItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  onAddToCart(invItem, 1);
                                  onShowToast?.(`¡${invItem.name} añadido al carrito!`);
                                }}
                                className="p-2 rounded-xl bg-white hover:bg-[#0B2861] hover:text-white border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
                                title="Añadir al carrito"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {trend.relatedProducts.length} productos combinados
                </span>
                <button
                  type="button"
                  onClick={() => handleAddLookToCart(trend)}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-[#FFD100]" />
                  <span>Comprar este Look Completo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
