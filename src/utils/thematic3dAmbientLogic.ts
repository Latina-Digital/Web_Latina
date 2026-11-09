import { EcuadorFestiveThemeId } from '../types/erp';
import { getActiveFestiveTheme } from './ecuadorThemes';

/**
 * Strict Layer Hierarchy Constants:
 * - Ambient 3D figures container stays at low fixed background layer (z-index: 10)
 * - Foreground interactive content sections sit at z-index: 20+
 * - High-Definition Category Bar sits at z-index: 40 (strictly above 3D figures)
 * - High-Definition Corporate Logo Pedestal sits at z-index: 50 (strictly above 3D figures)
 * - All modals, drawers, popups, dropdowns, and alerts sit at z-index: 9999
 */
export const THEMATIC_AMBIENT_LAYER_Z_INDEX = 10;
export const FOREGROUND_CONTENT_Z_INDEX = 20;
export const CATEGORY_BAR_HD_Z_INDEX = 40;
export const LOGO_PEDESTAL_HD_Z_INDEX = 50;
export const MODAL_AND_DRAWER_Z_INDEX = 9999;
export const ERP_INTERACTIVE_LAYER_Z_INDEX = 9999;

export type DynamicZIndexLayerType =
  | 'ambient_3d'
  | 'erp_bar'
  | 'erp_modal'
  | 'erp_interactive'
  | 'foreground_content';

export interface DynamicZIndexManagerConfig {
  ambient3dZIndex: 10;
  erpBarZIndex: 9999;
  erpModalZIndex: 9999;
  erpInteractiveZIndex: 9999;
  activeModalCount: number;
  ambientStyle: {
    zIndex: 10;
    position: 'fixed';
    pointerEvents: 'none';
    userSelect: 'none';
  };
  erpBarStyle: {
    zIndex: 9999;
    isolation: 'isolate';
  };
  erpModalStyle: {
    zIndex: 9999;
    isolation: 'isolate';
  };
  cssVariables: {
    '--z-ambient-3d-container': '10';
    '--z-erp-interactive-layer': '9999';
    '--z-erp-bar-layer': '9999';
    '--z-erp-modal-layer': '9999';
  };
}

/**
 * Computes the dynamic z-index manager configuration ensuring that:
 * - The 3D figures container remains strictly at z-index: 10
 * - All ERP interactive elements (modals, bars, headers, category bars) sit at z-index: 9999
 */
export function getDynamicZIndexConfig(activeModalCount = 0): DynamicZIndexManagerConfig {
  return {
    ambient3dZIndex: THEMATIC_AMBIENT_LAYER_Z_INDEX,
    erpBarZIndex: ERP_INTERACTIVE_LAYER_Z_INDEX,
    erpModalZIndex: MODAL_AND_DRAWER_Z_INDEX,
    erpInteractiveZIndex: ERP_INTERACTIVE_LAYER_Z_INDEX,
    activeModalCount: Math.max(0, activeModalCount),
    ambientStyle: {
      zIndex: THEMATIC_AMBIENT_LAYER_Z_INDEX,
      position: 'fixed',
      pointerEvents: 'none',
      userSelect: 'none',
    },
    erpBarStyle: {
      zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX,
      isolation: 'isolate',
    },
    erpModalStyle: {
      zIndex: MODAL_AND_DRAWER_Z_INDEX,
      isolation: 'isolate',
    },
    cssVariables: {
      '--z-ambient-3d-container': '10',
      '--z-erp-interactive-layer': '9999',
      '--z-erp-bar-layer': '9999',
      '--z-erp-modal-layer': '9999',
    },
  };
}

/**
 * Returns inline style properties for a managed z-index layer role.
 */
export function getDynamicElementZIndexStyle(layerType: DynamicZIndexLayerType): {
  zIndex: number;
  isolation?: 'isolate';
  pointerEvents?: 'none' | 'auto';
  userSelect?: 'none' | 'auto';
} {
  if (layerType === 'ambient_3d') {
    return {
      zIndex: THEMATIC_AMBIENT_LAYER_Z_INDEX,
      pointerEvents: 'none',
      userSelect: 'none',
    };
  }
  if (layerType === 'foreground_content') {
    return {
      zIndex: FOREGROUND_CONTENT_Z_INDEX,
    };
  }
  return {
    zIndex: ERP_INTERACTIVE_LAYER_Z_INDEX,
    isolation: 'isolate',
  };
}

