export type LightingPresetId = 'dia' | 'tarde' | 'noche' | 'rasante';
export type LightSourceKey = 'ambient' | 'directional' | 'point';
export type HdriEnvironmentPresetId =
  | 'industrial'
  | 'almacen'
  | 'oficina'
  | 'estudio'
  | 'exterior';

export interface HdriLightEmitterSpec {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  colorHex: string;
  hdrMultiplier: number;
}

export interface HdriEnvironmentPresetSpec {
  id: HdriEnvironmentPresetId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  kelvin: number;
  zenithColorHex: string;
  horizonColorHex: string;
  groundColorHex: string;
  sceneBackgroundHex: string;
  defaultEnvMapIntensity: number;
  toneMappingExposure: number;
  recommendedAmbient: {
    intensity: number;
    colorHex: string;
    groundColorHex: string;
  };
  emitters: HdriLightEmitterSpec[];
}

export const HDRI_ENVIRONMENT_PRESETS: Record<
  HdriEnvironmentPresetId,
  HdriEnvironmentPresetSpec
> = {
  industrial: {
    id: 'industrial',
    label: 'Industrial',
    shortLabel: 'Industrial',
    icon: '🏭',
    description:
      'Galpón Metalmecánico 4500K · Tragaluces cenitales y reflejos de acero galvanizado / piso epóxico',
    kelvin: 4500,
    zenithColorHex: '#334155',
    horizonColorHex: '#64748B',
    groundColorHex: '#0F172A',
    sceneBackgroundHex: '#0B1628',
    defaultEnvMapIntensity: 1.35,
    toneMappingExposure: 1.18,
    recommendedAmbient: {
      intensity: 1.05,
      colorHex: '#BAE6FD',
      groundColorHex: '#1E293B',
    },
    emitters: [
      // Overhead skylight strips
      { position: [-6, 12, 0], scale: [3.2, 0.3, 14], colorHex: '#E0F2FE', hdrMultiplier: 6.5 },
      { position: [6, 12, 0], scale: [3.2, 0.3, 14], colorHex: '#E0F2FE', hdrMultiplier: 6.5 },
      // High-bay industrial sodium/LED bays
      { position: [0, 11, -5], scale: [2.5, 0.4, 2.5], colorHex: '#FEF08A', hdrMultiplier: 8.0 },
      { position: [0, 11, 5], scale: [2.5, 0.4, 2.5], colorHex: '#FEF08A', hdrMultiplier: 8.0 },
      // Lateral loading dock daylight bounce
      { position: [14, 4, 2], scale: [0.4, 6.0, 8.0], colorHex: '#93C5FD', hdrMultiplier: 4.5 },
    ],
  },
  almacen: {
    id: 'almacen',
    label: 'Almacén',
    shortLabel: 'Almacén',
    icon: '📦',
    description:
      'Bodega Logística 4000K · Luminarias High-Bay lineales en pasillos y rebote cálido de estanterías',
    kelvin: 4000,
    zenithColorHex: '#27272A',
    horizonColorHex: '#52525B',
    groundColorHex: '#18181B',
    sceneBackgroundHex: '#131624',
    defaultEnvMapIntensity: 1.15,
    toneMappingExposure: 1.12,
    recommendedAmbient: {
      intensity: 0.9,
      colorHex: '#FDE68A',
      groundColorHex: '#292524',
    },
    emitters: [
      // Linear aisle LED strips
      { position: [-4.5, 11.5, 0], scale: [1.2, 0.3, 16], colorHex: '#FFFBEB', hdrMultiplier: 7.2 },
      { position: [0, 11.5, 0], scale: [1.2, 0.3, 16], colorHex: '#FFFBEB', hdrMultiplier: 7.2 },
      { position: [4.5, 11.5, 0], scale: [1.2, 0.3, 16], colorHex: '#FFFBEB', hdrMultiplier: 7.2 },
      // Warm cardboard/pallet rack lateral bounce panels
      { position: [-13, 3.5, 0], scale: [0.4, 5.5, 12], colorHex: '#F59E0B', hdrMultiplier: 2.8 },
      { position: [13, 3.5, 0], scale: [0.4, 5.5, 12], colorHex: '#F59E0B', hdrMultiplier: 2.8 },
    ],
  },
  oficina: {
    id: 'oficina',
    label: 'Oficina',
    shortLabel: 'Oficina',
    icon: '🏢',
    description:
      'Entorno Corporativo 5000K · Paneles LED difusos 60×60 en cielo raso y ventanal de luz día lateral',
    kelvin: 5000,
    zenithColorHex: '#E2E8F0',
    horizonColorHex: '#CBD5E1',
    groundColorHex: '#334155',
    sceneBackgroundHex: '#0F1E36',
    defaultEnvMapIntensity: 1.25,
    toneMappingExposure: 1.2,
    recommendedAmbient: {
      intensity: 1.15,
      colorHex: '#F1F5F9',
      groundColorHex: '#334155',
    },
    emitters: [
      // 2x2 Grid of recessed 60x60 LED panels
      { position: [-4, 10.5, -4], scale: [4.0, 0.25, 4.0], colorHex: '#FFFFFF', hdrMultiplier: 5.5 },
      { position: [4, 10.5, -4], scale: [4.0, 0.25, 4.0], colorHex: '#FFFFFF', hdrMultiplier: 5.5 },
      { position: [-4, 10.5, 4], scale: [4.0, 0.25, 4.0], colorHex: '#FFFFFF', hdrMultiplier: 5.5 },
      { position: [4, 10.5, 4], scale: [4.0, 0.25, 4.0], colorHex: '#FFFFFF', hdrMultiplier: 5.5 },
      // Large curtain-wall window daylight on +X/+Z
      { position: [13.5, 5.0, 0], scale: [0.3, 7.5, 14.0], colorHex: '#DBEAFE', hdrMultiplier: 6.0 },
    ],
  },
  estudio: {
    id: 'estudio',
    label: 'Estudio',
    shortLabel: 'Estudio',
    icon: '📸',
    description:
      'Showroom Arquitectónico 5500K · Softboxes neutros de alto contraste para inspección de acabados',
    kelvin: 5500,
    zenithColorHex: '#1E293B',
    horizonColorHex: '#475569',
    groundColorHex: '#090D16',
    sceneBackgroundHex: '#090F1D',
    defaultEnvMapIntensity: 1.5,
    toneMappingExposure: 1.22,
    recommendedAmbient: {
      intensity: 0.85,
      colorHex: '#F8FAFC',
      groundColorHex: '#0F172A',
    },
    emitters: [
      // Key overhead softbox
      { position: [0, 12, 2], scale: [8.0, 0.3, 6.0], colorHex: '#FFFFFF', hdrMultiplier: 8.5 },
      // Left rim softbox
      { position: [-12, 6, 4], scale: [0.4, 7.0, 6.0], colorHex: '#E0F2FE', hdrMultiplier: 6.5 },
      // Right warm fill softbox
      { position: [12, 5, -3], scale: [0.4, 6.0, 6.0], colorHex: '#FEF3C7', hdrMultiplier: 5.0 },
    ],
  },
  exterior: {
    id: 'exterior',
    label: 'Exterior',
    shortLabel: 'Exterior',
    icon: '🌤️',
    description:
      'Cielo Ecuatoriano 6500K · Bóveda celeste despejada con radiación solar cenital de alta claridad',
    kelvin: 6500,
    zenithColorHex: '#0284C7',
    horizonColorHex: '#BAE6FD',
    groundColorHex: '#334155',
    sceneBackgroundHex: '#0C2340',
    defaultEnvMapIntensity: 1.45,
    toneMappingExposure: 1.25,
    recommendedAmbient: {
      intensity: 1.25,
      colorHex: '#E0F2FE',
      groundColorHex: '#334155',
    },
    emitters: [
      // Solar zenith disc
      { position: [7, 13, 6], scale: [4.5, 4.5, 4.5], colorHex: '#FFFBEB', hdrMultiplier: 11.0 },
      // Sky dome diffuse bands
      { position: [-9, 10, -6], scale: [8.0, 0.4, 8.0], colorHex: '#7DD3FC', hdrMultiplier: 5.5 },
      { position: [0, 4, 13], scale: [14.0, 5.0, 0.4], colorHex: '#BAE6FD', hdrMultiplier: 4.5 },
    ],
  },
};

