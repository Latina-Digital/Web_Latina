import React from 'react';
import { CompanyBrand } from '../types/erp';

interface ProductSchematicSvgProps {
  sku: string;
  category: string;
  company?: CompanyBrand;
  className?: string;
}

export const ProductSchematicSvg: React.FC<ProductSchematicSvgProps> = ({
  sku,
  category,
  company = 'industrial_latina',
  className = 'w-full h-44',
}) => {
  const isInduless =
    company === 'induless' ||
    sku.startsWith('CF') ||
    sku.startsWith('82') ||
    sku.startsWith('PRL') ||
    sku.startsWith('PCL') ||
    sku.startsWith('IL2') ||
    sku.startsWith('TF') ||
    sku.startsWith('E-60') ||
    sku.startsWith('2030') ||
    sku.startsWith('W02') ||
    sku === '3184';

  const renderIllustration = () => {
    // 1. Pinturas, Selladores & Aditivos (Industrial Latina)
    if (
      sku.includes('LVA') ||
      sku.includes('SAT') ||
      sku.includes('DUR') ||
      sku.includes('ELA') ||
      sku.includes('SEL') ||
      sku.includes('CUR') ||
      category.toLowerCase().includes('pintura') ||
      category.toLowerCase().includes('impermeabilizante') ||
      category.toLowerCase().includes('aditivo')
    ) {
      const accentStripe = sku.includes('SAT')
        ? '#B91C1C'
        : sku.includes('ELA')
        ? '#0284C7'
        : '#D91E26';
      return (
        <g>
          {/* Caneca 5 Galones Industrial Latina */}
          <rect
            x="92"
            y="30"
            width="86"
            height="100"
            rx="6"
            fill="#FFFFFF"
            stroke="#0E3B7C"
            strokeWidth="2.5"
          />
          <rect x="88" y="25" width="94" height="10" rx="3" fill="#0E3B7C" />
          <path d="M98 44 H172 V84 H98 Z" fill="#0E3B7C" />
          <path d="M98 84 H172 V112 H98 Z" fill={accentStripe} />
          <circle cx="135" cy="64" r="11" fill="#F5C400" stroke="#FFFFFF" strokeWidth="2" />
          <text
            x="135"
            y="68"
            textAnchor="middle"
            fill="#092452"
            fontSize="10"
            fontWeight="800"
            fontFamily="monospace"
          >
            L
          </text>
          {/* Galón acompañante */}
          <rect
            x="190"
            y="62"
            width="54"
            height="68"
            rx="5"
            fill="#FFFFFF"
            stroke="#0E3B7C"
            strokeWidth="2"
          />
          <rect x="188" y="58" width="58" height="7" rx="2" fill="#0E3B7C" />
          <rect x="195" y="74" width="44" height="26" fill={accentStripe} />
          <rect x="195" y="100" width="44" height="18" fill="#0E3B7C" />
          <circle cx="217" cy="87" r="6" fill="#F5C400" />
        </g>
      );
    }

    // 2. Empastes, Masillas, Morteros & Porcelana en Saco/Funda (Industrial Latina)
    if (
      sku.includes('EMP') ||
      sku.includes('MAS') ||
      sku.includes('MOR') ||
      sku.includes('POR') ||
      sku.includes('PEG') ||
      category.toLowerCase().includes('empaste') ||
      category.toLowerCase().includes('mortero')
    ) {
      const bagBandColor = sku.includes('MOR')
        ? '#15803D'
        : sku.includes('POR')
        ? '#0E3B7C'
        : '#D91E26';
      return (
        <g>
          {/* Saco Industrial Latina 20kg / 25kg / 40kg */}
          <path
            d="M105 26 H205 L212 130 H98 Z"
            fill="#FFFFFF"
            stroke="#0E3B7C"
            strokeWidth="2.5"
          />
          <rect x="103" y="26" width="104" height="10" fill="#0E3B7C" />
          <rect x="101" y="42" width="108" height="36" fill="#0E3B7C" />
          <rect x="100" y="78" width="110" height="28" fill={bagBandColor} />
          <circle cx="155" cy="60" r="10" fill="#F5C400" stroke="#FFFFFF" strokeWidth="1.5" />
          <text
            x="155"
            y="64"
            textAnchor="middle"
            fill="#092452"
            fontSize="9"
            fontWeight="800"
            fontFamily="monospace"
          >
            L
          </text>
          <text
            x="155"
            y="96"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9"
            fontWeight="700"
            fontFamily="sans-serif"
          >
            {sku}
          </text>
          <text
            x="155"
            y="120"
            textAnchor="middle"
            fill="#0E3B7C"
            fontSize="8"
            fontWeight="700"
            fontFamily="monospace"
          >
            CALIDAD ECUADOR
          </text>
        </g>
      );
    }

    // 3. Conductores Eléctricos CONDEX (Induless)
    if (sku.startsWith('CF') || category.toLowerCase().includes('conductor')) {
      return (
        <g>
          {/* Rollo Cable CONDEX */}
          <circle cx="135" cy="78" r="44" fill="none" stroke="#009FE3" strokeWidth="14" />
          <circle cx="135" cy="78" r="32" fill="none" stroke="#F5C400" strokeWidth="8" />
          <circle cx="135" cy="78" r="18" fill="#13314C" />
          {/* Puntas de cobre multifilar */}
          <path d="M170 46 L218 28" stroke="#D8235A" strokeWidth="9" strokeLinecap="round" />
          <path d="M218 28 L235 22" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
          <path d="M175 68 L222 56" stroke="#10B981" strokeWidth="9" strokeLinecap="round" />
          <path d="M222 56 L238 52" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    }

    // 4. Iluminación LED: Focos y Paneles (Induless)
    if (
      sku.startsWith('82') ||
      sku.startsWith('PRL') ||
      sku.startsWith('PCL') ||
      category.toLowerCase().includes('iluminaci')
    ) {
      return (
        <g>
          {/* Foco LED Cilíndrico Alta Potencia */}
          <rect
            x="92"
            y="32"
            width="54"
            height="56"
            rx="16"
            fill="#FFFFFF"
            stroke="#009FE3"
            strokeWidth="2.5"
          />
          <rect x="102" y="88" width="34" height="18" rx="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <rect x="109" y="106" width="20" height="14" rx="4" fill="#64748B" />
          {/* Panel LED Cuadrado / Redondo */}
          <rect
            x="166"
            y="40"
            width="68"
            height="68"
            rx={sku.startsWith('PRL') ? '34' : '8'}
            fill="#FFFFFF"
            stroke="#13314C"
            strokeWidth="3"
          />
          <rect
            x="176"
            y="50"
            width="48"
            height="48"
            rx={sku.startsWith('PRL') ? '24' : '4'}
            fill="#E0F2FE"
          />
          <circle cx="200" cy="74" r="8" fill="#F5C400" />
        </g>
      );
    }

    // 5. Fregaderos y Grifería (Induless)
    if (
      sku === '3184' ||
      sku.startsWith('IL22') ||
      sku.startsWith('IL-2') ||
      category.toLowerCase().includes('fregadero') ||
      category.toLowerCase().includes('grifer')
    ) {
      return (
        <g>
          {/* Fregadero Acero Inox 2 Pozos + Escurridor */}
          <rect
            x="76"
            y="62"
            width="135"
            height="60"
            rx="6"
            fill="#E2E8F0"
            stroke="#334155"
            strokeWidth="2.5"
          />
          <rect x="84" y="70" width="40" height="44" rx="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <rect x="130" y="70" width="40" height="44" rx="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <circle cx="104" cy="92" r="4" fill="#334155" />
          <circle cx="150" cy="92" r="4" fill="#334155" />
          <line x1="178" y1="74" x2="202" y2="74" stroke="#64748B" strokeWidth="2" />
          <line x1="178" y1="84" x2="202" y2="84" stroke="#64748B" strokeWidth="2" />
          <line x1="178" y1="94" x2="202" y2="94" stroke="#64748B" strokeWidth="2" />
          <line x1="178" y1="104" x2="202" y2="104" stroke="#64748B" strokeWidth="2" />
          {/* Llave Cuello de Ganzo Flexible */}
          <path
            d="M127 62 V38 C127 22, 160 22, 160 40 V48"
            fill="none"
            stroke="#D8235A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="154" y="48" width="12" height="8" rx="2" fill="#13314C" />
        </g>
      );
    }

    // 6. Cubiertas Techoforte, Losa Forte y Correas (Induless)
    if (sku.startsWith('TF') || sku.startsWith('LF') || category.toLowerCase().includes('cubierta')) {
      return (
        <g>
          <polygon
            points="70,105 115,38 245,38 200,105"
            fill="#E2E8F0"
            stroke="#13314C"
            strokeWidth="2.5"
          />
          <line x1="92" y1="105" x2="137" y2="38" stroke="#0E3B7C" strokeWidth="3" />
          <line x1="118" y1="105" x2="163" y2="38" stroke="#0E3B7C" strokeWidth="3" />
          <line x1="144" y1="105" x2="189" y2="38" stroke="#0E3B7C" strokeWidth="3" />
          <line x1="170" y1="105" x2="215" y2="38" stroke="#0E3B7C" strokeWidth="3" />
          <rect x="95" y="112" width="120" height="12" rx="3" fill="#D8235A" />
          <text
            x="155"
            y="121"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8"
            fontWeight="800"
            fontFamily="monospace"
          >
            TECHOFORTE · LOSA FORTE
          </text>
        </g>
      );
    }

    // 7. Cerraduras, Mallas, Soldadura y Ferretería (Induless)
    return (
      <g>
        <rect
          x="85"
          y="38"
          width="140"
          height="76"
          rx="10"
          fill="#13314C"
          stroke="#D8235A"
          strokeWidth="2.5"
        />
        <circle cx="122" cy="76" r="20" fill="#E2E8F0" stroke="#F5C400" strokeWidth="2.5" />
        <rect x="118" y="69" width="8" height="14" rx="2" fill="#13314C" />
        <rect x="142" y="70" width="60" height="12" rx="6" fill="#F5C400" />
        <text
          x="172"
          y="102"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="monospace"
        >
          {sku}
        </text>
      </g>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-[#F8FAFC] to-[#E8F0FC] flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 320 160"
        className="w-full h-full"
        role="img"
        aria-label={`Esquema de producto ${sku}`}
      >
        <defs>
          <pattern id={`grid-${sku}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={isInduless ? '#13314C' : '#0E3B7C'}
              strokeWidth="0.4"
              strokeOpacity="0.12"
            />
          </pattern>
        </defs>

        <rect width="320" height="160" fill={`url(#grid-${sku})`} />

        {/* Top Corporate Entity Header inside Schematic */}
        <rect
          x="12"
          y="10"
          width="136"
          height="18"
          rx="4"
          fill={isInduless ? '#13314C' : '#0E3B7C'}
        />
        <text
          x="80"
          y="22"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="8.5"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          {isInduless ? 'INDULESS ECUADOR' : 'INDUSTRIAL LATINA'}
        </text>

        {/* Top Right SKU Code */}
        <text
          x="306"
          y="22"
          textAnchor="end"
          fill={isInduless ? '#D8235A' : '#0E3B7C'}
          fontSize="9.5"
          fontWeight="800"
          fontFamily="monospace"
        >
          CÓD: {sku}
        </text>

        {renderIllustration()}

        {/* Bottom Technical Footer */}
        <text
          x="160"
          y="150"
          textAnchor="middle"
          fill="#475569"
          fontSize="8"
          fontWeight="700"
          fontFamily="monospace"
        >
          CATÁLOGO OFICIAL ECUADOR · FICHA TÉCNICA CERTIFICADA
        </text>
      </svg>
    </div>
  );
};