/**
 * Synchronizes and enforces dynamic z-index rules across the live DOM:
 * - Forces all 3D ambient containers to stay at z-index: 10 with pointer-events: none
 * - Elevates all ERP interactive bars, category bars, and modals to z-index: 9999
 * - Elevates any stacking ancestor that contains an active [role="dialog"] so modals never clip behind sticky bars
 */
export function syncDomDynamicZIndexLayers(rootElement?: ParentNode | null): {
  ambientContainersLockedAt10: number;
  erpInteractiveElementsElevatedTo9999: number;
  isCompliant: boolean;
} {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
    return {
      ambientContainersLockedAt10: 0,
      erpInteractiveElementsElevatedTo9999: 0,
      isCompliant: true,
    };
  }

  let ambientCount = 0;
  const ambientNodes = rootElement.querySelectorAll<HTMLElement>(
    '[data-testid="thematic-ambient-root"], .thematic-ambient-root, [data-z-layer="ambient-3d"]'
  );
  ambientNodes.forEach((node) => {
    node.style.setProperty('z-index', String(THEMATIC_AMBIENT_LAYER_Z_INDEX), 'important');
    node.style.setProperty('pointer-events', 'none', 'important');
    node.style.setProperty('user-select', 'none', 'important');
    node.setAttribute('data-z-managed', String(THEMATIC_AMBIENT_LAYER_Z_INDEX));
    ambientCount += 1;
  });

  let interactiveCount = 0;
  const interactiveNodes = rootElement.querySelectorAll<HTMLElement>(
    '[data-z-layer="erp-interactive"], [data-z-layer="erp-bar"], [data-z-layer="erp-modal"], .erp-interactive-bar, .category-bar-hd, .modal-layer-top, .skeuo-modal-3d, .skeuo-drawer-3d, [role="dialog"]'
  );
  interactiveNodes.forEach((node) => {
    node.style.setProperty('z-index', String(ERP_INTERACTIVE_LAYER_Z_INDEX), 'important');
    node.style.setProperty('isolation', 'isolate');
    node.setAttribute('data-z-managed', String(ERP_INTERACTIVE_LAYER_Z_INDEX));
    interactiveCount += 1;
  });

  // Ensure any workspace container holding an open dialog does not trap the dialog in a lower stacking context
  const workspaceWrappers = rootElement.querySelectorAll<HTMLElement>('[data-z-workspace]');
  workspaceWrappers.forEach((wrapper) => {
    const hasOpenDialogInside = wrapper.querySelector('[role="dialog"], .modal-layer-top') !== null;
    if (hasOpenDialogInside) {
      wrapper.style.setProperty('z-index', String(ERP_INTERACTIVE_LAYER_Z_INDEX), 'important');
      wrapper.setAttribute('data-z-managed', String(ERP_INTERACTIVE_LAYER_Z_INDEX));
    } else {
      wrapper.style.setProperty('z-index', String(FOREGROUND_CONTENT_Z_INDEX));
      wrapper.setAttribute('data-z-managed', String(FOREGROUND_CONTENT_Z_INDEX));
    }
  });

  return {
    ambientContainersLockedAt10: ambientCount,
    erpInteractiveElementsElevatedTo9999: interactiveCount,
    isCompliant:
      THEMATIC_AMBIENT_LAYER_Z_INDEX === 10 &&
      ERP_INTERACTIVE_LAYER_Z_INDEX === 9999 &&
      ERP_INTERACTIVE_LAYER_Z_INDEX > THEMATIC_AMBIENT_LAYER_Z_INDEX,
  };
}

export type DepthPlane3D = 'far' | 'mid' | 'near';

export interface Commemorative3dFigureSpec {
  id: string;
  themeId: EcuadorFestiveThemeId;
  variantIndex: 0 | 1 | 2;
  label: string;
  leftPct: number;
  topPct: number;
  sizePx: number;
  depthPlane: DepthPlane3D;
  opacity: number;
  blurPx: number;
  durationSec: number;
  delaySec: number;
  trajectoryClass: 'thematic-float-path-a' | 'thematic-float-path-b' | 'thematic-float-path-c';
  parallaxFactor: number;
  pointerEvents: 'none';
  userSelect: 'none';
}