export const HDRI_ENVIRONMENT_LIST: HdriEnvironmentPresetSpec[] = [
  HDRI_ENVIRONMENT_PRESETS.industrial,
  HDRI_ENVIRONMENT_PRESETS.almacen,
  HDRI_ENVIRONMENT_PRESETS.oficina,
  HDRI_ENVIRONMENT_PRESETS.estudio,
  HDRI_ENVIRONMENT_PRESETS.exterior,
];

export interface AmbientLightSettings {
  enabled: boolean;
  intensity: number;
  colorHex: string;
  groundColorHex: string;
}

export interface DirectionalLightSettings {
  enabled: boolean;
  intensity: number;
  position: [number, number, number];
  colorHex: string;
}

export interface PointLightSettings {
  enabled: boolean;
  intensity: number;
  position: [number, number, number];
  distance: number;
  decay: number;
  colorHex: string;
}

export interface SceneLightingRigConfig {
  ambient: AmbientLightSettings;
  directional: DirectionalLightSettings;
  point: PointLightSettings;
  showLightHelpers: boolean;
  hdriPreset?: HdriEnvironmentPresetId;
  envMapIntensity?: number;
}

export function getPresetLightingRigConfig(preset: LightingPresetId): SceneLightingRigConfig {
  switch (preset) {
    case 'dia':
      return {
        ambient: {
          enabled: true,
          intensity: 0.95,
          colorHex: '#DBEAFE',
          groundColorHex: '#1E293B',
        },
        directional: {
          enabled: true,
          intensity: 2.1,
          position: [8.5, 12.0, 7.5],
          colorHex: '#FFF7ED',
        },
        point: {
          enabled: true,
          intensity: 1.8,
          position: [0.0, 3.2, 0.5],
          distance: 14,
          decay: 1.5,
          colorHex: '#FFF8EB',
        },
        showLightHelpers: false,
        hdriPreset: 'industrial',
        envMapIntensity: 1.35,
      };
    case 'tarde':
      return {
        ambient: {
          enabled: true,
          intensity: 0.75,
          colorHex: '#FECDD3',
          groundColorHex: '#311B22',
        },
        directional: {
          enabled: true,
          intensity: 2.4,
          position: [11.0, 4.2, 5.0],
          colorHex: '#FB923C',
        },
        point: {
          enabled: true,
          intensity: 2.4,
          position: [0.4, 2.8, 0.8],
          distance: 15,
          decay: 1.5,
          colorHex: '#FDE68A',
        },
        showLightHelpers: false,
        hdriPreset: 'almacen',
        envMapIntensity: 1.15,
      };
    case 'noche':
      return {
        ambient: {
          enabled: true,
          intensity: 0.25,
          colorHex: '#1E293B',
          groundColorHex: '#020617',
        },
        directional: {
          enabled: true,
          intensity: 0.15,
          position: [-6.0, 9.0, -5.0],
          colorHex: '#93C5FD',
        },
        point: {
          enabled: true,
          intensity: 3.8,
          position: [0.0, 3.1, 0.2],
          distance: 16,
          decay: 1.3,
          colorHex: '#FEF08A',
        },
        showLightHelpers: false,
        hdriPreset: 'almacen',
        envMapIntensity: 0.9,
      };
    case 'rasante':
      return {
        ambient: {
          enabled: true,
          intensity: 0.2,
          colorHex: '#CBD5E1',
          groundColorHex: '#0F172A',
        },
        directional: {
          enabled: true,
          intensity: 3.4,
          position: [-3.6, 2.0, 3.0],
          colorHex: '#FFFFFF',
        },
        point: {
          enabled: true,
          intensity: 1.4,
          position: [-1.8, 2.2, -1.2],
          distance: 12,
          decay: 1.6,
          colorHex: '#E0F2FE',
        },
        showLightHelpers: false,
        hdriPreset: 'estudio',
        envMapIntensity: 1.5,
      };
  }
}

