import {
  StorefrontSectionId,
  StorefrontSectionsVisibilityMap,
} from '../types/erp';

export interface StorefrontSectionDescriptor {
  id: StorefrontSectionId;
  label: string;
  navShortLabel: string;
  description: string;
  badgeText?: string;
  badgeColorClass?: string;
  isModalLauncher?: boolean;
}

export const STOREFRONT_SECTION_DESCRIPTORS: StorefrontSectionDescriptor[] = [
  {
    id: 'inicio',
    label: 'Inicio & Portada Principal',
    navShortLabel: 'INICIO',
    description: 'Banner principal, vitrina dual Industrial Latina & Induless, destacados y acceso rápido.',
  },
  {
    id: 'productos',
    label: 'Categorías & Catálogo de Productos',
    navShortLabel: 'CATEGORÍAS',
    description: 'Catálogo completo por empresa, presentaciones con imagen propia, fichas Google Drive y PDF minimalista.',
  },
  {
    id: 'calculadora',
    label: 'Calculadora de Pintura & Materiales',
    navShortLabel: 'CALCULADORA',
    description: 'Cubicaje técnico por m² y calculadora dimensional avanzada con merma NTE INEN.',
  },
  {
    id: 'disenador',
    label: 'Diseñador Virtual de Ambientes 3D',
    navShortLabel: 'DISEÑADOR 3D',
    description: 'Escenas 3D interactivas con control de luces (Ambiental, Direccional, Punto) y selector HDRi.',
    badgeText: '3D',
    badgeColorClass: 'bg-[#FFD100] text-[#0B2861]',
  },
  {
    id: 'rastreo',
    label: 'Rastreo de Envíos & Guías SRI',
    navShortLabel: 'RASTREO',
    description: 'Consulta en vivo del estado de despacho por número de guía de remisión o pedido.',
  },
  {
    id: 'distribuidores',
    label: 'Red Oficial de Distribuidores',
    navShortLabel: 'DISTRIBUIDORES',
    description: 'Formulario y portal mayorista para ferreterías, constructoras y distribuidores en Ecuador.',
    badgeText: 'RED',
    badgeColorClass: 'bg-emerald-600 text-white',
  },
  {
    id: 'institucional',
    label: 'Institucional & Plantas Industriales',
    navShortLabel: 'INSTITUCIONAL',
    description: 'Historia corporativa, Planta Vía a Daule Km 8.5, Bodega Mapasingue y certificaciones.',
  },
  {
    id: 'blogs',
    label: 'Blogs & Eventos Corporativos',
    navShortLabel: 'BLOGS & EVENTOS',
    description: 'Noticias técnicas, capacitaciones para maestros pintores y eventos nacionales.',
  },
  {
    id: 'tendencias',
    label: 'Tendencias Decoración & IA',
    navShortLabel: 'TENDENCIAS IA',
    description: 'Paletas arquitectónicas de temporada y recomendaciones inteligentes de acabados.',
  },
  {
    id: 'laboratorio_ia',
    label: 'Laboratorio Biociencia & Estudio IA',
    navShortLabel: 'LABORATORIO & IA',
    description: '12 módulos científicos y multimodales: proteínas 3D, química PubChem, ChEMBL y Gemini.',
    badgeText: 'LAB',
    badgeColorClass: 'bg-[#0B2861] text-[#FFD100]',
  },
  {
    id: 'juego_3d',
    label: 'Simulador Juego Logístico 3D',
    navShortLabel: 'JUEGO 3D',
    description: 'Simulador interactivo Three.js de montacargas en la planta Industrial Latina & Induless.',
    badgeText: '3D',
    badgeColorClass: 'bg-[#FFD100] text-[#0B2861]',
    isModalLauncher: true,
  },
];

export const DEFAULT_STOREFRONT_SECTIONS_VISIBILITY: StorefrontSectionsVisibilityMap = {
  inicio: true,
  productos: true,
  calculadora: true,
  disenador: true,
  rastreo: true,
  distribuidores: true,
  institucional: true,
  blogs: true,
  tendencias: true,
  laboratorio_ia: true,
  juego_3d: true,
};

export const STOREFRONT_STORAGE_KEY = 'il_storefront_sections_visibility';