export interface CommemorativeBannerArtSpec {
  themeId: EcuadorFestiveThemeId;
  commemorativeTitle: string;
  commemorativeSubtitle: string;
  editionBadge: string;
  primaryStop: string;
  secondaryStop: string;
  accentStop: string;
  glowStop: string;
  monumentTitle: string;
  pointerEvents: 'none';
  userSelect: 'none';
}

const FIGURE_LABELS_BY_THEME: Record<EcuadorFestiveThemeId, [string, string, string]> = {
  quito: [
    'Trompo Quiteño 3D en Madera Noble',
    'Guitarra y Chiva Festiva de Quito 3D',
    'Globo Conmemorativo Luz de América 3D',
  ],
  guayaquil: [
    'Estrella Octubrina Biselada 3D',
    'Faro Cerro Santa Ana Perla del Pacífico 3D',
    'Ancla Naval Madera de Guerrero 3D',
  ],
  cuenca: [
    'Cúpulas Celestes Catedral de Cuenca 3D',
    'Sombrero Fino de Paja Toquilla 3D',
    'Farol Colonial de los Cuatro Ríos 3D',
  ],
  carnaval: [
    'Máscara Realista de Carnaval 3D',
    'Tambor y Serpentina Festiva 3D',
    'Esfera Acuática Hidrorepelente 3D',
  ],
  difuntos: [
    'Guagua de Pan Tradicional 3D',
    'Cáliz de Colada Morada y Especias 3D',
    'Flor Andina de Finados 3D',
  ],
  navidad: [
    'Pino Navideño Esmeralda 3D',
    'Esfera de Cristal Especular 3D',
    'Estrella Dorada de Fin de Año 3D',
  ],
  patrias: [
    'Escarapela Tricolor Ecuatoriana 3D',
    'Antorcha Libertaria 10 de Agosto 3D',
    'Estrella Soberana del Ecuador 3D',
  ],
  halloween: [
    'Calabaza Luminosa Jack-o-Lantern 3D',
    'Murciélago Nocturno Volumétrico 3D',
    'Orbe Místico Encantado 3D',
  ],
  black_friday: [
    'Etiqueta VIP Obsidiana & Oro 3D',
    'Medalla Dorada Descuento de Fábrica 3D',
    'Destello Cyber Carmesí 3D',
  ],
  corporativo: [
    'Cubeta 3D Industrial Latina con Pintura Dorada',
    'Rodillo Arquitectónico Profesional 3D',
    'Luminaria Panel LED Induless 3D',
  ],
};

const DETERMINISTIC_SCREEN_SLOTS: Array<{
  leftPct: number;
  topPct: number;
  depthPlane: DepthPlane3D;
}> = [
  { leftPct: 6, topPct: 14, depthPlane: 'near' },
  { leftPct: 22, topPct: 28, depthPlane: 'far' },
  { leftPct: 84, topPct: 16, depthPlane: 'mid' },
  { leftPct: 91, topPct: 42, depthPlane: 'near' },
  { leftPct: 12, topPct: 54, depthPlane: 'mid' },
  { leftPct: 38, topPct: 18, depthPlane: 'far' },
  { leftPct: 66, topPct: 32, depthPlane: 'far' },
  { leftPct: 76, topPct: 68, depthPlane: 'mid' },
  { leftPct: 18, topPct: 82, depthPlane: 'near' },
  { leftPct: 52, topPct: 76, depthPlane: 'far' },
  { leftPct: 88, topPct: 84, depthPlane: 'near' },
  { leftPct: 31, topPct: 62, depthPlane: 'mid' },
];

/**
 * Generates 12 floating 3D commemorative figures distributed across the viewport
 * with multi-axis trajectories, depth-based scaling/blur, and strict non-interference.
 */