function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function isValidHdriPresetId(val: unknown): val is HdriEnvironmentPresetId {
  return (
    val === 'industrial' ||
    val === 'almacen' ||
    val === 'oficina' ||
    val === 'estudio' ||
    val === 'exterior'
  );
}

export function clampLightingRigConfig(config: SceneLightingRigConfig): SceneLightingRigConfig {
  const hdriPreset: HdriEnvironmentPresetId = isValidHdriPresetId(config.hdriPreset)
    ? config.hdriPreset
    : 'industrial';
  const defaultEnvIntensity = HDRI_ENVIRONMENT_PRESETS[hdriPreset].defaultEnvMapIntensity;
  const rawEnvIntensity =
    typeof config.envMapIntensity === 'number' ? config.envMapIntensity : defaultEnvIntensity;

  return {
    ambient: {
      enabled: config.ambient.enabled !== false,
      intensity: clamp(config.ambient.intensity, 0, 4),
      colorHex: config.ambient.colorHex || '#DBEAFE',
      groundColorHex: config.ambient.groundColorHex || '#1E293B',
    },
    directional: {
      enabled: config.directional.enabled !== false,
      intensity: clamp(config.directional.intensity, 0, 6),
      position: [
        clamp(config.directional.position[0], -20, 20),
        clamp(config.directional.position[1], 0.5, 25),
        clamp(config.directional.position[2], -20, 20),
      ],
      colorHex: config.directional.colorHex || '#FFF7ED',
    },
    point: {
      enabled: config.point.enabled !== false,
      intensity: clamp(config.point.intensity, 0, 8),
      position: [
        clamp(config.point.position[0], -10, 10),
        clamp(config.point.position[1], 0.2, 10),
        clamp(config.point.position[2], -10, 10),
      ],
      distance: clamp(config.point.distance, 1, 30),
      decay: clamp(config.point.decay, 0.5, 3),
      colorHex: config.point.colorHex || '#FFF8EB',
    },
    showLightHelpers: Boolean(config.showLightHelpers),
    hdriPreset,
    envMapIntensity: clamp(rawEnvIntensity, 0, 3),
  };
}

