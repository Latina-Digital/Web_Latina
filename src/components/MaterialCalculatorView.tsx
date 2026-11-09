import React, { useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Download,
  Droplets,
  FileText,
  Layers,
  Ruler,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { CompanyBrand, InventoryItem, EcuadorFestiveThemeId } from '../types/erp';
import { calculateProductRequirementByMeasure } from '../utils/erpLogic';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';
import {
  generateReportExecutiveHtml,
  triggerExecutiveDocumentDownload,
} from '../utils/downloadHelper';
import { ProductSchematicSvg } from './ProductSchematicSvg';
import { ExecutiveDocumentPreviewModal } from './ExecutiveDocumentPreviewModal';

export interface MaterialCalculatorViewProps {
  inventory: InventoryItem[];
  onAddCalculatedToCart: (
    item: InventoryItem,
    quantity: number,
    presentationName: string
  ) => void;
  onOpenTechSheet?: (item: InventoryItem) => void;
  activeThemeId?: EcuadorFestiveThemeId;
}

const QUICK_DIMENSION_PRESETS = [
  { label: 'Pared Habitación (6m × 2.8m)', width: 6, height: 2.8, coats: 2 },
  { label: 'Fachada Residencial (12m × 6m)', width: 12, height: 6, coats: 2 },
  { label: 'Piso Sala / Cocina (8m × 4.5m)', width: 8, height: 4.5, coats: 1 },
  { label: 'Cubierta / Galpón (15m × 8m)', width: 15, height: 8, coats: 2 },
];

export const MaterialCalculatorView: React.FC<MaterialCalculatorViewProps> = ({
  inventory,
  onAddCalculatedToCart,
  onOpenTechSheet,
  activeThemeId,
}) => {
  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);
  const [brandFilter, setBrandFilter] = useState<'todas' | CompanyBrand>('todas');
  const [selectedSku, setSelectedSku] = useState<string>(
    inventory[0]?.sku || 'LAT-LVA-01'
  );
  const [widthMeters, setWidthMeters] = useState<number>(8);
  const [heightMeters, setHeightMeters] = useState<number>(3.5);
  const [coatsOrFactor, setCoatsOrFactor] = useState<number>(2);
  const [wastePct, setWastePct] = useState<number>(5);
  const [presentationMode, setPresentationMode] = useState<
    'galon' | 'caneca' | 'litro' | 'estandar'
  >('galon');
  const [executiveModalDoc, setExecutiveModalDoc] = useState<{
    isOpen: boolean;
    title: string;
    html: string;
    filename: string;
  } | null>(null);

  const filteredInventory = useMemo(() => {
    if (brandFilter === 'todas') return inventory;
    return inventory.filter((item) => item.company === brandFilter);
  }, [inventory, brandFilter]);

  const selectedProduct = useMemo(() => {
    return (
      filteredInventory.find((i) => i.sku === selectedSku) ||
      filteredInventory[0] ||
      inventory[0]
    );
  }, [filteredInventory, inventory, selectedSku]);

  const handleBrandSwitch = (nextBrand: 'todas' | CompanyBrand) => {
    setBrandFilter(nextBrand);
    const list =
      nextBrand === 'todas'
        ? inventory
        : inventory.filter((i) => i.company === nextBrand);
    if (list.length > 0 && !list.some((i) => i.sku === selectedSku)) {
      setSelectedSku(list[0].sku);
    }
  };

  const calculationResult = useMemo(() => {
    if (!selectedProduct) return null;
    const wasteMultiplier = 1 + Math.max(0, Math.min(25, wastePct)) / 100;
    const adjustedWidth = Math.round(widthMeters * Math.sqrt(wasteMultiplier) * 100) / 100;
    const adjustedHeight =
      Math.round(heightMeters * Math.sqrt(wasteMultiplier) * 100) / 100;

    return calculateProductRequirementByMeasure({
      item: selectedProduct,
      widthMeters: adjustedWidth,
      heightOrLengthMeters: adjustedHeight,
      coatsOrFactor,
      presentationMode,
    });
  }, [
    selectedProduct,
    widthMeters,
    heightMeters,
    coatsOrFactor,
    wastePct,
    presentationMode,
  ]);

  if (!selectedProduct || !calculationResult) {
    return null;
  }

  const isInduless = selectedProduct.company === 'induless';
  const rawAreaOrLength = Math.round(widthMeters * heightMeters * 10) / 10;

  const handleDownloadCalculationReport = () => {
    if (!selectedProduct || !calculationResult) return;
    const docHtml = generateReportExecutiveHtml({
      reportTitle: 'Hoja de Cubicaje & Rendimiento Técnico de Materiales',
      reportSubtitle: `Cálculo de Aplicación para ${selectedProduct.name} (${selectedProduct.sku})`,
      summaryKpis: [
        { label: 'Superficie Neta', value: `${rawAreaOrLength} m²`, color: '#0B2861' },
        { label: 'Manos / Factor', value: `${coatsOrFactor} Capas`, color: '#D97706' },
        {
          label: 'Unidades Sugeridas',
          value: `${calculationResult.recommendedUnits} ${calculationResult.unitName}`,
          color: '#059669',
        },
        {
          label: 'Presupuesto Estimado',
          value: `$${calculationResult.estimatedBudgetUsd.toFixed(2)} USD`,
          color: '#0B2861',
        },
      ],
      headers: ['Parámetro Técnico de Obra', 'Detalle Estimado', 'Observación / Norma'],
      rows: [
        [
          'Producto Evaluado',
          `${selectedProduct.name} [SKU: ${selectedProduct.sku}]`,
          `Línea Oficial ${selectedProduct.company === 'industrial_latina' ? 'Industrial Latina' : 'Induless'}`,
        ],
        [
          'Dimensiones de la Superficie',
          `${widthMeters}m (Ancho) × ${heightMeters}m (Alto / Longitud)`,
          `Área neta calculada: ${rawAreaOrLength} m²`,
        ],
        [
          'Margen de Seguridad (Desperdicio)',
          `${wastePct}% adicional para cortes/irregularidades`,
          'Práctica estándar en construcción',
        ],
        [
          'Número de Manos / Capas',
          `${coatsOrFactor} manos de aplicación`,
          'Conforme a especificación del fabricante',
        ],
        [
          'Rendimiento Teórico Nominal',
          selectedProduct.technicalSheet?.yieldOrCoverage || '20 - 25 m² por galón a 2 manos',
          selectedProduct.technicalSheet?.normative || 'NTE INEN 2093',
        ],
        [
          'Dilución con Agua Limpia',
          calculationResult.waterDilutionLiters > 0
            ? `${calculationResult.waterDilutionLiters} Litros de agua limpia`
            : 'Listo para uso directo / Sin dilución',
          'Homogeneizar mecánicamente 3 minutos antes de aplicar',
        ],
        [
          'Recomendación de Complementos',
          calculationResult.complementaryDetail || 'Fijador de superficie y lija fina',
          'Garantiza adherencia máxima y durabilidad de película',
        ],
        [
          'Presentación Recomendada',
          calculationResult.unitName,
          `Total a despachar: ${calculationResult.recommendedUnits} unidades`,
        ],
        [
          'Presupuesto Estimado (PVP)',
          `$${calculationResult.estimatedBudgetUsd.toFixed(2)} USD`,
          'Precios oficiales vigentes (IVA 15% desglosado en facturación SRI)',
        ],
      ],
    });

    const filename = `cubicaje_${selectedProduct.sku.toLowerCase()}_${rawAreaOrLength}m2`;
    setExecutiveModalDoc({
      isOpen: true,
      title: `Hoja de Cubicaje Oficial · ${selectedProduct.sku} - ${selectedProduct.name}`,
      html: docHtml,
      filename,
    });
    triggerExecutiveDocumentDownload(docHtml, filename);
  };

  return (
    <section
      id="calculadora-medida"
      aria-label="Calculadora de materiales a la medida Industrial Latina e Induless"
      className="py-14 max-w-[1400px] mx-auto px-4 sm:px-8 w-full space-y-8"
    >
      {/* Section Header & Brand Filter */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0E3B7C]">
            <Calculator className="w-4 h-4 text-[#D91E26]" />
            <span>Cálculo Técnico Oficial · Industrial Latina &amp; Induless Ecuador</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            Calculadora de Materiales según Producto y Dimensiones a la Medida
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Seleccione un producto de <strong>Industrial Latina</strong> o{' '}
            <strong>Induless</strong>, ingrese las dimensiones personalizadas de su obra y
            obtenga automáticamente la cantidad exacta requerida según su ficha técnica oficial
            (rendimiento por m², dilución en agua, traslape de planchas o metraje de cable).
          </p>
        </div>

        {/* Entity Switcher inside Calculator */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => handleBrandSwitch('todas')}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              brandFilter === 'todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            Todas ({inventory.length})
          </button>
          <button
            type="button"
            onClick={() => handleBrandSwitch('industrial_latina')}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              brandFilter === 'industrial_latina'
                ? 'bg-[#0E3B7C] text-white shadow-xs'
                : 'text-[#0E3B7C] hover:bg-white/60'
            }`}
          >
            Industrial Latina
          </button>
          <button
            type="button"
            onClick={() => handleBrandSwitch('induless')}
            className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              brandFilter === 'induless'
                ? 'bg-[#D8235A] text-white shadow-xs'
                : 'text-[#D8235A] hover:bg-white/60'
            }`}
          >
            Induless
          </button>
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Product Selection, Presets & Custom Dimensions */}
        <div
          className="lg:col-span-7 bg-white rounded-2xl border-2 p-6 space-y-6 shadow-xs transition-all"
          style={{
            borderColor: '#e2e8f0',
            borderTopWidth: '6px',
            borderTopColor: activeFestiveTheme.accentColor,
          }}
        >
          {/* Festive Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
              <span>{activeFestiveTheme.iconSymbol}</span>
              <span>Parámetros de Obra · {activeFestiveTheme.name.split('(')[0]}</span>
            </span>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
              {activeFestiveTheme.heroBadge}
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Medidas Rápidas de Obra (Ecuador):
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_DIMENSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWidthMeters(preset.width);
                    setHeightMeters(preset.height);
                    setCoatsOrFactor(preset.coats);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Selector */}
            <div className="sm:col-span-2">
              <label
                htmlFor="material-calc-product-select"
                className="block text-xs font-extrabold text-slate-800 mb-1.5"
              >
                1. Seleccione el Producto (Industrial Latina o Induless):
              </label>
              <select
                id="material-calc-product-select"
                value={selectedProduct.sku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E3B7C]"
              >
                {brandFilter !== 'induless' && (
                  <optgroup label="INDUSTRIAL LATINA — Pinturas, Selladores, Empastes y Morteros">
                    {inventory
                      .filter((i) => i.company === 'industrial_latina')
                      .map((item) => (
                        <option key={item.sku} value={item.sku}>
                          [{item.sku}] {item.name} — (${item.unitPrice.toFixed(2)} / {item.unit})
                        </option>
                      ))}
                  </optgroup>
                )}
                {brandFilter !== 'industrial_latina' && (
                  <optgroup label="INDULESS — Techoforte, Cables CONDEX, Iluminación LED y Ferretería">
                    {inventory
                      .filter((i) => i.company === 'induless')
                      .map((item) => (
                        <option key={item.sku} value={item.sku}>
                          [{item.sku}] {item.name} — (${item.unitPrice.toFixed(2)} / {item.unit})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Dimension 1: Width / Length */}
            <div>
              <label
                htmlFor="material-calc-width"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {selectedProduct.calculatorType === 'conductor_electrico'
                  ? 'Longitud del Circuito (Metros)'
                  : 'Largo / Ancho de Superficie (Metros)'}
              </label>
              <div className="relative">
                <Ruler className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="material-calc-width"
                  type="number"
                  min={0.5}
                  max={1000}
                  step={0.5}
                  value={widthMeters}
                  onChange={(e) => setWidthMeters(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Dimension 2: Height / Depth */}
            <div>
              <label
                htmlFor="material-calc-height"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {selectedProduct.calculatorType === 'conductor_electrico'
                  ? 'Número de Circuitos / Niveles'
                  : 'Alto / Fondo de Superficie (Metros)'}
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="material-calc-height"
                  type="number"
                  min={0.5}
                  max={1000}
                  step={0.5}
                  value={heightMeters}
                  onChange={(e) => setHeightMeters(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Coats / Layers / Poles */}
            <div>
              <label
                htmlFor="material-calc-coats"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {selectedProduct.calculatorType === 'conductor_electrico'
                  ? 'Polos / Líneas por Circuito'
                  : 'Manos / Capas de Aplicación'}
              </label>
              <select
                id="material-calc-coats"
                value={coatsOrFactor}
                onChange={(e) => setCoatsOrFactor(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              >
                <option value={1}>1 Mano / Capa Simple</option>
                <option value={2}>2 Manos / Capas (Recomendado Norma INEN)</option>
                <option value={3}>3 Manos / Polos (Alta Exigencia / Trifásico)</option>
              </select>
            </div>

            {/* Presentation / Container or Waste Margin */}
            {selectedProduct.calculatorType === 'pintura' ? (
              <div>
                <label
                  htmlFor="material-calc-presentation"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Presentación de Envase Latina:
                </label>
                <select
                  id="material-calc-presentation"
                  value={presentationMode}
                  onChange={(e) =>
                    setPresentationMode(
                      e.target.value as 'galon' | 'caneca' | 'litro' | 'estandar'
                    )
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  <option value="galon">Galón (3.785 L) — Rinde 18 a 20 m²</option>
                  <option value="caneca">Caneca (5 Gal / 18.92 L) — Rinde 90 a 100 m²</option>
                  <option value="litro">Litro (0.946 L) — Rinde 4.5 a 5 m²</option>
                </select>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="material-calc-waste"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Margen de Desperdicio / Corte (%):
                </label>
                <select
                  id="material-calc-waste"
                  value={wastePct}
                  onChange={(e) => setWastePct(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  <option value={0}>0% (Medida Neta Exacta)</option>
                  <option value={5}>+5% (Reserva Estándar de Obra)</option>
                  <option value={10}>+10% (Superficie Irregular / Cortes)</option>
                </select>
              </div>
            )}
          </div>

          {/* Selected Product Technical Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                <ProductSchematicSvg
                  sku={selectedProduct.sku}
                  category={selectedProduct.category}
                  company={selectedProduct.company}
                  className="w-full h-full"
                />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      isInduless
                        ? 'bg-[#D8235A] text-white'
                        : 'bg-[#0E3B7C] text-white'
                    }`}
                  >
                    {isInduless ? 'Induless' : 'Industrial Latina'}
                  </span>
                  <span className="font-mono font-bold text-slate-600">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>
                <p className="font-bold text-slate-900">{selectedProduct.name}</p>
                <p className="text-slate-600 line-clamp-2">{selectedProduct.description}</p>
              </div>
            </div>

            {onOpenTechSheet && (
              <button
                type="button"
                onClick={() => onOpenTechSheet(selectedProduct)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#0E3B7C]" />
                <span>Ficha Técnica</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Calculation Output Card */}
        <div
          className={`lg:col-span-5 bg-gradient-to-br ${activeFestiveTheme.bannerGradient} text-white rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl border-2 transition-all`}
          style={{
            borderColor: activeFestiveTheme.secondaryColor || '#F5C400',
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className="px-2.5 py-1 rounded text-[11px] font-extrabold uppercase shadow-xs"
                style={{
                  backgroundColor: activeFestiveTheme.secondaryColor || '#F5C400',
                  color: activeFestiveTheme.primaryColor || '#0B2861',
                }}
              >
                {activeFestiveTheme.iconSymbol} Resultado Técnico a la Medida
              </span>
              <span className="font-mono text-xs text-slate-200">
                Base: {rawAreaOrLength} m² · Total: {calculationResult.measureUnitLabel}
              </span>
            </div>

            {/* Primary Quantity Output */}
            <div className="p-5 rounded-xl bg-white/10 border border-white/20 space-y-2">
              <p className="text-xs text-slate-200 font-medium">
                Cantidad Total Requerida según Ficha Técnica:
              </p>
              <div className="flex items-baseline gap-3">
                <span
                  data-testid="calculator-recommended-units"
                  className="text-4xl sm:text-5xl font-extrabold font-mono"
                  style={{ color: activeFestiveTheme.secondaryColor || '#F5C400' }}
                >
                  {calculationResult.recommendedUnits}
                </span>
                <span className="text-base sm:text-lg font-bold text-white">
                  {calculationResult.unitName}
                </span>
              </div>
              <p className="text-xs text-slate-200">{calculationResult.secondaryNote}</p>
            </div>

            {/* Technical Breakdown Details */}
            <div className="space-y-2.5 text-xs">
              {calculationResult.waterDilutionLiters > 0 && (
                <div className="p-3 rounded-lg bg-black/30 border border-white/20 flex items-center gap-2.5">
                  <Droplets
                    className="w-4 h-4 shrink-0"
                    style={{ color: activeFestiveTheme.secondaryColor || '#F5C400' }}
                  />
                  <div>
                    <span
                      className="font-bold block"
                      style={{ color: activeFestiveTheme.secondaryColor || '#F5C400' }}
                    >
                      Agua Requerida para Dilución / Mezcla:
                    </span>
                    <span>
                      {calculationResult.waterDilutionLiters} Litros de agua limpia según
                      proporción de catálogo.
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-black/30 border border-white/15">
                <span
                  className="font-bold block mb-0.5"
                  style={{ color: activeFestiveTheme.secondaryColor || '#F5C400' }}
                >
                  Recomendación de Aplicación y Complementos:
                </span>
                <span className="text-slate-100">
                  {calculationResult.complementaryDetail}
                </span>
              </div>

              {selectedProduct.technicalSheet && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-white/10 border border-white/15">
                    <span className="text-[10px] text-slate-300 block">Norma Certificada:</span>
                    <strong className="text-white text-[11px]">
                      {selectedProduct.technicalSheet.normative}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/10 border border-white/15">
                    <span className="text-[10px] text-slate-300 block">Rendimiento Nominal:</span>
                    <strong className="text-white text-[11px] line-clamp-1">
                      {selectedProduct.technicalSheet.yieldOrCoverage}
                    </strong>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-white/20 text-sm">
                <span className="text-slate-200 font-medium">
                  Presupuesto Estimado de Material:
                </span>
                <strong
                  className="text-xl font-mono font-extrabold"
                  style={{ color: activeFestiveTheme.secondaryColor || '#F5C400' }}
                >
                  USD ${calculationResult.estimatedBudgetUsd.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() =>
                onAddCalculatedToCart(
                  selectedProduct,
                  calculationResult.recommendedUnits,
                  calculationResult.unitName
                )
              }
              className="w-full py-3.5 px-5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:brightness-110 cursor-pointer"
              style={{
                backgroundColor: activeFestiveTheme.secondaryColor || '#F5C400',
                color: activeFestiveTheme.primaryColor || '#0B2861',
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                Agregar {calculationResult.recommendedUnits} {calculationResult.unitName} al
                Carrito de Compra
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCalculationReport}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 cursor-pointer transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Hoja de Cubicaje Oficial (PDF con Logos)</span>
            </button>
          </div>
        </div>
      </div>

      {executiveModalDoc && (
        <ExecutiveDocumentPreviewModal
          isOpen={executiveModalDoc.isOpen}
          onClose={() => setExecutiveModalDoc(null)}
          title={executiveModalDoc.title}
          documentHtml={executiveModalDoc.html}
          filename={executiveModalDoc.filename}
        />
      )}
    </section>
  );
};