export function generateCommemorative3dFloatingFigures(
  themeId: EcuadorFestiveThemeId = 'corporativo',
  customCommemorativeTitle?: string
): Commemorative3dFigureSpec[] {
  const validTheme = getActiveFestiveTheme(themeId).id;
  const labels = FIGURE_LABELS_BY_THEME[validTheme] || FIGURE_LABELS_BY_THEME.corporativo;
  const trajectories: Array<
    'thematic-float-path-a' | 'thematic-float-path-b' | 'thematic-float-path-c'
  > = ['thematic-float-path-a', 'thematic-float-path-b', 'thematic-float-path-c'];

  return DETERMINISTIC_SCREEN_SLOTS.map((slot, index) => {
    const variantIndex = (index % 3) as 0 | 1 | 2;
    const isNear = slot.depthPlane === 'near';
    const isMid = slot.depthPlane === 'mid';

    const sizePx = isNear ? 64 : isMid ? 48 : 34;
    const opacity = isNear ? 0.52 : isMid ? 0.38 : 0.24;
    const blurPx = isNear ? 0 : isMid ? 0.4 : 1.2;
    const durationSec = 11 + (index % 5) * 2.4;
    const delaySec = Number(((index * 0.85) % 6).toFixed(2));
    const parallaxFactor = isNear ? 1.15 : isMid ? 0.7 : 0.35;

    const baseLabel = labels[variantIndex];
    const finalLabel =
      customCommemorativeTitle && customCommemorativeTitle.trim().length > 0
        ? `${baseLabel} · ${customCommemorativeTitle.trim()}`
        : baseLabel;

    return {
      id: `fig3d-${validTheme}-${index}`,
      themeId: validTheme,
      variantIndex,
      label: finalLabel,
      leftPct: slot.leftPct,
      topPct: slot.topPct,
      sizePx,
      depthPlane: slot.depthPlane,
      opacity,
      blurPx,
      durationSec,
      delaySec,
      trajectoryClass: trajectories[index % 3],
      parallaxFactor,
      pointerEvents: 'none',
      userSelect: 'none',
    };
  });
}

/**
 * Computes high-resolution commemorative banner artwork tokens harmonized with the page palette.
 */
export function getCommemorativeBannerArtConfig(
  themeId: EcuadorFestiveThemeId = 'corporativo',
  customCommemorativeTitle?: string
): CommemorativeBannerArtSpec {
  const theme = getActiveFestiveTheme(themeId);
  const customClean = customCommemorativeTitle?.trim() || '';

  return {
    themeId: theme.id,
    commemorativeTitle: customClean || theme.name.split('(')[0].trim(),
    commemorativeSubtitle: theme.tagline,
    editionBadge: customClean ? `Edición Conmemorativa · ${customClean}` : theme.heroBadge,
    primaryStop: theme.primaryColor,
    secondaryStop: theme.secondaryColor,
    accentStop: theme.accentColor,
    glowStop: theme.glowColorRgba,
    monumentTitle: theme.illustrationLabel,
    pointerEvents: 'none',
    userSelect: 'none',
  };
}

/**
 * Validates that the ambient z-index is strictly below category bars, logos, and modal/drawer z-index
 * and that non-interactive CSS rules are enforced so 3D figures never interfere with UI visualization.
 */
export function verifyLayerAndInteractionCompliance(config: {
  ambientZIndex: number;
  modalZIndex: number;
  categoryBarZIndex?: number;
  logoZIndex?: number;
  erpBarZIndex?: number;
  pointerEvents: string;
  userSelect: string;
}): {
  valid: boolean;
  isBehindModals: boolean;
  isBehindLogoAndCategoryBar: boolean;
  isBehindErpBars: boolean;
  isClickThrough: boolean;
} {
  const catZ = config.categoryBarZIndex ?? CATEGORY_BAR_HD_Z_INDEX;
  const logoZ = config.logoZIndex ?? LOGO_PEDESTAL_HD_Z_INDEX;
  const erpBarZ = config.erpBarZIndex ?? ERP_INTERACTIVE_LAYER_Z_INDEX;

  const isBehindModals =
    config.ambientZIndex === 10 &&
    config.modalZIndex >= 9999 &&
    config.modalZIndex > config.ambientZIndex;

  const isBehindLogoAndCategoryBar =
    catZ > config.ambientZIndex &&
    logoZ > config.ambientZIndex &&
    config.modalZIndex >= logoZ &&
    config.modalZIndex >= catZ;

  const isBehindErpBars =
    erpBarZ >= 9999 &&
    erpBarZ > config.ambientZIndex;

  const isClickThrough =
    config.pointerEvents === 'none' && config.userSelect === 'none';

  return {
    valid: isBehindModals && isBehindLogoAndCategoryBar && isBehindErpBars && isClickThrough,
    isBehindModals,
    isBehindLogoAndCategoryBar,
    isBehindErpBars,
    isClickThrough,
  };
}