export function sanitizeSectionsVisibilityMap(
  raw?: Partial<Record<string, boolean>> | null
): StorefrontSectionsVisibilityMap {
  const merged: StorefrontSectionsVisibilityMap = {
    ...DEFAULT_STOREFRONT_SECTIONS_VISIBILITY,
  };
  if (raw && typeof raw === 'object') {
    for (const desc of STOREFRONT_SECTION_DESCRIPTORS) {
      if (typeof raw[desc.id] === 'boolean') {
        merged[desc.id] = raw[desc.id] as boolean;
      }
    }
  }
  // Ensure at least one navigable screen (non-modal) is enabled so the website never renders blank
  const screenIds = STOREFRONT_SECTION_DESCRIPTORS.filter((d) => !d.isModalLauncher).map((d) => d.id);
  const anyScreenActive = screenIds.some((id) => merged[id]);
  if (!anyScreenActive) {
    merged.inicio = true;
  }
  return merged;
}

export function toggleStorefrontSection(
  currentMap: StorefrontSectionsVisibilityMap,
  sectionId: StorefrontSectionId,
  forceValue?: boolean
): StorefrontSectionsVisibilityMap {
  const nextValue = typeof forceValue === 'boolean' ? forceValue : !currentMap[sectionId];
  const updated: StorefrontSectionsVisibilityMap = {
    ...currentMap,
    [sectionId]: nextValue,
  };
  return sanitizeSectionsVisibilityMap(updated);
}

export function setAllStorefrontSections(
  enableAll: boolean
): StorefrontSectionsVisibilityMap {
  if (enableAll) {
    return { ...DEFAULT_STOREFRONT_SECTIONS_VISIBILITY };
  }
  // When disabling bulk, keep 'inicio' and 'productos' active as essential storefront core
  return {
    inicio: true,
    productos: true,
    calculadora: false,
    disenador: false,
    rastreo: false,
    distribuidores: false,
    institucional: false,
    blogs: false,
    tendencias: false,
    laboratorio_ia: false,
    juego_3d: false,
  };
}

export function getActiveStorefrontSections(
  visibilityMap: StorefrontSectionsVisibilityMap
): StorefrontSectionDescriptor[] {
  const sanitized = sanitizeSectionsVisibilityMap(visibilityMap);
  return STOREFRONT_SECTION_DESCRIPTORS.filter((desc) => sanitized[desc.id]);
}

export function resolveValidStorefrontScreen<T extends string>(
  currentScreen: T,
  visibilityMap: StorefrontSectionsVisibilityMap
): T {
  const sanitized = sanitizeSectionsVisibilityMap(visibilityMap);
  const key = currentScreen as unknown as StorefrontSectionId;
  if (key in sanitized && sanitized[key]) {
    return currentScreen;
  }
  const firstActiveScreen = STOREFRONT_SECTION_DESCRIPTORS.find(
    (d) => !d.isModalLauncher && sanitized[d.id]
  );
  return (firstActiveScreen ? firstActiveScreen.id : 'inicio') as unknown as T;
}

export interface AdaptiveNavbarLayoutMetrics {
  activeCount: number;
  containerGapClass: string;
  itemPaddingClass: string;
  fontSizeClass: string;
}

export function computeAdaptiveNavbarMetrics(
  visibilityMap: StorefrontSectionsVisibilityMap
): AdaptiveNavbarLayoutMetrics {
  const activeList = getActiveStorefrontSections(visibilityMap);
  const activeCount = activeList.length;

  if (activeCount <= 4) {
    return {
      activeCount,
      containerGapClass: 'gap-3 xl:gap-5',
      itemPaddingClass: 'px-3.5 py-2',
      fontSizeClass: 'text-xs sm:text-sm',
    };
  }
  if (activeCount <= 7) {
    return {
      activeCount,
      containerGapClass: 'gap-2 xl:gap-3.5',
      itemPaddingClass: 'px-2.5 py-1.5',
      fontSizeClass: 'text-xs',
    };
  }
  return {
    activeCount,
    containerGapClass: 'gap-1.5 xl:gap-2.5',
    itemPaddingClass: 'px-2 py-1.5',
    fontSizeClass: 'text-[11px] xl:text-xs',
  };
}