export function applyHdriEnvironmentPreset(
  config: SceneLightingRigConfig,
  hdriId: HdriEnvironmentPresetId
): SceneLightingRigConfig {
  const spec = HDRI_ENVIRONMENT_PRESETS[hdriId] || HDRI_ENVIRONMENT_PRESETS.industrial;
  return clampLightingRigConfig({
    ...config,
    hdriPreset: spec.id,
    envMapIntensity: spec.defaultEnvMapIntensity,
    ambient: {
      ...config.ambient,
      enabled: true,
      intensity: spec.recommendedAmbient.intensity,
      colorHex: spec.recommendedAmbient.colorHex,
      groundColorHex: spec.recommendedAmbient.groundColorHex,
    },
  });
}

export function toggleLightVisibility(
  config: SceneLightingRigConfig,
  key: LightSourceKey,
  explicitEnabled?: boolean
): SceneLightingRigConfig {
  const current = config[key].enabled !== false;
  const nextState = explicitEnabled !== undefined ? explicitEnabled : !current;
  return {
    ...config,
    [key]: {
      ...config[key],
      enabled: nextState,
    },
  };
}

export function setAllLightsVisibility(
  config: SceneLightingRigConfig,
  enabled: boolean
): SceneLightingRigConfig {
  return {
    ...config,
    ambient: { ...config.ambient, enabled },
    directional: { ...config.directional, enabled },
    point: { ...config.point, enabled },
  };
}

export function getActiveLightsSummary(config: SceneLightingRigConfig): {
  activeCount: number;
  totalCount: number;
  allEnabled: boolean;
  noneEnabled: boolean;
} {
  const flags = [
    config.ambient.enabled !== false,
    config.directional.enabled !== false,
    config.point.enabled !== false,
  ];
  const activeCount = flags.filter(Boolean).length;
  return {
    activeCount,
    totalCount: 3,
    allEnabled: activeCount === 3,
    noneEnabled: activeCount === 0,
  };
}

export function calculateEffectiveSceneLux(
  config: SceneLightingRigConfig,
  floorAreaSqm: number
): number {
  const safeArea = Math.max(8, floorAreaSqm);
  const clamped = clampLightingRigConfig(config);

  const envBoost = 0.75 + (clamped.envMapIntensity ?? 1.2) * 0.25;
  const ambientContribution = clamped.ambient.enabled
    ? clamped.ambient.intensity * 120 * envBoost
    : 0;

  // Higher sun elevation increases vertical incidence on floor
  const dirHeightFactor = Math.max(0.25, Math.min(1.2, clamped.directional.position[1] / 10));
  const directionalContribution = clamped.directional.enabled
    ? clamped.directional.intensity * 115 * dirHeightFactor
    : 0;

  // Point light proximity to floor center (0, 0, 0)
  const [px, py, pz] = clamped.point.position;
  const distSq = px * px + py * py + pz * pz;
  const attenuation = 1 / (1 + 0.06 * distSq);
  const pointContribution = clamped.point.enabled
    ? clamped.point.intensity * 95 * attenuation * (24 / safeArea)
    : 0;

  return Math.round(ambientContribution + directionalContribution + pointContribution);
}
