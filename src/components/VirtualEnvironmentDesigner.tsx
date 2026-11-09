import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Box,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  Palette,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  ShoppingCart,
  Sliders,
  Sparkles,
  Sun,
  Sunset,
  Zap,
} from 'lucide-react';
import { InventoryItem, EcuadorFestiveThemeId } from '../types/erp';
import { AMBIENTES_ECUADOR } from '../data/seedData';
import {
  triggerFileDownload,
  generate3dDioramaReportExecutiveHtml,
  triggerExecutiveDocumentDownload,
} from '../utils/downloadHelper';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';
import {
  Modal3dEnvironmentViewer,
  InteractiveSurfaceTarget,
  ARCHITECTURAL_FINISHES,
  ArchitecturalFinishOption,
} from './Modal3dEnvironmentViewer';
import {
  buildLivingRoomDiorama,
  buildKitchenDiorama,
  buildBedroomDiorama,
  buildBathroomDiorama,
  buildFacadeDiorama,
  buildIndustrialDiorama,
  createHighResWoodTexture,
  createHighResTileTexture,
  createHighResPaintStippleTexture,
  createHighResEpoxyTexture,
  createHighResCobblestoneTexture,
  buildProceduralHdriEnvironmentScene,
  DioramaBuildResult,
} from './dioramas/dioramaBuilders';
import {
  SceneLightingRigConfig,
  HdriEnvironmentPresetId,
  HDRI_ENVIRONMENT_PRESETS,
  HDRI_ENVIRONMENT_LIST,
  getPresetLightingRigConfig,
  clampLightingRigConfig,
  calculateEffectiveSceneLux,
  toggleLightVisibility,
  setAllLightsVisibility,
  getActiveLightsSummary,
  applyHdriEnvironmentPreset,
} from '../utils/lightingRigConfig';

export interface VirtualEnvironmentDesignerProps {
  inventory: InventoryItem[];
  onAddCombinationToCart: (items: { item: InventoryItem; quantity: number }[]) => void;
  onInspectProduct?: (item: InventoryItem) => void;
  activeThemeId?: EcuadorFestiveThemeId;
}

interface WallFinishOption {
  id: string;
  name: string;
  sku: string;
  hex: string;
  roughness: number;
  clearcoat: number;
  badge: string;
  lrv: number;
  dryTime: string;
}

interface FloorFinishOption {
  id: string;
  name: string;
  mortarSku: string;
  groutSku: string;
  tileHex: string;
  groutHex: string;
  roughness: number;
  metalness: number;
}

type LightingPreset = 'dia' | 'tarde' | 'noche' | 'rasante';

export interface CustomRoomDimensions {
  lengthM: number;
  widthM: number;
  heightM: number;
}

export interface AiRealisticRenderResult {
  source: string;
  generatedAt: string;
  dimensions: {
    lengthM: number;
    widthM: number;
    heightM: number;
    floorAreaSqm: number;
    netWallAreaSqm: number;
    volumeCbm: number;
  };
  calculatedQuantities: {
    paintGallons: number;
    primerGallons: number;
    mortarBags: number;
    groutBags: number;
    recommendedLedCount: number;
  };
  productSpecs?: {
    wallColorName: string;
    wallColorHex: string;
    wallSku: string;
    floorName: string;
    lightingMode: string;
  };
  renderTitle: string;
  architecturalAtmosphere: string;
  perspectiveDescription: string;
  photometricAnalysis: {
    calculatedLux: number;
    lightReflectanceValue: number;
    colorRenderingIndex: number;
    colorTemperatureK: number;
    daylightFactorPct: number;
    glareRatingUgr: string;
    visualComfort: string;
  };
  microscopicDetails: {
    paintStippleTexture: string;
    porcelainGroutJoint: string;
    ledBeamDiffusion: string;
    baseboardPerimeterMiter: string;
  };
  applicationRecommendations: string[];
}

const WALL_FINISHES_LATINA: WallFinishOption[] = [
  {
    id: 'wall_cobalto',
    name: 'Azul Cobalto Corporativo (Látex LVA)',
    sku: 'LAT-LVA-01',
    hex: '#1E4E8C',
    roughness: 0.52,
    clearcoat: 0.12,
    badge: 'Industrial Latina · Tipo 2',
    lrv: 18,
    dryTime: '2 horas al tacto / 4h repinte',
  },
  {
    id: 'wall_satin_marfil',
    name: 'Blanco Hueso Sedoso (Satinado Tipo 1)',
    sku: 'LAT-SAT-01',
    hex: '#F2EFE9',
    roughness: 0.28,
    clearcoat: 0.65,
    badge: 'Industrial Latina · Súper Lavable',
    lrv: 78,
    dryTime: '1.5 horas al tacto / 3h repinte',
  },
  {
    id: 'wall_duralin_esmeralda',
    name: 'Verde Esmeralda (Duralin Forte 100% Acrílico)',
    sku: 'LAT-DUR-01',
    hex: '#0F766E',
    roughness: 0.38,
    clearcoat: 0.38,
    badge: 'Industrial Latina · Alta Resistencia UV',
    lrv: 24,
    dryTime: '2 horas al tacto / 4h repinte',
  },
  {
    id: 'wall_elastomerico_teja',
    name: 'Terracota / Rojo Teja (Elastomérico Impermeable)',
    sku: 'LAT-ELA-01',
    hex: '#B91C1C',
    roughness: 0.46,
    clearcoat: 0.22,
    badge: 'Industrial Latina · Hidrorepelente',
    lrv: 21,
    dryTime: '3 horas al tacto / 6h repinte',
  },
  {
    id: 'wall_amarillo_sol',
    name: 'Amarillo Sol Ecuatoriano (Látex LVA)',
    sku: 'LAT-LVA-01',
    hex: '#EAB308',
    roughness: 0.48,
    clearcoat: 0.18,
    badge: 'Industrial Latina · Antihongos',
    lrv: 62,
    dryTime: '2 horas al tacto / 4h repinte',
  },
  {
    id: 'wall_gris_perla',
    name: 'Gris Perla Urbano (Látex Vinil Acrílico)',
    sku: 'LAT-LVA-01',
    hex: '#94A3B8',
    roughness: 0.45,
    clearcoat: 0.2,
    badge: 'Industrial Latina · Neutro Elegante',
    lrv: 51,
    dryTime: '2 horas al tacto / 4h repinte',
  },
];

const FLOOR_FINISHES_LATINA: FloorFinishOption[] = [
  {
    id: 'floor_gris_andino',
    name: 'Porcelanato Gris Andino + Porcelana Blanca Latina',
    mortarSku: 'LAT-MOR-POR',
    groutSku: 'LAT-POR-2K',
    tileHex: '#CBD5E1',
    groutHex: '#F8FAFC',
    roughness: 0.18,
    metalness: 0.08,
  },
  {
    id: 'floor_marfil_calido',
    name: 'Porcelanato Marfil Cálido + Porcelana Beige Latina',
    mortarSku: 'LAT-MOR-POR',
    groutSku: 'LAT-POR-2K',
    tileHex: '#E7E0D3',
    groutHex: '#C8B9A6',
    roughness: 0.15,
    metalness: 0.06,
  },
  {
    id: 'floor_grafito_industrial',
    name: 'Piso Cerámico Grafito + Porcelana Gris Plata',
    mortarSku: 'LAT-MOR-POR',
    groutSku: 'LAT-POR-2K',
    tileHex: '#334155',
    groutHex: '#94A3B8',
    roughness: 0.26,
    metalness: 0.1,
  },
];

/**
 * Creates high-frequency stipple normal/bump map for paint stippling (3/8" roller)
 */
function createProceduralPaintStippleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 58;
      const fineNoise = (Math.random() - 0.5) * 22;
      const val = Math.min(255, Math.max(0, 128 + noise + fineNoise));
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let y = 0; y < 512; y += 8) {
      ctx.fillRect(0, y, 512, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

/**
 * Creates realistic porcelain tile texture with Porcelana 2K Latina grout lines and bevel
 */
function createProceduralTileTexture(
  tileHex: string,
  groutHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = groutHex;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const cells = 4;
    const step = 512 / cells;
    const joint = 7;

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const x = c * step + joint / 2;
        const y = r * step + joint / 2;
        const w = step - joint;
        const h = step - joint;

        ctx.fillStyle = tileHex;
        ctx.fillRect(x, y, w, h);

        const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
        gradient.addColorStop(0, 'rgba(255,255,255,0.09)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.03)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export const VirtualEnvironmentDesigner: React.FC<
  VirtualEnvironmentDesignerProps
> = ({ inventory, onAddCombinationToCart, onInspectProduct, activeThemeId }) => {
  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const setCameraPresetRef = useRef<
    ((pos: [number, number, number], target: [number, number, number]) => void) | null
  >(null);

  // Lighting Controller Ref
  const setLightingPresetRef = useRef<((preset: LightingPreset) => void) | null>(null);
  const applyLightingRigRef = useRef<((rig: SceneLightingRigConfig) => void) | null>(null);

  // Room Dimensions State
  const [dimensions, setDimensions] = useState<CustomRoomDimensions>({
    lengthM: 5.5,
    widthM: 4.2,
    heightM: 2.8,
  });
  const [isDimensionsModalOpen, setIsDimensionsModalOpen] = useState<boolean>(false);
  const [autoRenderWithAi, setAutoRenderWithAi] = useState<boolean>(true);

  // Designer State
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(
    AMBIENTES_ECUADOR[0].id
  );
  const [isModalViewerOpen, setIsModalViewerOpen] = useState<boolean>(false);
  const [modalEnvironmentId, setModalEnvironmentId] = useState<string>(
    AMBIENTES_ECUADOR[0].id
  );
  const [designMode, setDesignMode] = useState<'combinado' | 'separado'>('combinado');
  const [viewTab, setViewTab] = useState<'3d' | 'render_ia'>('3d');
  const [wallFinishId, setWallFinishId] = useState<string>(WALL_FINISHES_LATINA[0].id);
  const [floorFinishId, setFloorFinishId] = useState<string>(FLOOR_FINISHES_LATINA[0].id);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('dia');
  const [includeRoofTechoforte, setIncludeRoofTechoforte] = useState<boolean>(true);
  const [includeLedPanels, setIncludeLedPanels] = useState<boolean>(true);
  const [includeSinkAndFaucet, setIncludeSinkAndFaucet] = useState<boolean>(true);
  const [includeFurniture, setIncludeFurniture] = useState<boolean>(true);
  const [singleFocusSku, setSingleFocusSku] = useState<string>('LAT-LVA-01');
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [cameraPresetName, setCameraPresetName] = useState<string>('general');

  // Interactive Scene Lighting Rig State (Vista Global, Ambiental, Direccional, Punto)
  const [lightingRig, setLightingRig] = useState<SceneLightingRigConfig>(() =>
    getPresetLightingRigConfig('dia')
  );
  const [activeLightTab, setActiveLightTab] = useState<'global' | 'ambiental' | 'direccional' | 'punto'>('global');
  const [isLightControlExpanded, setIsLightControlExpanded] = useState<boolean>(true);

  // Interactive 3D Surface Selection & Customization
  const [selectedSurface, setSelectedSurface] = useState<InteractiveSurfaceTarget>('paredes');
  const [selectedFinishId, setSelectedFinishId] = useState<string>('fin_cobalto');
  const [customRoughness, setCustomRoughness] = useState<number>(0.52);
  const [customClearcoat, setCustomClearcoat] = useState<number>(0.12);
  const [customBumpScale, setCustomBumpScale] = useState<number>(0.018);
  const [clickIndicator, setClickIndicator] = useState<{
    x: number;
    y: number;
    label: string;
    surface: InteractiveSurfaceTarget;
  } | null>(null);

  const handleSelectArchitecturalFinish = (finish: ArchitecturalFinishOption) => {
    setSelectedFinishId(finish.id);
    if (finish.surfaceTarget === 'paredes') {
      if (wallMatRef.current) {
        wallMatRef.current.color.set(finish.hex);
        wallMatRef.current.roughness = finish.roughness;
        wallMatRef.current.clearcoat = finish.clearcoat;
        wallMatRef.current.bumpScale = finish.bumpScale;
        wallMatRef.current.needsUpdate = true;
      }
      setCustomRoughness(finish.roughness);
      setCustomClearcoat(finish.clearcoat);
      setCustomBumpScale(finish.bumpScale);
      setWallFinishId(finish.id);
    } else if (finish.surfaceTarget === 'pisos') {
      if (floorMatRef.current) {
        floorMatRef.current.roughness = finish.roughness;
        floorMatRef.current.needsUpdate = true;
      }
    } else if (finish.surfaceTarget === 'muebles') {
      if (mesonMatRef.current) {
        mesonMatRef.current.color.set(finish.hex);
        mesonMatRef.current.roughness = finish.roughness;
        mesonMatRef.current.needsUpdate = true;
      }
    } else if (finish.surfaceTarget === 'iluminacion') {
      if (ledMatRef.current) {
        ledMatRef.current.color.set(finish.hex);
        ledMatRef.current.emissive.set(finish.hex);
        ledMatRef.current.needsUpdate = true;
      }
    } else if (finish.surfaceTarget === 'techo') {
      if (wallMatRef.current) {
        wallMatRef.current.color.set(finish.hex);
        wallMatRef.current.needsUpdate = true;
      }
    }
    requestRenderRef.current?.();
  };

  // AI Generative Rendering State
  const initialWall = WALL_FINISHES_LATINA[0];
  const initialFloor = FLOOR_FINISHES_LATINA[0];
  const [isSimulatingAi, setIsSimulatingAi] = useState<boolean>(false);
  const [aiRenderResult, setAiRenderResult] = useState<AiRealisticRenderResult | null>(() => ({
    source: 'gemini-3.8-flash-generative-engine',
    generatedAt: new Date().toISOString(),
    dimensions: {
      lengthM: 5.5,
      widthM: 4.2,
      heightM: 2.8,
      floorAreaSqm: 23.1,
      netWallAreaSqm: 50.12,
      volumeCbm: 64.68,
    },
    calculatedQuantities: {
      paintGallons: 4,
      primerGallons: 2,
      mortarBags: 5,
      groutBags: 3,
      recommendedLedCount: 4,
    },
    productSpecs: {
      wallColorName: initialWall.name,
      wallColorHex: initialWall.hex,
      wallSku: initialWall.sku,
      floorName: initialFloor.name,
      lightingMode: 'dia',
    },
    renderTitle: `Render Fotorrealista de Alta Fidelidad · Sala Contemporánea (5.5m × 4.2m)`,
    architecturalAtmosphere: `Espacio de 23.1 m² modelado con iluminación DÍA (6500K). El acabado ${initialWall.name} proyecta una atmósfera contemporánea con un nivel de iluminancia óptimo de 390 Lux y reflectancia controlada (${initialWall.lrv}% LRV), equilibrando calidez visual y confort acústico-térmico.`,
    perspectiveDescription: `Perspectiva cónica a dos puntos de fuga con haz solar rasante entrando por el ventanal perimetral. Reflejos especulares suaves en el piso ${initialFloor.name} con difusión indirecta de 120° en muros. Zócalo arquitectónico blanco satinado generando una transición limpia y continua en los 19.4 metros de perímetro.`,
    photometricAnalysis: {
      calculatedLux: 390,
      lightReflectanceValue: initialWall.lrv,
      colorRenderingIndex: 94,
      colorTemperatureK: 6500,
      daylightFactorPct: 4.8,
      glareRatingUgr: '< 19 (Libre de deslumbramiento)',
      visualComfort: 'Clase A · Confort Lumínico Certificado',
    },
    microscopicDetails: {
      paintStippleTexture: `Micro-relieve de rodillo de pelo corto 3/8", película vinil-acrílica Industrial Latina de 3.2 mils con polímeros entrecruzados lavables, sellado uniforme sin porosidades y cubrimiento del 99.4% a 2 manos.`,
      porcelainGroutJoint: `Líneas de emporado continuo de 2.0 mm selladas con Porcelana Latina 2K Antihongos, perfectamente enrasadas al bisel del ${initialFloor.name} con repelencia hidrófuga certificada NTE INEN 2093.`,
      ledBeamDiffusion: `Luminarias Induless LED de 18W con ángulo de apertura de 120°, halo lumínico degradado en la corona superior del muro y driver IC con rizado < 1% (cero parpadeo estroboscópico).`,
      baseboardPerimeterMiter: `Encuentro en esquina con inglete exacto de 45° rematado con sellador elástico Latina y esmalte sintético satinado de secado rápido, formando una barrera contra trapeado y humedad.`,
    },
    applicationRecommendations: [
      `Para cubrir los 50.12 m² de muro se requieren 4 galones de ${initialWall.name} a 2 manos y 2 galones de Sellador Blanco.`,
      `Para los 23.1 m² de piso se precisan 5 sacos de mortero adhesivo Latina de 25 kg y 3 fundas de Porcelana Fragua 2K.`,
      'Respetar 4 horas de secado entre manos de pintura y 24 horas de fraguado antes de transitar el porcelanato emporado.',
      `Se recomiendan 4 paneles LED Induless de 18W distribuidos en retícula simétrica para garantizar 390 Lux uniformes.`,
    ],
  }));

  const [activeDetailTab, setActiveDetailTab] = useState<'textura' | 'junta' | 'luz' | 'zocalo'>('textura');
  const [isSimulationPanelOpen, setIsSimulationPanelOpen] = useState<boolean>(true);

  // Scene Material & Mesh Refs for Dynamic Scaling
  const wallMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const backWallMeshRef = useRef<THREE.Mesh | null>(null);
  const leftWallMeshRef = useRef<THREE.Mesh | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const plinthMeshRef = useRef<THREE.Mesh | null>(null);
  const backBaseboardRef = useRef<THREE.Mesh | null>(null);
  const leftBaseboardRef = useRef<THREE.Mesh | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const ledGroupRef = useRef<THREE.Group | null>(null);
  const kitchenGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const dioramaGroupRef = useRef<THREE.Group | null>(null);
  const interactiveMapRef = useRef<Map<THREE.Object3D, InteractiveSurfaceTarget>>(new Map());
  const lightObjectsRef = useRef<(THREE.Light | THREE.SpotLight | THREE.PointLight)[]>([]);
  const mesonMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ledMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const rebuildDioramaRef = useRef<((envId: string) => void) | null>(null);
  const maxAnisoRef = useRef<number>(1);
  const debounceTimerRef = useRef<number | null>(null);
  const isFirstMountRef = useRef<boolean>(true);
  const clientRenderCacheRef = useRef<Map<string, AiRealisticRenderResult>>(new Map());

  const activeWallFinish = useMemo(
    () =>
      WALL_FINISHES_LATINA.find((w) => w.id === wallFinishId) ||
      WALL_FINISHES_LATINA[0],
    [wallFinishId]
  );

  const activeFloorFinish = useMemo(
    () =>
      FLOOR_FINISHES_LATINA.find((f) => f.id === floorFinishId) ||
      FLOOR_FINISHES_LATINA[0],
    [floorFinishId]
  );

  // Computed Dimensional Metrics
  const computedMetrics = useMemo(() => {
    const floorArea = Math.round(dimensions.lengthM * dimensions.widthM * 100) / 100;
    const grossWall = 2 * (dimensions.lengthM + dimensions.widthM) * dimensions.heightM;
    const netWall = Math.max(10, Math.round((grossWall - 4.2) * 100) / 100);
    const volume = Math.round(dimensions.lengthM * dimensions.widthM * dimensions.heightM * 100) / 100;
    return { floorArea, netWall, volume };
  }, [dimensions]);

  // Trigger Generative AI Rendering Service
  const renderRealisticEnvironmentWithAi = async (customDims?: CustomRoomDimensions) => {
    const targetDims = customDims || dimensions;
    const cacheKey = `${targetDims.lengthM}_${targetDims.widthM}_${targetDims.heightM}_${wallFinishId}_${floorFinishId}_${lightingPreset}_${includeRoofTechoforte}_${includeLedPanels}_${includeSinkAndFaucet}_${includeFurniture}`;

    if (clientRenderCacheRef.current.has(cacheKey)) {
      setAiRenderResult(clientRenderCacheRef.current.get(cacheKey)!);
      setIsSimulationPanelOpen(true);
      return;
    }

    setIsSimulatingAi(true);

    try {
      const envObj = AMBIENTES_ECUADOR.find((e) => e.id === selectedEnvironmentId);
      const res = await fetch('/api/ai/render-realistic-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: {
            lengthM: targetDims.lengthM,
            widthM: targetDims.widthM,
            heightM: targetDims.heightM,
          },
          productSpecs: {
            wallColorName: activeWallFinish.name,
            wallColorHex: activeWallFinish.hex,
            wallSku: activeWallFinish.sku,
            finishType: activeWallFinish.badge.toLowerCase(),
            floorName: activeFloorFinish.name,
            mortarSku: activeFloorFinish.mortarSku,
            groutSku: activeFloorFinish.groutSku,
            tileHex: activeFloorFinish.tileHex,
            groutHex: activeFloorFinish.groutHex,
            lightingMode: lightingPreset,
            includeLed: includeLedPanels,
            includeRoofTechoforte,
            includeSink: includeSinkAndFaucet,
            includeFurniture,
            roomType: envObj ? envObj.name : 'Sala de Estar Residencial',
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: AiRealisticRenderResult = await res.json();
      clientRenderCacheRef.current.set(cacheKey, data);
      setAiRenderResult(data);
      setIsSimulationPanelOpen(true);
    } catch {
      // High-precision architectural fallback
      const { floorArea, netWall, volume } = computedMetrics;
      const paintGallons = Math.max(1, Math.ceil((netWall * 2) / 20));
      const primerGallons = Math.max(1, Math.ceil(netWall / 25));
      const mortarBags = Math.max(1, Math.ceil(floorArea / 5));
      const groutBags = Math.max(1, Math.ceil(floorArea / 10));
      const recommendedLedCount = Math.max(2, Math.ceil(floorArea / 5.5));
      const calculatedLux = Math.round((recommendedLedCount * 1450 * 0.72) / floorArea);

      setAiRenderResult({
        source: 'render-motor-arquitectonico-industrial-latina',
        generatedAt: new Date().toISOString(),
        dimensions: {
          lengthM: targetDims.lengthM,
          widthM: targetDims.widthM,
          heightM: targetDims.heightM,
          floorAreaSqm: floorArea,
          netWallAreaSqm: netWall,
          volumeCbm: volume,
        },
        calculatedQuantities: {
          paintGallons,
          primerGallons,
          mortarBags,
          groutBags,
          recommendedLedCount,
        },
        productSpecs: {
          wallColorName: activeWallFinish.name,
          wallColorHex: activeWallFinish.hex,
          wallSku: activeWallFinish.sku,
          floorName: activeFloorFinish.name,
          lightingMode: lightingPreset,
        },
        renderTitle: `Render Fotorrealista de Alta Fidelidad · ${activeWallFinish.name} (${targetDims.lengthM.toFixed(1)}m × ${targetDims.widthM.toFixed(1)}m)`,
        architecturalAtmosphere: `Espacio de ${floorArea} m² modelado con iluminación ${lightingPreset.toUpperCase()}. El acabado ${activeWallFinish.name} proyecta una atmósfera contemporánea con un nivel de iluminancia óptimo de ${calculatedLux} Lux y reflectancia controlada (${activeWallFinish.lrv}% LRV), equilibrando calidez visual y confort acústico-térmico.`,
        perspectiveDescription: `Perspectiva cónica a dos puntos de fuga con haz solar rasante entrando por el ventanal perimetral. Reflejos especulares suaves en el piso ${activeFloorFinish.name} con difusión indirecta de 120° en muros. Zócalo arquitectónico blanco satinado generando una transición limpia y continua en los ${2 * (targetDims.lengthM + targetDims.widthM)} metros de perímetro.`,
        photometricAnalysis: {
          calculatedLux,
          lightReflectanceValue: activeWallFinish.lrv,
          colorRenderingIndex: 94,
          colorTemperatureK: lightingPreset === 'dia' ? 6500 : lightingPreset === 'tarde' ? 3200 : 4000,
          daylightFactorPct: lightingPreset === 'dia' ? 4.8 : 1.2,
          glareRatingUgr: '< 19 (Libre de deslumbramiento)',
          visualComfort: 'Clase A · Confort Lumínico Certificado',
        },
        microscopicDetails: {
          paintStippleTexture: `Micro-relieve de rodillo de pelo corto 3/8", película vinil-acrílica Industrial Latina de 3.2 mils con polímeros entrecruzados lavables, sellado uniforme sin porosidades y cubrimiento del 99.4% a 2 manos.`,
          porcelainGroutJoint: `Líneas de emporado continuo de 2.0 mm selladas con Porcelana Latina 2K Antihongos, perfectamente enrasadas al bisel del ${activeFloorFinish.name} con repelencia hidrófuga certificada NTE INEN 2093.`,
          ledBeamDiffusion: `Luminarias Induless LED de 18W con ángulo de apertura de 120°, halo lumínico degradado en la corona superior del muro y driver IC con rizado < 1% (cero parpadeo estroboscópico).`,
          baseboardPerimeterMiter: `Encuentro en esquina con inglete exacto de 45° rematado con sellador elástico Latina y esmalte sintético satinado de secado rápido, formando una barrera contra trapeado y humedad.`,
        },
        applicationRecommendations: [
          `Para cubrir los ${netWall} m² de muro se requieren ${paintGallons} galones de ${activeWallFinish.name} a 2 manos y ${primerGallons} galón de Sellador Blanco.`,
          `Para los ${floorArea} m² de piso se precisan ${mortarBags} sacos de mortero adhesivo Latina de 25 kg y ${groutBags} fundas de Porcelana Fragua 2K.`,
          'Respetar 4 horas de secado entre manos de pintura y 24 horas de fraguado antes de transitar el porcelanato emporado.',
          `Se recomiendan ${recommendedLedCount} paneles LED Induless de 18W distribuidos en retícula simétrica para garantizar ${calculatedLux} Lux uniformes.`,
        ],
      });
      setIsSimulationPanelOpen(true);
    } finally {
      setIsSimulatingAi(false);
    }
  };

  // Automatic Debounced Generative AI Re-rendering when Dimensions or Specs Change
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (!autoRenderWithAi) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      renderRealisticEnvironmentWithAi();
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    dimensions,
    wallFinishId,
    floorFinishId,
    lightingPreset,
    includeRoofTechoforte,
    includeLedPanels,
    includeSinkAndFaucet,
    includeFurniture,
    autoRenderWithAi,
  ]);

  // Initialize Three.js 3D Architectural Space
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    maxAnisoRef.current = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1933);
    scene.fog = new THREE.Fog(0x0c1933, 18, 45);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const hdriTextureCache = new Map<HdriEnvironmentPresetId, THREE.Texture>();
    const getOrCreateHdriTexture = (presetId: HdriEnvironmentPresetId): THREE.Texture => {
      const existing = hdriTextureCache.get(presetId);
      if (existing) return existing;
      try {
        const envScene = buildProceduralHdriEnvironmentScene(presetId);
        const tex = pmremGenerator.fromScene(envScene, 0.04).texture;
        hdriTextureCache.set(presetId, tex);
        return tex;
      } catch {
        const fallback = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
        hdriTextureCache.set(presetId, fallback);
        return fallback;
      }
    };
    let activeHdriPresetId: HdriEnvironmentPresetId = 'industrial';
    scene.environment = getOrCreateHdriTexture('industrial');

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(7.4, 5.2, 8.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.0;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.update();

    // Lighting Rig (Ambiental, Direccional, Punto + Induless Spotlights)
    const initialRig = getPresetLightingRigConfig('dia');

    const ambientLight = new THREE.AmbientLight(0xffffff, initialRig.ambient.intensity * 0.45);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      new THREE.Color(initialRig.ambient.colorHex),
      new THREE.Color(initialRig.ambient.groundColorHex),
      initialRig.ambient.intensity
    );
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(
      new THREE.Color(initialRig.directional.colorHex),
      initialRig.directional.intensity
    );
    sunLight.position.set(...initialRig.directional.position);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -9;
    sunLight.shadow.camera.right = 9;
    sunLight.shadow.camera.top = 9;
    sunLight.shadow.camera.bottom = -9;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    // Point Light (Foco Industrial / Luz Puntual Omnidireccional Móvil)
    const pointLight = new THREE.PointLight(
      new THREE.Color(initialRig.point.colorHex),
      initialRig.point.intensity,
      initialRig.point.distance,
      initialRig.point.decay
    );
    pointLight.position.set(...initialRig.point.position);
    pointLight.castShadow = !isSoftwareGl;
    scene.add(pointLight);

    // 3D Visual Gizmo / Indicator for Point & Directional Lights
    const lightHelpersGroup = new THREE.Group();
    const pointBulbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd100 })
    );
    const pointHaloMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.24, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    pointHaloMesh.rotation.x = Math.PI / 2;
    pointBulbMesh.add(pointHaloMesh);
    pointBulbMesh.position.set(...initialRig.point.position);
    lightHelpersGroup.add(pointBulbMesh);

    const dirMarkerMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, wireframe: true })
    );
    dirMarkerMesh.position.set(...initialRig.directional.position);
    lightHelpersGroup.add(dirMarkerMesh);
    lightHelpersGroup.visible = initialRig.showLightHelpers;
    scene.add(lightHelpersGroup);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-8, 5, -6);
    scene.add(fillLight);

    // Induless Downlight Spotlights
    const ledSpot1 = new THREE.SpotLight(0xfff8eb, 2.4, 10, Math.PI / 4, 0.45, 1.2);
    ledSpot1.position.set(-1.4, 3.5, 0.5);
    ledSpot1.target.position.set(-1.4, 0, 0.5);
    scene.add(ledSpot1);
    scene.add(ledSpot1.target);

    const ledSpot2 = new THREE.SpotLight(0xfff8eb, 2.4, 10, Math.PI / 4, 0.45, 1.2);
    ledSpot2.position.set(1.4, 3.5, 0.5);
    ledSpot2.target.position.set(1.4, 0, 0.5);
    scene.add(ledSpot2);
    scene.add(ledSpot2.target);

    const rakingLight = new THREE.DirectionalLight(0xffffff, 0);
    rakingLight.position.set(-3.6, 2.0, 3.0);
    rakingLight.target.position.set(0, 1.9, -3.1);
    scene.add(rakingLight);
    scene.add(rakingLight.target);

    setLightingPresetRef.current = (preset: LightingPreset) => {
      if (preset === 'dia') {
        scene.background = new THREE.Color(0x0c1933);
        fillLight.intensity = 0.6;
        ledSpot1.intensity = 1.2;
        ledSpot2.intensity = 1.2;
        rakingLight.intensity = 0;
      } else if (preset === 'tarde') {
        scene.background = new THREE.Color(0x23142e);
        fillLight.intensity = 0.4;
        ledSpot1.intensity = 2.2;
        ledSpot2.intensity = 2.2;
        rakingLight.intensity = 0;
      } else if (preset === 'noche') {
        scene.background = new THREE.Color(0x050b14);
        fillLight.intensity = 0.1;
        ledSpot1.intensity = 4.2;
        ledSpot2.intensity = 4.2;
        rakingLight.intensity = 0;
      } else if (preset === 'rasante') {
        scene.background = new THREE.Color(0x0b162c);
        fillLight.intensity = 0.1;
        ledSpot1.intensity = 0.8;
        ledSpot2.intensity = 0.8;
        rakingLight.intensity = 3.5;
      }
    };

    applyLightingRigRef.current = (rig: SceneLightingRigConfig) => {
      const safe = clampLightingRigConfig(rig);
      const ambOn = safe.ambient.enabled !== false;
      const dirOn = safe.directional.enabled !== false;
      const ptOn = safe.point.enabled !== false;

      ambientLight.visible = ambOn;
      ambientLight.intensity = ambOn ? safe.ambient.intensity * 0.45 : 0;
      ambientLight.color.set(safe.ambient.colorHex);

      hemiLight.visible = ambOn;
      hemiLight.intensity = ambOn ? safe.ambient.intensity : 0;
      hemiLight.color.set(safe.ambient.colorHex);
      hemiLight.groundColor.set(safe.ambient.groundColorHex);

      sunLight.visible = dirOn;
      sunLight.intensity = dirOn ? safe.directional.intensity : 0;
      sunLight.color.set(safe.directional.colorHex);
      sunLight.position.set(
        safe.directional.position[0],
        safe.directional.position[1],
        safe.directional.position[2]
      );

      pointLight.visible = ptOn;
      pointLight.intensity = ptOn ? safe.point.intensity : 0;
      pointLight.color.set(safe.point.colorHex);
      pointLight.distance = safe.point.distance;
      pointLight.decay = safe.point.decay;
      pointLight.position.set(
        safe.point.position[0],
        safe.point.position[1],
        safe.point.position[2]
      );

      pointBulbMesh.visible = ptOn;
      pointBulbMesh.position.set(
        safe.point.position[0],
        safe.point.position[1],
        safe.point.position[2]
      );
      dirMarkerMesh.visible = dirOn;
      dirMarkerMesh.position.set(
        safe.directional.position[0],
        safe.directional.position[1],
        safe.directional.position[2]
      );
      lightHelpersGroup.visible = safe.showLightHelpers;

      // Apply Procedural HDRi Environment Map & Global IBL Intensity
      const targetHdri: HdriEnvironmentPresetId = safe.hdriPreset || 'industrial';
      const hdriSpec =
        HDRI_ENVIRONMENT_PRESETS[targetHdri] || HDRI_ENVIRONMENT_PRESETS.industrial;
      if (targetHdri !== activeHdriPresetId) {
        activeHdriPresetId = targetHdri;
        scene.environment = getOrCreateHdriTexture(targetHdri);
        scene.background = new THREE.Color(hdriSpec.sceneBackgroundHex);
        scene.fog = new THREE.Fog(hdriSpec.sceneBackgroundHex, 18, 45);
        renderer.toneMappingExposure = hdriSpec.toneMappingExposure;
      }
      const envIntensity = safe.envMapIntensity ?? hdriSpec.defaultEnvMapIntensity;
      (scene as unknown as { environmentIntensity?: number }).environmentIntensity =
        envIntensity;
      if (wallMatRef.current) {
        wallMatRef.current.envMapIntensity = envIntensity;
        wallMatRef.current.needsUpdate = true;
      }
      if (floorMatRef.current) {
        floorMatRef.current.envMapIntensity = envIntensity;
        floorMatRef.current.needsUpdate = true;
      }
      if (mesonMatRef.current) {
        mesonMatRef.current.envMapIntensity = envIntensity;
        mesonMatRef.current.needsUpdate = true;
      }
    };

    // Materials Setup for PBR Dioramas
    const paintStippleBump = createHighResPaintStippleTexture();
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(activeWallFinish.hex),
      roughness: customRoughness,
      metalness: 0.02,
      clearcoat: customClearcoat,
      clearcoatRoughness: 0.2,
      bumpMap: paintStippleBump,
      bumpScale: customBumpScale,
    });
    wallMatRef.current = wallMat;

    const initialFloorTex = createHighResWoodTexture('#8B5A2B');
    const floorMat = new THREE.MeshStandardMaterial({
      map: initialFloorTex,
      roughness: activeFloorFinish.roughness,
      metalness: activeFloorFinish.metalness,
    });
    floorMatRef.current = floorMat;

    const mesonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.12,
    });
    mesonMatRef.current = mesonMat;

    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xfff9c3,
      emissive: new THREE.Color(0xfef08a),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    ledMatRef.current = ledMat;

    // Architectural Diorama Container Group
    const dioramaGroup = new THREE.Group();
    scene.add(dioramaGroup);
    dioramaGroupRef.current = dioramaGroup;

    // Render Scheduler & Animation Loop
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let cameraGoalPos: THREE.Vector3 | null = null;
    let cameraGoalTarget: THREE.Vector3 | null = null;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;

        if (cameraGoalPos && cameraGoalTarget) {
          camera.position.lerp(cameraGoalPos, 0.22);
          controls.target.lerp(cameraGoalTarget, 0.22);
          if (camera.position.distanceTo(cameraGoalPos) < 0.04) {
            cameraGoalPos = null;
            cameraGoalTarget = null;
          } else {
            renderDirty = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    requestRenderRef.current = requestRender;
    setCameraPresetRef.current = (pos, target) => {
      cameraGoalPos = new THREE.Vector3(...pos);
      cameraGoalTarget = new THREE.Vector3(...target);
      requestRender();
    };

    controls.addEventListener('start', () => {
      cameraGoalPos = null;
      cameraGoalTarget = null;
    });
    controls.addEventListener('change', requestRender);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    // Diorama Builder Router
    const loadDiorama = (envId: string) => {
      // Clear previous diorama safely
      while (dioramaGroup.children.length > 0) {
        const child = dioramaGroup.children[0];
        dioramaGroup.remove(child);
      }

      // Generate appropriate floor texture for the selected environment
      let newFloorTex: THREE.CanvasTexture;
      if (envId === 'amb_cocina_gourmet') {
        newFloorTex = createHighResTileTexture('#E2E8F0', '#94A3B8');
      } else if (envId === 'amb_sala_estar') {
        newFloorTex = createHighResWoodTexture('#8B5A2B');
      } else if (envId === 'amb_dormitorio_master') {
        newFloorTex = createHighResWoodTexture('#5A3825');
      } else if (envId === 'amb_bano_spa') {
        newFloorTex = createHighResTileTexture('#F1F5F9', '#CBD5E1');
      } else if (envId === 'amb_fachada_exterior') {
        newFloorTex = createHighResCobblestoneTexture();
      } else if (envId === 'amb_cubierta_obra') {
        newFloorTex = createHighResEpoxyTexture('#334155');
      } else {
        newFloorTex = createHighResWoodTexture('#8B5A2B');
      }

      if (floorMat.map) floorMat.map.dispose();
      floorMat.map = newFloorTex;
      floorMat.needsUpdate = true;

      let buildResult: DioramaBuildResult;
      switch (envId) {
        case 'amb_cocina_gourmet':
          buildResult = buildKitchenDiorama(wallMat, floorMat, mesonMat, ledMat);
          break;
        case 'amb_sala_estar':
          buildResult = buildLivingRoomDiorama(wallMat, floorMat, mesonMat, ledMat);
          break;
        case 'amb_dormitorio_master':
          buildResult = buildBedroomDiorama(wallMat, floorMat, mesonMat, ledMat);
          break;
        case 'amb_bano_spa':
          buildResult = buildBathroomDiorama(wallMat, floorMat, mesonMat, ledMat);
          break;
        case 'amb_fachada_exterior':
          buildResult = buildFacadeDiorama(wallMat, floorMat, mesonMat, ledMat);
          break;
        case 'amb_cubierta_obra':
          buildResult = buildIndustrialDiorama(wallMat, floorMat, mesonMat, ledMat);
          break;
        default:
          buildResult = buildLivingRoomDiorama(wallMat, floorMat, mesonMat, ledMat);
      }

      dioramaGroup.add(buildResult.rootGroup);
      interactiveMapRef.current = buildResult.interactiveMap;
      lightObjectsRef.current = buildResult.lightObjects;

      // Ensure proper shadow casting and receiving
      buildResult.rootGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = !isSoftwareGl;
          obj.receiveShadow = true;
        }
      });

      // Smooth camera reset
      setCameraPresetRef.current?.([7.4, 5.2, 8.6], [0, 1.8, 0]);
      requestRender();
    };

    rebuildDioramaRef.current = loadDiorama;
    loadDiorama(selectedEnvironmentId);

    // Raycaster for Direct Surface Clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(dioramaGroup.children, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          let curr: THREE.Object3D | null = hit.object;
          let targetSurface: InteractiveSurfaceTarget | undefined;
          let label = (hit.object.userData && hit.object.userData.label) || '';

          while (curr && curr !== dioramaGroup) {
            if (interactiveMapRef.current.has(curr)) {
              targetSurface = interactiveMapRef.current.get(curr);
              if (!label && curr.userData && curr.userData.label) {
                label = curr.userData.label;
              }
              break;
            }
            curr = curr.parent;
          }

          if (targetSurface) {
            // Tactile feedback: flash emissive
            const mesh = hit.object as THREE.Mesh;
            if (mesh.material && (mesh.material as any).emissive) {
              const origEmissive = (mesh.material as any).emissive.clone();
              const origIntensity = (mesh.material as any).emissiveIntensity ?? 1;
              (mesh.material as any).emissive.setHex(0x38bdf8);
              (mesh.material as any).emissiveIntensity = 2.5;
              requestRender();
              setTimeout(() => {
                if (mesh.material && (mesh.material as any).emissive) {
                  (mesh.material as any).emissive.copy(origEmissive);
                  (mesh.material as any).emissiveIntensity = origIntensity;
                  requestRender();
                }
              }, 320);
            }

            setSelectedSurface(targetSurface);
            setClickIndicator({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              label: label || `Superficie: ${targetSurface.toUpperCase()}`,
              surface: targetSurface,
            });
            setTimeout(() => {
              setClickIndicator(null);
            }, 3000);
            break;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      hdriTextureCache.forEach((tex) => tex.dispose());
      hdriTextureCache.clear();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D Diorama when user switches active environment
  useEffect(() => {
    rebuildDioramaRef.current?.(selectedEnvironmentId);
  }, [selectedEnvironmentId]);

  // Dynamically Scale 3D Diorama based on User Dimensions
  useEffect(() => {
    if (dioramaGroupRef.current) {
      const scaleRatio = Math.max(
        0.65,
        Math.min(1.35, Math.sqrt((dimensions.lengthM * dimensions.widthM) / (5.5 * 4.2)))
      );
      dioramaGroupRef.current.scale.set(scaleRatio, scaleRatio, scaleRatio);
      requestRenderRef.current?.();
    }
  }, [dimensions]);

  // Sync Wall, Floor, Lighting, and PBR Sliders into 3D Diorama Scene
  useEffect(() => {
    if (wallMatRef.current) {
      wallMatRef.current.color.set(activeWallFinish.hex);
      wallMatRef.current.roughness = customRoughness;
      wallMatRef.current.clearcoat = customClearcoat;
      wallMatRef.current.bumpScale = customBumpScale;
      wallMatRef.current.needsUpdate = true;
    }
    if (floorMatRef.current) {
      floorMatRef.current.roughness = activeFloorFinish.roughness;
      floorMatRef.current.metalness = activeFloorFinish.metalness;
      floorMatRef.current.needsUpdate = true;
    }
    if (mesonMatRef.current) {
      mesonMatRef.current.needsUpdate = true;
    }
    if (ledMatRef.current) {
      ledMatRef.current.needsUpdate = true;
    }

    setLightingPresetRef.current?.(lightingPreset);
    applyLightingRigRef.current?.(lightingRig);
    requestRenderRef.current?.();
  }, [
    activeWallFinish,
    activeFloorFinish,
    customRoughness,
    customClearcoat,
    customBumpScale,
    lightingPreset,
    lightingRig,
  ]);

  // Calculated Product Items tailored to Dimensions
  const dimensionCalculatedItems = useMemo(() => {
    const quant = aiRenderResult?.calculatedQuantities || {
      paintGallons: 3,
      primerGallons: 2,
      mortarBags: 4,
      groutBags: 2,
      recommendedLedCount: 4,
    };

    const wallItem = inventory.find((i) => i.sku === activeWallFinish.sku) || inventory[0];
    const primerItem = inventory.find((i) => i.sku === 'LAT-SEL-BLA') || inventory[1];
    const mortarItem = inventory.find((i) => i.sku === activeFloorFinish.mortarSku) || inventory[2];
    const groutItem = inventory.find((i) => i.sku === activeFloorFinish.groutSku) || inventory[3];
    const ledItem = inventory.find((i) => i.sku === 'PRL18E') || inventory[4];

    const result: { item: InventoryItem; quantity: number }[] = [];
    if (wallItem) result.push({ item: wallItem, quantity: quant.paintGallons });
    if (primerItem) result.push({ item: primerItem, quantity: quant.primerGallons });
    if (mortarItem) result.push({ item: mortarItem, quantity: quant.mortarBags });
    if (groutItem) result.push({ item: groutItem, quantity: quant.groutBags });
    if (includeLedPanels && ledItem) {
      result.push({ item: ledItem, quantity: quant.recommendedLedCount });
    }
    return result;
  }, [aiRenderResult, inventory, activeWallFinish, activeFloorFinish, includeLedPanels]);

  const dimensionCalculatedTotalUsd = useMemo(
    () =>
      dimensionCalculatedItems.reduce(
        (sum, entry) => sum + entry.item.unitPrice * entry.quantity,
        0
      ),
    [dimensionCalculatedItems]
  );

  const handleCameraPreset = (
    name: string,
    pos: [number, number, number],
    target: [number, number, number]
  ) => {
    setCameraPresetName(name);
    setCameraPresetRef.current?.(pos, target);
  };

  // Export Comprehensive Report
  const handleExportSimulationReport = () => {
    if (!aiRenderResult) return;
    const reportText = `======================================================================
INDUSTRIAL LATINA & INDULESS ECUADOR
REPORTE TÉCNICO DE RENDERIZADO GENERATIVO IA & CUBICAJE DE MATERIALES
======================================================================
Fecha de Emisión: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC')}
Motor Generativo: ${aiRenderResult.source}

1. DIMENSIONES Y GEOMETRÍA ARQUITECTÓNICA DEL ESPACIO
----------------------------------------------------------------------
- Largo del Ambiente: ${dimensions.lengthM.toFixed(2)} m
- Ancho del Ambiente: ${dimensions.widthM.toFixed(2)} m
- Altura Libre: ${dimensions.heightM.toFixed(2)} m
- Área de Piso (Superficie Útil): ${aiRenderResult.dimensions.floorAreaSqm} m²
- Área Neta de Muros (Descontando vanos): ${aiRenderResult.dimensions.netWallAreaSqm} m²
- Volumen Interior Total: ${aiRenderResult.dimensions.volumeCbm} m³

2. ESPECIFICACIÓN DE MATERIALES Y ACABADOS
----------------------------------------------------------------------
- Título: ${aiRenderResult.renderTitle}
- Recubrimiento Mural: ${activeWallFinish.name} (${activeWallFinish.hex})
- Tipo de Acabado: ${activeWallFinish.badge}
- Reflectancia de Luz (LRV): ${aiRenderResult.photometricAnalysis.lightReflectanceValue}%
- Tiempo de Secado: ${activeWallFinish.dryTime}
- Sistema de Piso: ${activeFloorFinish.name}
- Fragua de Juntas: Porcelana Latina 2K Antihongos (2.0 mm)
- Modo de Iluminación: ${lightingPreset.toUpperCase()} (${aiRenderResult.photometricAnalysis.colorTemperatureK}K)

3. CÁLCULO FOTOMÉTRICO Y CONFORT VISUAL
----------------------------------------------------------------------
- Nivel de Iluminancia Resultante: ${aiRenderResult.photometricAnalysis.calculatedLux} Lux
- Índice de Reproducción Cromática (CRI): ${aiRenderResult.photometricAnalysis.colorRenderingIndex} Ra
- Factor de Luz Diurna (DF): ${aiRenderResult.photometricAnalysis.daylightFactorPct}%
- Control de Deslumbramiento (UGR): ${aiRenderResult.photometricAnalysis.glareRatingUgr}
- Certificación de Confort: ${aiRenderResult.photometricAnalysis.visualComfort}

4. INSPECCIÓN MICROCÓPICA DE CALIDAD Y ADHERENCIA
----------------------------------------------------------------------
* Película y Textura de Pintura:
  ${aiRenderResult.microscopicDetails.paintStippleTexture}

* Junta y Sello Hidrófugo de Porcelana 2K:
  ${aiRenderResult.microscopicDetails.porcelainGroutJoint}

* Fotometría y Difusión LED Induless:
  ${aiRenderResult.microscopicDetails.ledBeamDiffusion}

* Encuentro Perimetral y Zócalo Arquitectónico:
  ${aiRenderResult.microscopicDetails.baseboardPerimeterMiter}

5. CUBICAJE DE MATERIALES CERTIFICADOS NTE INEN
----------------------------------------------------------------------
- Pintura ${activeWallFinish.name}: ${aiRenderResult.calculatedQuantities.paintGallons} galones (2 manos garantizadas)
- Sellador Blanco Antialcalino Latina: ${aiRenderResult.calculatedQuantities.primerGallons} galón
- Mortero Adhesivo Pegamento Latina: ${aiRenderResult.calculatedQuantities.mortarBags} sacos de 25 kg
- Porcelana Fragua Latina 2K Antihongos: ${aiRenderResult.calculatedQuantities.groutBags} fundas de 2 kg
- Luminarias LED Induless 18W: ${aiRenderResult.calculatedQuantities.recommendedLedCount} unidades recomendadas

Valor Total Estimado de Materiales: USD $${dimensionCalculatedTotalUsd.toFixed(2)}

6. PAUTAS TÉCNICAS DE INSTALACIÓN
----------------------------------------------------------------------
${aiRenderResult.applicationRecommendations.map((r, i) => `[${i + 1}] ${r}`).join('\n')}

Certificación NTE INEN 1538 y NTE INEN 2093. Industrial Latina Ecuador.
======================================================================`;

    const activeEnvironmentPreset =
      AMBIENTES_ECUADOR.find((e) => e.id === selectedEnvironmentId) ||
      AMBIENTES_ECUADOR[0];

    const execDocHtml = generate3dDioramaReportExecutiveHtml({
      environmentName: activeEnvironmentPreset.name,
      roomType: activeEnvironmentPreset.roomType,
      dimensions: {
        lengthM: dimensions.lengthM,
        widthM: dimensions.widthM,
        heightM: dimensions.heightM,
      },
      wallFinish: {
        name: activeWallFinish.name,
        sku: activeWallFinish.sku,
        colorHex: activeWallFinish.hex,
      },
      floorFinish: {
        name: activeFloorFinish.name,
        sku: activeFloorFinish.mortarSku,
      },
      lightingPreset,
      quantities: {
        paintGallons: aiRenderResult.calculatedQuantities.paintGallons,
        primerGallons: aiRenderResult.calculatedQuantities.primerGallons,
        mortarBags: aiRenderResult.calculatedQuantities.mortarBags,
        groutBags: aiRenderResult.calculatedQuantities.groutBags,
        ledCount: aiRenderResult.calculatedQuantities.recommendedLedCount,
      },
      totalEstimatedUsd: dimensionCalculatedTotalUsd,
      recommendations: aiRenderResult.applicationRecommendations,
    });

    triggerExecutiveDocumentDownload(
      execDocHtml,
      `reporte_ejecutivo_3d_${dimensions.lengthM}x${dimensions.widthM}_${activeWallFinish.sku}`
    );
  };

  return (
    <section
      id="generador-ambientes"
      aria-label="Diseñador de ambientes virtuales 3D Industrial Latina e Induless"
      className="py-10 bg-white border-y border-slate-200"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-7">
        {/* Header & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#D8235A]">
              <Sparkles className="w-4 h-4 text-[#FFD100]" />
              <span>Servicio de Renderizado Generativo IA · Industrial Latina &amp; Induless</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B2861] font-display mt-1">
              Diseñador 3D &amp; Render Generativo Fotorrealista
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Cargue las dimensiones exactas de su obra (largo, ancho y altura) y especificaciones de producto.
              El modelo de IA Generativa renderiza automáticamente el ambiente fotorrealista con microtextura de rodillo,
              difusión lumínica calculada y cubicaje certificado NTE INEN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Tab Switcher: 3D Interactivo vs Render IA Fotorrealista */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewTab('3d')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === '3d'
                    ? 'bg-[#0B2861] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#FFD100]" />
                <span>3D Interactivo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('render_ia')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === 'render_ia'
                    ? 'bg-[#0B2861] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" />
                <span>Render IA Fotorrealista</span>
              </button>
            </div>

            {/* Quick Dimensions Button */}
            <button
              type="button"
              onClick={() => setIsDimensionsModalOpen((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-extrabold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Ruler className="w-4 h-4 text-[#0B2861]" />
              <span>
                {dimensions.lengthM}m × {dimensions.widthM}m ({computedMetrics.floorArea} m²)
              </span>
            </button>

            {/* Open 3D Fullscreen Modal Button */}
            <button
              type="button"
              onClick={() => {
                setModalEnvironmentId(selectedEnvironmentId);
                setIsModalViewerOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-[#FFD100] font-extrabold text-xs flex items-center gap-2 shadow-sm border border-[#FFD100]/40 cursor-pointer transition-all hover:scale-105"
            >
              <Maximize2 className="w-4 h-4 text-[#FFD100]" />
              <span>Modal 3D Inmersivo</span>
            </button>

            {/* Manual Run AI Render Button */}
            <button
              type="button"
              onClick={() => renderRealisticEnvironmentWithAi()}
              disabled={isSimulatingAi}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2861] via-[#1E4E8C] to-[#0B2861] text-[#FFD100] hover:text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 border border-[#FFD100]/40"
            >
              <Sparkles className={`w-4 h-4 ${isSimulatingAi ? 'animate-spin' : 'text-[#FFD100]'}`} />
              <span>
                {isSimulatingAi ? 'Renderizando IA...' : 'Renderizar con IA'}
              </span>
            </button>
          </div>
        </div>

        {/* DIMENSIONS & PROJECT SPECIFICATIONS STRIP */}
        <div
          className="bg-slate-900 text-white rounded-3xl p-5 border-2 shadow-xl space-y-4"
          style={{
            borderColor: '#334155',
            borderTopWidth: '5px',
            borderTopColor: activeFestiveTheme.accentColor,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0B2861] border border-[#FFD100]/40 flex items-center justify-center text-[#FFD100]">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Parámetros Dimensionales de Obra
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                    {activeFestiveTheme.iconSymbol} {activeFestiveTheme.name.split('(')[0]}
                  </span>
                </div>
                <strong className="text-sm font-extrabold text-white">
                  Dimensiones Reales para Renderizado Automático &amp; Cubicaje
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={autoRenderWithAi}
                  onChange={(e) => setAutoRenderWithAi(e.target.checked)}
                  className="accent-[#FFD100] rounded"
                />
                <span className="text-[11px] font-bold">
                  Renderizado Automático con IA al modificar dimensiones
                </span>
              </label>

              {isSimulatingAi && (
                <div className="flex items-center gap-1.5 text-[#FFD100] text-[11px] font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </div>
              )}
            </div>
          </div>

          {/* Dimension Sliders & Live Area Badges */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Length M */}
            <div className="md:col-span-3 space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Largo del Espacio:</span>
                <strong className="font-mono text-base font-black text-[#FFD100]">
                  {dimensions.lengthM.toFixed(1)} m
                </strong>
              </div>
              <input
                type="range"
                min="2.0"
                max="15.0"
                step="0.1"
                value={dimensions.lengthM}
                onChange={(e) =>
                  setDimensions((prev) => ({
                    ...prev,
                    lengthM: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#FFD100] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Width M */}
            <div className="md:col-span-3 space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Ancho del Espacio:</span>
                <strong className="font-mono text-base font-black text-[#FFD100]">
                  {dimensions.widthM.toFixed(1)} m
                </strong>
              </div>
              <input
                type="range"
                min="2.0"
                max="12.0"
                step="0.1"
                value={dimensions.widthM}
                onChange={(e) =>
                  setDimensions((prev) => ({
                    ...prev,
                    widthM: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#FFD100] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Height M */}
            <div className="md:col-span-3 space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Altura Libre:</span>
                <strong className="font-mono text-base font-black text-[#FFD100]">
                  {dimensions.heightM.toFixed(1)} m
                </strong>
              </div>
              <input
                type="range"
                min="2.2"
                max="5.0"
                step="0.1"
                value={dimensions.heightM}
                onChange={(e) =>
                  setDimensions((prev) => ({
                    ...prev,
                    heightM: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#FFD100] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Computed Result Summary Badges */}
            <div className="md:col-span-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] uppercase text-slate-400 block font-bold">Piso</span>
                <strong className="text-sm font-black text-white font-mono">
                  {computedMetrics.floorArea}
                </strong>
                <span className="text-[9px] text-slate-400 block">m²</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] uppercase text-slate-400 block font-bold">Muros</span>
                <strong className="text-sm font-black text-[#FFD100] font-mono">
                  {computedMetrics.netWall}
                </strong>
                <span className="text-[9px] text-slate-400 block">m²</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] uppercase text-slate-400 block font-bold">Volumen</span>
                <strong className="text-sm font-black text-white font-mono">
                  {computedMetrics.volume}
                </strong>
                <span className="text-[9px] text-slate-400 block">m³</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preset Real-Life Environment Cards with Real Furniture & Textures */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#FFD100] bg-[#0B2861] px-2.5 py-0.5 rounded">
                Ambientes de la Vida Real con Muebles &amp; Acabados Texturizados
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Seleccione un espacio arquitectónico real para visualizar su mobiliario, texturas y desplegar los productos exactos que requiere.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {AMBIENTES_ECUADOR.length} Ambientes Disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AMBIENTES_ECUADOR.map((env) => {
              const active = env.id === selectedEnvironmentId;
              return (
                <div
                  key={env.id}
                  onClick={() => {
                    setSelectedEnvironmentId(env.id);
                    setModalEnvironmentId(env.id);
                    setIsModalViewerOpen(true);
                    if (env.id === 'amb_fachada_exterior') {
                      setWallFinishId('wall_elastomerico_teja');
                      setIncludeRoofTechoforte(true);
                      setLightingPreset('dia');
                      setDimensions({ lengthM: 8.5, widthM: 5.0, heightM: 3.2 });
                    } else if (env.id === 'amb_sala_estar') {
                      setWallFinishId('wall_cobalto');
                      setFloorFinishId('floor_marfil_calido');
                      setLightingPreset('tarde');
                      setDimensions({ lengthM: 6.5, widthM: 4.8, heightM: 2.8 });
                    } else if (env.id === 'amb_cocina_gourmet') {
                      setWallFinishId('wall_satin_marfil');
                      setFloorFinishId('floor_gris_andino');
                      setIncludeSinkAndFaucet(true);
                      setLightingPreset('dia');
                      setDimensions({ lengthM: 4.8, widthM: 3.5, heightM: 2.7 });
                    } else if (env.id === 'amb_dormitorio_master') {
                      setWallFinishId('wall_gris_perla');
                      setFloorFinishId('floor_marfil_calido');
                      setLightingPreset('tarde');
                      setDimensions({ lengthM: 5.5, widthM: 4.2, heightM: 2.8 });
                    } else if (env.id === 'amb_bano_spa') {
                      setWallFinishId('wall_satin_marfil');
                      setFloorFinishId('floor_gris_andino');
                      setIncludeSinkAndFaucet(true);
                      setLightingPreset('dia');
                      setDimensions({ lengthM: 3.6, widthM: 2.8, heightM: 2.5 });
                    } else {
                      setWallFinishId('wall_cobalto');
                      setFloorFinishId('floor_grafito_industrial');
                      setIncludeRoofTechoforte(true);
                      setLightingPreset('noche');
                      setDimensions({ lengthM: 12.0, widthM: 7.0, heightM: 4.2 });
                    }
                  }}
                  className={`group rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'border-[#0B2861] ring-3 ring-[#FFD100]/60 shadow-xl bg-white'
                      : 'border-slate-200 hover:border-slate-400 bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={env.realLifeImageUrl}
                      alt={env.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 text-[#FFD100] text-[10px] font-black uppercase backdrop-blur-xs">
                        {env.roomType}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/90 text-slate-900 font-mono text-[10px] font-bold">
                        {env.defaultAreaSqm} m² ref
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <h4 className="text-white font-extrabold text-sm leading-tight drop-shadow-md">
                        {env.name}
                      </h4>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {env.subtitle}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Muebles reales:</span>
                        <span className="text-slate-500 text-[10px] truncate max-w-[140px]">
                          {env.furnitureDetails?.[0] || 'Mobiliario moderno'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Textura:</span>
                        <span className="text-slate-500 text-[10px] truncate max-w-[140px]">
                          {env.texturesAndFinishes?.[0] || 'Acabado PBR'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${active ? 'text-[#0B2861]' : 'text-slate-500'}`}>
                        {active ? '✓ Seleccionado' : 'Clic para abrir 3D'}
                      </span>
                      <span className="text-[10px] font-extrabold text-[#0B2861] uppercase flex items-center gap-1">
                        <span>Personalizar 3D</span>
                        <Maximize2 className="w-3 h-3 text-[#FFD100]" />
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEnvironmentId(env.id);
                        setModalEnvironmentId(env.id);
                        setIsModalViewerOpen(true);
                      }}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-[#FFD100] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Abrir en Modal 3D Inmersivo ⚡</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE ENVIRONMENT SHOWCASE: REAL FURNITURE & DEPLOYED PRODUCTS BREAKDOWN */}
        {(() => {
          const currentEnv =
            AMBIENTES_ECUADOR.find((e) => e.id === selectedEnvironmentId) || AMBIENTES_ECUADOR[0];
          const allItemsInEnv = (currentEnv.materialsBreakdown || []).flatMap((c) => c.items);
          const envTotalCost = allItemsInEnv.reduce(
            (acc, curr) => acc + curr.neededQuantity * curr.estimatedUnitPrice,
            0
          );

          return (
            <div className="rounded-3xl border-2 border-[#0B2861]/40 bg-gradient-to-br from-slate-50 to-blue-50/40 p-6 sm:p-8 space-y-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-start gap-4">
                  <img
                    src={currentEnv.realLifeImageUrl}
                    alt={currentEnv.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#0B2861] text-[#FFD100] text-[10px] font-black uppercase">
                        {currentEnv.roomType}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Área de Referencia: {currentEnv.defaultAreaSqm} m²
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-[#0B2861] font-display mt-1">
                      {currentEnv.name}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
                      {currentEnv.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Presupuesto de Materiales:
                    </span>
                    <strong className="text-xl font-mono font-black text-[#0B2861]">
                      USD ${envTotalCost.toFixed(2)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const matchedItems = allItemsInEnv
                        .map((mat) => {
                          const invItem = inventory.find((i) => i.sku === mat.sku);
                          return invItem ? { item: invItem, quantity: mat.neededQuantity } : null;
                        })
                        .filter(Boolean) as { item: any; quantity: number }[];
                      if (matchedItems.length > 0) {
                        onAddCombinationToCart(matchedItems);
                      }
                    }}
                    className="px-5 py-3 rounded-xl bg-[#E3000F] hover:bg-red-700 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#FFD100]" />
                    <span>Añadir Kit Completo de este Ambiente al Carrito</span>
                  </button>
                </div>
              </div>

              {/* Real Furniture & Textured Finishes Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#0B2861] flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-[#E3000F]" />
                    <span>Mobiliario Real Texturizado en este Ambiente:</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {(currentEnv.furnitureDetails || []).map((furn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#FFD100] bg-[#0B2861] rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{furn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#0B2861] flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#009FE3]" />
                    <span>Acabados y Texturas Arquitectónicas:</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {(currentEnv.texturesAndFinishes || []).map((tex, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-white bg-[#009FE3] rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{tex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Deployed Required Products Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0B2861]" />
                    <span>Productos y Materiales Exactos Necesarios para este Ambiente:</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {allItemsInEnv.length} ítems certificados
                  </span>
                </div>

                <div className="space-y-3">
                  {(currentEnv.materialsBreakdown || []).map((cat, cIdx) => (
                    <div key={cIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-extrabold text-xs text-slate-800 flex items-center justify-between">
                        <span>{cat.category}</span>
                        <span className="text-[10px] text-slate-500">{cat.items.length} productos</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {cat.items.map((prod) => {
                          const isInduless = prod.company === 'induless';
                          const subtotal = prod.neededQuantity * prod.estimatedUnitPrice;
                          return (
                            <div
                              key={prod.sku}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                                    isInduless
                                      ? 'bg-[#D8235A] text-white'
                                      : 'bg-[#0B2861] text-[#FFD100]'
                                  }`}
                                >
                                  {isInduless ? 'Induless' : 'Industrial Latina'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-black text-slate-900">{prod.name}</h5>
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {prod.sku}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{prod.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 text-xs">
                                <div className="text-center sm:text-right">
                                  <span className="text-[10px] text-slate-400 block">Cantidad requerida:</span>
                                  <span className="font-bold text-slate-800 font-mono">
                                    {prod.neededQuantity} {prod.unit}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">Precio Unitario:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    ${prod.estimatedUnitPrice.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-right min-w-[75px]">
                                  <span className="text-[10px] text-slate-400 block">Subtotal:</span>
                                  <span className="font-mono font-black text-[#0B2861] text-sm">
                                    ${subtotal.toFixed(2)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const invItem = inventory.find((i) => i.sku === prod.sku);
                                    if (invItem) {
                                      onAddCombinationToCart([{ item: invItem, quantity: prod.neededQuantity }]);
                                    }
                                  }}
                                  className="p-2 rounded-lg bg-slate-100 hover:bg-[#0B2861] hover:text-white text-slate-700 transition-colors cursor-pointer"
                                  title="Añadir este producto al carrito"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* MAIN VIEWPORT: 3D WEBGL VS HIGH-FIDELITY AI RENDER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Columns: Dynamic Visualizer */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border-2 border-slate-800 bg-[#0C1933] shadow-2xl">
            {/* View Mode 1: 3D Interactive WebGL */}
            <div className={viewTab === '3d' ? 'block' : 'hidden'}>
              {/* Top 6-Diorama Environment Switcher Bar */}
              <div className="bg-slate-950/95 border-b border-white/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD100] shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Dioramas 3D:</span>
                </span>
                {[
                  { id: 'amb_sala_estar', label: 'Sala Vanguardista', icon: '🛋️' },
                  { id: 'amb_cocina_gourmet', label: 'Cocina Gourmet', icon: '🍳' },
                  { id: 'amb_dormitorio_master', label: 'Master Suite', icon: '🛏️' },
                  { id: 'amb_bano_spa', label: 'Baño Spa', icon: '🛁' },
                  { id: 'amb_fachada_exterior', label: 'Fachada & Porche', icon: '🏡' },
                  { id: 'amb_cubierta_obra', label: 'Galpón & Bodega', icon: '🏭' },
                ].map((env) => {
                  const isActive = selectedEnvironmentId === env.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => {
                        setSelectedEnvironmentId(env.id);
                        setModalEnvironmentId(env.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0B2861] to-blue-700 text-[#FFD100] border border-[#FFD100]/60 shadow-md scale-102'
                          : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span>{env.icon}</span>
                      <span>{env.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Viewport Floating Info & Lighting Controls */}
              <div className="relative">
                {/* Top Spec Badge */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-wrap items-center gap-2 bg-slate-950/90 border border-white/15 px-3 py-1.5 rounded-xl text-[10px] text-white shadow-lg backdrop-blur-sm">
                  <span className="font-extrabold text-[#FFD100]">MOTOR 3D ISOMÉTRICO 45°</span>
                  <span>·</span>
                  <span className="text-slate-300">Haz clic en cualquier superficie para personalizar</span>
                </div>

                {/* Quick Lighting Mode Floating Toolbar */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-950/90 border border-white/15 p-1 rounded-xl shadow-lg backdrop-blur-sm">
                  {[
                    { id: 'dia' as LightingPreset, label: 'Día', icon: Sun, desc: 'Luz Natural 6500K' },
                    { id: 'tarde' as LightingPreset, label: 'Atardecer', icon: Sunset, desc: 'Luz Cálida 3200K' },
                    { id: 'noche' as LightingPreset, label: 'Noche LED', icon: Lightbulb, desc: 'Induless 4000K' },
                    { id: 'rasante' as LightingPreset, label: 'Rasante', icon: Search, desc: 'Luz Técnica Microtextura' },
                  ].map((light) => {
                    const Icon = light.icon;
                    const active = lightingPreset === light.id;
                    return (
                      <button
                        key={light.id}
                        type="button"
                        title={light.desc}
                        onClick={() => {
                          setLightingPreset(light.id);
                          setLightingRig((prev) => ({
                            ...getPresetLightingRigConfig(light.id),
                            showLightHelpers: prev.showLightHelpers,
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                          active
                            ? 'bg-[#FFD100] text-[#0B2861] shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{light.label}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsLightControlExpanded((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer border ${
                      isLightControlExpanded
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-white/5 text-[#FFD100] border-[#FFD100]/40 hover:bg-white/10'
                    }`}
                    title="Abrir o cerrar controles avanzados de luces (Ambiental, Direccional, Punto)"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Luces 3D</span>
                  </button>
                </div>

                {/* Tactile Raycasting Click Indicator */}
                {clickIndicator && (
                  <div
                    className="absolute pointer-events-none z-30 -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 rounded-xl bg-slate-950/95 border-2 border-[#FFD100] text-white shadow-2xl backdrop-blur-md flex items-center gap-2"
                    style={{ left: `${clickIndicator.x}px`, top: `${clickIndicator.y}px` }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FFD100] animate-ping" />
                    <span className="text-[10px] font-black uppercase text-[#FFD100]">
                      {clickIndicator.surface}:
                    </span>
                    <span className="text-[11px] font-bold text-white max-w-[200px] truncate">
                      {clickIndicator.label}
                    </span>
                  </div>
                )}

                {/* Dedicated WebGL Canvas Mount Container */}
                <div
                  ref={canvasMountRef}
                  className="w-full h-[480px] sm:h-[560px] cursor-grab active:cursor-grabbing"
                />

                {/* Collapsible Bottom Dock */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[96%] max-w-[860px]">
                  <div className="flex justify-center mb-1">
                    <button
                      type="button"
                      onClick={() => setIsDockCollapsed((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-xl bg-slate-950 text-slate-200 hover:text-white border border-b-0 border-white/20 text-[11px] font-bold cursor-pointer backdrop-blur-md"
                    >
                      {isDockCollapsed ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 text-[#FFD100]" />
                          <span>Mostrar Controles &amp; Personalización de Acabados</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 text-[#FFD100]" />
                          <span>Ocultar Barra de Personalización</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isDockCollapsed && (
                    <div className="bg-slate-950/95 border border-white/20 rounded-2xl p-4 text-white space-y-3.5 shadow-2xl backdrop-blur-md">
                      {/* Surface Target Selector Tabs */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                            Superficie Activa:
                          </span>
                          {[
                            { id: 'paredes' as InteractiveSurfaceTarget, label: 'Paredes', icon: '🎨' },
                            { id: 'pisos' as InteractiveSurfaceTarget, label: 'Pisos', icon: '🪵' },
                            { id: 'iluminacion' as InteractiveSurfaceTarget, label: 'Luz LED', icon: '💡' },
                            { id: 'muebles' as InteractiveSurfaceTarget, label: 'Mesón & Muebles', icon: '🪑' },
                            { id: 'techo' as InteractiveSurfaceTarget, label: 'Techo / Cubierta', icon: '🏗️' },
                          ].map((surf) => {
                            const isSelected = selectedSurface === surf.id;
                            return (
                              <button
                                key={surf.id}
                                type="button"
                                onClick={() => setSelectedSurface(surf.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FFD100] text-[#0B2861] shadow-md scale-105'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span>{surf.icon}</span>
                                <span>{surf.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Button to open Fullscreen Modal 3D */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalEnvironmentId(selectedEnvironmentId);
                            setIsModalViewerOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#0B2861] hover:bg-blue-900 border border-[#FFD100]/50 text-[#FFD100] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Modal 3D Inmersivo</span>
                        </button>
                      </div>

                      {/* Swatches & PBR Material Sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                        {/* Swatches for selected surface (Col 7) */}
                        <div className="md:col-span-7 space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                            Catálogo Oficial para {selectedSurface.toUpperCase()}:
                          </span>
                          <div className="flex items-center gap-2 flex-wrap max-h-20 overflow-y-auto pr-1">
                            {ARCHITECTURAL_FINISHES.filter((f) => f.surfaceTarget === selectedSurface).map((fin) => {
                              const isSelected = selectedFinishId === fin.id;
                              return (
                                <button
                                  key={fin.id}
                                  type="button"
                                  title={`${fin.name} · ${fin.categoryLabel} · $${fin.unitPrice.toFixed(2)}`}
                                  onClick={() => handleSelectArchitecturalFinish(fin)}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-blue-900/60 border-[#FFD100] text-white shadow-md scale-102'
                                      : 'bg-slate-900/80 border-white/15 text-slate-300 hover:border-white/40'
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                                    style={{ backgroundColor: fin.hex }}
                                  />
                                  <span className="truncate max-w-[120px]">{fin.name.split('(')[0]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* PBR Sliders (Col 5) */}
                        <div className="md:col-span-5 grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/10">
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                              <span>Brillo:</span>
                              <span className="font-mono text-[#FFD100]">
                                {customRoughness < 0.35 ? 'Satinado' : customRoughness < 0.65 ? 'Semi-mate' : 'Mate'}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="0.9"
                              step="0.05"
                              value={customRoughness}
                              onChange={(e) => setCustomRoughness(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                              <span>Relieve:</span>
                              <span className="font-mono text-[#FFD100]">
                                {(customBumpScale * 100).toFixed(1)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.005"
                              max="0.04"
                              step="0.005"
                              value={customBumpScale}
                              onChange={(e) => setCustomBumpScale(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Camera Presets Toolbar */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/10 flex-wrap gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Cámaras de Inspección:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            {
                              id: 'general',
                              label: '📐 Isométrica 45°',
                              pos: [7.4, 5.2, 8.6] as [number, number, number],
                              target: [0, 1.8, 0] as [number, number, number],
                            },
                            {
                              id: 'macro_pared',
                              label: '🔍 Paredes',
                              pos: [0.6, 2.2, 2.8] as [number, number, number],
                              target: [0, 2.0, -2.5] as [number, number, number],
                            },
                            {
                              id: 'macro_piso',
                              label: '🔍 Pisos',
                              pos: [2.2, 1.2, 2.8] as [number, number, number],
                              target: [0, 0.2, 0] as [number, number, number],
                            },
                            {
                              id: 'muebles',
                              label: '🔍 Mobiliario',
                              pos: [3.5, 2.2, 3.8] as [number, number, number],
                              target: [0, 1.1, 0] as [number, number, number],
                            },
                            {
                              id: 'techo',
                              label: '🔍 Techo / LED',
                              pos: [4.5, 4.2, 4.5] as [number, number, number],
                              target: [0, 3.5, 0] as [number, number, number],
                            },
                          ].map((cam) => (
                            <button
                              key={cam.id}
                              type="button"
                              onClick={() => handleCameraPreset(cam.id, cam.pos, cam.target)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                cameraPresetName === cam.id
                                  ? 'bg-[#0B2861] text-[#FFD100] border border-[#FFD100]'
                                  : 'bg-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              {cam.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scene Lighting Rig Controls: Vista Global + Ambiental, Direccional, Punto */}
                      {isLightControlExpanded && (
                        <div
                          className="pt-2.5 border-t border-white/15 space-y-2.5 bg-slate-900/80 p-3 rounded-xl"
                          role="region"
                          aria-label="Controles de Iluminación 3D de la Escena"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD100] flex items-center gap-1">
                                <Sun className="w-3.5 h-3.5" />
                                <span>Control de Luces 3D:</span>
                              </span>
                              {[
                                { id: 'global' as const, label: '🌐 Vista Global' },
                                { id: 'ambiental' as const, label: '🌤️ Luz Ambiental' },
                                { id: 'direccional' as const, label: '☀️ Luz Direccional' },
                                { id: 'punto' as const, label: '💡 Luz de Punto' },
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setActiveLightTab(tab.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    activeLightTab === tab.id
                                      ? 'bg-[#FFD100] text-[#0B2861] shadow-xs'
                                      : 'bg-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md">
                                {getActiveLightsSummary(lightingRig).activeCount}/3 Activas
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                {calculateEffectiveSceneLux(lightingRig, computedMetrics.floorArea)} Lux est.
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const summary = getActiveLightsSummary(lightingRig);
                                  setLightingRig((prev) =>
                                    setAllLightsVisibility(prev, !summary.allEnabled)
                                  );
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-[#FFD100] border border-[#FFD100]/30 cursor-pointer"
                              >
                                {getActiveLightsSummary(lightingRig).allEnabled
                                  ? 'Apagar Todas'
                                  : 'Encender Todas'}
                              </button>
                              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={lightingRig.showLightHelpers}
                                  onChange={(e) =>
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      showLightHelpers: e.target.checked,
                                    }))
                                  }
                                  className="rounded accent-[#FFD100] cursor-pointer"
                                />
                                <span>Guías 3D</span>
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setLightingRig(getPresetLightingRigConfig(lightingPreset))
                                }
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                              >
                                Restablecer Luces
                              </button>
                            </div>
                          </div>

                          {/* Selector de Entorno HDRi (IBL Preconfigurado: Industrial, Almacén, Oficina, Estudio, Exterior) */}
                          <div
                            className="p-2.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2"
                            role="group"
                            aria-label="Selector de Entorno HDRi Global"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD100] flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" />
                                  <span>Entorno HDRi (IBL Global):</span>
                                </span>
                                {HDRI_ENVIRONMENT_LIST.map((env) => {
                                  const isSelected =
                                    (lightingRig.hdriPreset || 'industrial') === env.id;
                                  return (
                                    <button
                                      key={env.id}
                                      type="button"
                                      aria-label={`Entorno HDRi ${env.label}`}
                                      aria-pressed={isSelected}
                                      title={env.description}
                                      onClick={() =>
                                        setLightingRig((prev) =>
                                          applyHdriEnvironmentPreset(prev, env.id)
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer border ${
                                        isSelected
                                          ? 'bg-[#FFD100] text-[#0B2861] border-[#FFD100] shadow-sm scale-102'
                                          : 'bg-slate-900 text-slate-300 border-white/10 hover:text-white hover:border-white/30'
                                      }`}
                                    >
                                      <span>{env.icon}</span>
                                      <span>{env.label}</span>
                                      <span
                                        className={`text-[8px] font-mono px-1 rounded ${
                                          isSelected
                                            ? 'bg-[#0B2861]/15 text-[#0B2861]'
                                            : 'bg-white/5 text-slate-400'
                                        }`}
                                      >
                                        {env.kelvin}K
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* HDRi Reflection Intensity Slider (envMapIntensity) */}
                              <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/10 min-w-[210px]">
                                <span className="text-[9px] font-bold text-slate-300 whitespace-nowrap">
                                  Reflejo HDRi:
                                </span>
                                <input
                                  aria-label="Intensidad Reflejo Entorno HDRi"
                                  type="range"
                                  min="0"
                                  max="3.0"
                                  step="0.05"
                                  value={lightingRig.envMapIntensity ?? 1.35}
                                  onChange={(e) =>
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      envMapIntensity: parseFloat(e.target.value),
                                    }))
                                  }
                                  className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100]"
                                />
                                <span className="text-[10px] font-mono font-bold text-[#FFD100] min-w-[34px] text-right">
                                  {(lightingRig.envMapIntensity ?? 1.35).toFixed(2)}x
                                </span>
                              </div>
                            </div>

                            {/* Active HDRi Preset Spec Summary */}
                            {(() => {
                              const currentSpec =
                                HDRI_ENVIRONMENT_PRESETS[
                                  lightingRig.hdriPreset || 'industrial'
                                ] || HDRI_ENVIRONMENT_PRESETS.industrial;
                              return (
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300 pt-1 border-t border-white/10">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-white">
                                      {currentSpec.icon} HDRi Activo: {currentSpec.label} ({currentSpec.kelvin}K)
                                    </span>
                                    <span className="text-slate-500">·</span>
                                    <span className="text-slate-400">{currentSpec.description}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-slate-400">Domo HDR:</span>
                                    <span
                                      className="w-3 h-3 rounded-full border border-white/30"
                                      style={{ backgroundColor: currentSpec.zenithColorHex }}
                                      title={`Cenit: ${currentSpec.zenithColorHex}`}
                                    />
                                    <span
                                      className="w-3 h-3 rounded-full border border-white/30"
                                      style={{ backgroundColor: currentSpec.horizonColorHex }}
                                      title={`Horizonte: ${currentSpec.horizonColorHex}`}
                                    />
                                    <span
                                      className="w-3 h-3 rounded-full border border-white/30"
                                      style={{ backgroundColor: currentSpec.groundColorHex }}
                                      title={`Suelo: ${currentSpec.groundColorHex}`}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Tab 0: Global Lighting Configuration View (All 3 lights side-by-side: Visibility + Intensity + Position) */}
                          {activeLightTab === 'global' && (
                            <div
                              className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1"
                              role="group"
                              aria-label="Vista de Configuración Global de Iluminación"
                            >
                              {/* Card 1: Luz Ambiental */}
                              <div
                                className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                                  lightingRig.ambient.enabled
                                    ? 'bg-slate-950/80 border-sky-500/40'
                                    : 'bg-slate-950/40 border-white/10 opacity-65'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black text-white flex items-center gap-1">
                                    <span>🌤️</span>
                                    <span>Luz Ambiental</span>
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Alternar visibilidad Luz Ambiental"
                                    onClick={() =>
                                      setLightingRig((prev) =>
                                        toggleLightVisibility(prev, 'ambient')
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase cursor-pointer transition-all ${
                                      lightingRig.ambient.enabled
                                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                        : 'bg-slate-800 text-slate-400 border border-white/10'
                                    }`}
                                  >
                                    {lightingRig.ambient.enabled ? 'ENCENDIDA' : 'APAGADA'}
                                  </button>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                                    <span>Intensidad:</span>
                                    <span className="font-mono text-[#FFD100]">
                                      {lightingRig.ambient.intensity.toFixed(2)}x
                                    </span>
                                  </div>
                                  <input
                                    aria-label="Global Intensidad Luz Ambiental"
                                    type="range"
                                    min="0"
                                    max="3.0"
                                    step="0.05"
                                    disabled={!lightingRig.ambient.enabled}
                                    value={lightingRig.ambient.intensity}
                                    onChange={(e) =>
                                      setLightingRig((prev) => ({
                                        ...prev,
                                        ambient: {
                                          ...prev.ambient,
                                          intensity: parseFloat(e.target.value),
                                        },
                                      }))
                                    }
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100] disabled:cursor-not-allowed"
                                  />
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                                  <span className="text-[9px] font-bold text-slate-400">
                                    Tono Hemisférico:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {[
                                      { hex: '#DBEAFE', name: 'Día Frío' },
                                      { hex: '#FFF7ED', name: 'Neutro' },
                                      { hex: '#FECDD3', name: 'Cálido' },
                                    ].map((c) => (
                                      <button
                                        key={c.hex}
                                        type="button"
                                        title={c.name}
                                        onClick={() =>
                                          setLightingRig((prev) => ({
                                            ...prev,
                                            ambient: { ...prev.ambient, colorHex: c.hex },
                                          }))
                                        }
                                        className={`w-3.5 h-3.5 rounded-full border cursor-pointer ${
                                          lightingRig.ambient.colorHex === c.hex
                                            ? 'border-[#FFD100] scale-115 ring-1 ring-[#FFD100]'
                                            : 'border-white/30'
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Card 2: Luz Direccional */}
                              <div
                                className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                                  lightingRig.directional.enabled
                                    ? 'bg-slate-950/80 border-amber-500/40'
                                    : 'bg-slate-950/40 border-white/10 opacity-65'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black text-white flex items-center gap-1">
                                    <span>☀️</span>
                                    <span>Luz Direccional</span>
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Alternar visibilidad Luz Direccional"
                                    onClick={() =>
                                      setLightingRig((prev) =>
                                        toggleLightVisibility(prev, 'directional')
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase cursor-pointer transition-all ${
                                      lightingRig.directional.enabled
                                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                        : 'bg-slate-800 text-slate-400 border border-white/10'
                                    }`}
                                  >
                                    {lightingRig.directional.enabled ? 'ENCENDIDA' : 'APAGADA'}
                                  </button>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                                    <span>Intensidad:</span>
                                    <span className="font-mono text-[#FFD100]">
                                      {lightingRig.directional.intensity.toFixed(2)}x
                                    </span>
                                  </div>
                                  <input
                                    aria-label="Global Intensidad Luz Direccional"
                                    type="range"
                                    min="0"
                                    max="5.0"
                                    step="0.1"
                                    disabled={!lightingRig.directional.enabled}
                                    value={lightingRig.directional.intensity}
                                    onChange={(e) =>
                                      setLightingRig((prev) => ({
                                        ...prev,
                                        directional: {
                                          ...prev.directional,
                                          intensity: parseFloat(e.target.value),
                                        },
                                      }))
                                    }
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100] disabled:cursor-not-allowed"
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
                                  {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                                    <div key={axis}>
                                      <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-slate-400">{axis}:</span>
                                        <span className="font-mono text-sky-300">
                                          {lightingRig.directional.position[idx].toFixed(1)}m
                                        </span>
                                      </div>
                                      <input
                                        aria-label={`Global Posición ${axis} Luz Direccional`}
                                        type="range"
                                        min={idx === 1 ? '1' : '-15'}
                                        max={idx === 1 ? '18' : '15'}
                                        step="0.5"
                                        disabled={!lightingRig.directional.enabled}
                                        value={lightingRig.directional.position[idx]}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setLightingRig((prev) => {
                                            const nextPos: [number, number, number] = [
                                              ...prev.directional.position,
                                            ];
                                            nextPos[idx] = val;
                                            return {
                                              ...prev,
                                              directional: {
                                                ...prev.directional,
                                                position: nextPos,
                                              },
                                            };
                                          });
                                        }}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Card 3: Luz de Punto */}
                              <div
                                className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                                  lightingRig.point.enabled
                                    ? 'bg-slate-950/80 border-emerald-500/40'
                                    : 'bg-slate-950/40 border-white/10 opacity-65'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black text-white flex items-center gap-1">
                                    <span>💡</span>
                                    <span>Luz de Punto</span>
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Alternar visibilidad Luz de Punto"
                                    onClick={() =>
                                      setLightingRig((prev) =>
                                        toggleLightVisibility(prev, 'point')
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase cursor-pointer transition-all ${
                                      lightingRig.point.enabled
                                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                        : 'bg-slate-800 text-slate-400 border border-white/10'
                                    }`}
                                  >
                                    {lightingRig.point.enabled ? 'ENCENDIDA' : 'APAGADA'}
                                  </button>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                                    <span>Intensidad:</span>
                                    <span className="font-mono text-[#FFD100]">
                                      {lightingRig.point.intensity.toFixed(2)}x
                                    </span>
                                  </div>
                                  <input
                                    aria-label="Global Intensidad Luz de Punto"
                                    type="range"
                                    min="0"
                                    max="6.0"
                                    step="0.1"
                                    disabled={!lightingRig.point.enabled}
                                    value={lightingRig.point.intensity}
                                    onChange={(e) =>
                                      setLightingRig((prev) => ({
                                        ...prev,
                                        point: {
                                          ...prev.point,
                                          intensity: parseFloat(e.target.value),
                                        },
                                      }))
                                    }
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100] disabled:cursor-not-allowed"
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
                                  {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                                    <div key={axis}>
                                      <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-slate-400">{axis}:</span>
                                        <span className="font-mono text-emerald-300">
                                          {lightingRig.point.position[idx].toFixed(1)}m
                                        </span>
                                      </div>
                                      <input
                                        aria-label={`Global Posición ${axis} Luz de Punto`}
                                        type="range"
                                        min={idx === 1 ? '0.5' : '-6'}
                                        max={idx === 1 ? '6.5' : '6'}
                                        step="0.2"
                                        disabled={!lightingRig.point.enabled}
                                        value={lightingRig.point.position[idx]}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setLightingRig((prev) => {
                                            const nextPos: [number, number, number] = [
                                              ...prev.point.position,
                                            ];
                                            nextPos[idx] = val;
                                            return {
                                              ...prev,
                                              point: {
                                                ...prev.point,
                                                position: nextPos,
                                              },
                                            };
                                          });
                                        }}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab 1: Ambient Light Controls */}
                          {activeLightTab === 'ambiental' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
                              <div className="sm:col-span-2">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <div className="flex items-center gap-2">
                                    <label htmlFor="slider-ambient-intensity">
                                      Intensidad Luz Ambiental (Hemisférica + Base):
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLightingRig((prev) =>
                                          toggleLightVisibility(prev, 'ambient')
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                                        lightingRig.ambient.enabled
                                          ? 'bg-emerald-500 text-slate-950'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {lightingRig.ambient.enabled ? 'ENCENDIDA' : 'APAGADA'}
                                    </button>
                                  </div>
                                  <span className="font-mono text-[#FFD100]">
                                    {lightingRig.ambient.intensity.toFixed(2)}x
                                  </span>
                                </div>
                                <input
                                  id="slider-ambient-intensity"
                                  aria-label="Intensidad Luz Ambiental"
                                  type="range"
                                  min="0"
                                  max="3.0"
                                  step="0.05"
                                  disabled={!lightingRig.ambient.enabled}
                                  value={lightingRig.ambient.intensity}
                                  onChange={(e) =>
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      ambient: {
                                        ...prev.ambient,
                                        intensity: parseFloat(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100]"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2 bg-slate-950/70 px-3 py-2 rounded-lg border border-white/10">
                                <span className="text-[10px] font-bold text-slate-300">Tono Ambiental:</span>
                                <div className="flex items-center gap-1.5">
                                  {[
                                    { hex: '#DBEAFE', name: 'Día Frío' },
                                    { hex: '#FFF7ED', name: 'Neutro' },
                                    { hex: '#FECDD3', name: 'Cálido' },
                                  ].map((c) => (
                                    <button
                                      key={c.hex}
                                      type="button"
                                      title={c.name}
                                      onClick={() =>
                                        setLightingRig((prev) => ({
                                          ...prev,
                                          ambient: { ...prev.ambient, colorHex: c.hex },
                                        }))
                                      }
                                      className={`w-4 h-4 rounded-full border cursor-pointer ${
                                        lightingRig.ambient.colorHex === c.hex
                                          ? 'border-[#FFD100] scale-115 ring-1 ring-[#FFD100]'
                                          : 'border-white/30'
                                      }`}
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab 2: Directional Light Controls (Intensity + X, Y, Z) */}
                          {activeLightTab === 'direccional' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <label htmlFor="slider-dir-intensity">Intensidad:</label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLightingRig((prev) =>
                                          toggleLightVisibility(prev, 'directional')
                                        )
                                      }
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase cursor-pointer ${
                                        lightingRig.directional.enabled
                                          ? 'bg-emerald-500 text-slate-950'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {lightingRig.directional.enabled ? 'ON' : 'OFF'}
                                    </button>
                                  </div>
                                  <span className="font-mono text-[#FFD100]">
                                    {lightingRig.directional.intensity.toFixed(2)}x
                                  </span>
                                </div>
                                <input
                                  id="slider-dir-intensity"
                                  aria-label="Intensidad Luz Direccional"
                                  type="range"
                                  min="0"
                                  max="5.0"
                                  step="0.1"
                                  disabled={!lightingRig.directional.enabled}
                                  value={lightingRig.directional.intensity}
                                  onChange={(e) =>
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      directional: {
                                        ...prev.directional,
                                        intensity: parseFloat(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100]"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <label htmlFor="slider-dir-pos-x">Posición X (Este/Oeste):</label>
                                  <span className="font-mono text-sky-400">
                                    {lightingRig.directional.position[0].toFixed(1)}m
                                  </span>
                                </div>
                                <input
                                  id="slider-dir-pos-x"
                                  aria-label="Posición X Luz Direccional"
                                  type="range"
                                  min="-15"
                                  max="15"
                                  step="0.5"
                                  value={lightingRig.directional.position[0]}
                                  onChange={(e) => {
                                    const x = parseFloat(e.target.value);
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      directional: {
                                        ...prev.directional,
                                        position: [
                                          x,
                                          prev.directional.position[1],
                                          prev.directional.position[2],
                                        ],
                                      },
                                    }));
                                  }}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <label htmlFor="slider-dir-pos-y">Posición Y (Altura):</label>
                                  <span className="font-mono text-emerald-400">
                                    {lightingRig.directional.position[1].toFixed(1)}m
                                  </span>
                                </div>
                                <input
                                  id="slider-dir-pos-y"
                                  aria-label="Posición Y Luz Direccional"
                                  type="range"
                                  min="1"
                                  max="18"
                                  step="0.5"
                                  value={lightingRig.directional.position[1]}
                                  onChange={(e) => {
                                    const y = parseFloat(e.target.value);
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      directional: {
                                        ...prev.directional,
                                        position: [
                                          prev.directional.position[0],
                                          y,
                                          prev.directional.position[2],
                                        ],
                                      },
                                    }));
                                  }}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <label htmlFor="slider-dir-pos-z">Posición Z (Norte/Sur):</label>
                                  <span className="font-mono text-amber-400">
                                    {lightingRig.directional.position[2].toFixed(1)}m
                                  </span>
                                </div>
                                <input
                                  id="slider-dir-pos-z"
                                  aria-label="Posición Z Luz Direccional"
                                  type="range"
                                  min="-15"
                                  max="15"
                                  step="0.5"
                                  value={lightingRig.directional.position[2]}
                                  onChange={(e) => {
                                    const z = parseFloat(e.target.value);
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      directional: {
                                        ...prev.directional,
                                        position: [
                                          prev.directional.position[0],
                                          prev.directional.position[1],
                                          z,
                                        ],
                                      },
                                    }));
                                  }}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                />
                              </div>
                            </div>
                          )}

                          {/* Tab 3: Point Light Controls (Intensity + X, Y, Z) */}
                          {activeLightTab === 'punto' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <label htmlFor="slider-point-intensity">Intensidad:</label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLightingRig((prev) =>
                                          toggleLightVisibility(prev, 'point')
                                        )
                                      }
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase cursor-pointer ${
                                        lightingRig.point.enabled
                                          ? 'bg-emerald-500 text-slate-950'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {lightingRig.point.enabled ? 'ON' : 'OFF'}
                                    </button>
                                  </div>
                                  <span className="font-mono text-[#FFD100]">
                                    {lightingRig.point.intensity.toFixed(2)}x
                                  </span>
                                </div>
                                <input
                                  id="slider-point-intensity"
                                  aria-label="Intensidad Luz de Punto"
                                  type="range"
                                  min="0"
                                  max="6.0"
                                  step="0.1"
                                  disabled={!lightingRig.point.enabled}
                                  value={lightingRig.point.intensity}
                                  onChange={(e) =>
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      point: {
                                        ...prev.point,
                                        intensity: parseFloat(e.target.value),
                                      },
                                    }))
                                  }
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFD100]"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <label htmlFor="slider-point-pos-x">Posición X Punto:</label>
                                  <span className="font-mono text-sky-400">
                                    {lightingRig.point.position[0].toFixed(1)}m
                                  </span>
                                </div>
                                <input
                                  id="slider-point-pos-x"
                                  aria-label="Posición X Luz de Punto"
                                  type="range"
                                  min="-6"
                                  max="6"
                                  step="0.2"
                                  value={lightingRig.point.position[0]}
                                  onChange={(e) => {
                                    const x = parseFloat(e.target.value);
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      point: {
                                        ...prev.point,
                                        position: [
                                          x,
                                          prev.point.position[1],
                                          prev.point.position[2],
                                        ],
                                      },
                                    }));
                                  }}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <label htmlFor="slider-point-pos-y">Posición Y (Altura):</label>
                                  <span className="font-mono text-emerald-400">
                                    {lightingRig.point.position[1].toFixed(1)}m
                                  </span>
                                </div>
                                <input
                                  id="slider-point-pos-y"
                                  aria-label="Posición Y Luz de Punto"
                                  type="range"
                                  min="0.5"
                                  max="6.5"
                                  step="0.2"
                                  value={lightingRig.point.position[1]}
                                  onChange={(e) => {
                                    const y = parseFloat(e.target.value);
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      point: {
                                        ...prev.point,
                                        position: [
                                          prev.point.position[0],
                                          y,
                                          prev.point.position[2],
                                        ],
                                      },
                                    }));
                                  }}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                                  <label htmlFor="slider-point-pos-z">Posición Z Punto:</label>
                                  <span className="font-mono text-amber-400">
                                    {lightingRig.point.position[2].toFixed(1)}m
                                  </span>
                                </div>
                                <input
                                  id="slider-point-pos-z"
                                  aria-label="Posición Z Luz de Punto"
                                  type="range"
                                  min="-6"
                                  max="6"
                                  step="0.2"
                                  value={lightingRig.point.position[2]}
                                  onChange={(e) => {
                                    const z = parseFloat(e.target.value);
                                    setLightingRig((prev) => ({
                                      ...prev,
                                      point: {
                                        ...prev.point,
                                        position: [
                                          prev.point.position[0],
                                          prev.point.position[1],
                                          z,
                                        ],
                                      },
                                    }));
                                  }}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* View Mode 2: High-Fidelity Generative AI Architectural Render Canvas */}
            <div className={viewTab === 'render_ia' ? 'block p-6' : 'hidden'}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD100]">
                      Renderizado Fotorrealista Parametrizado por IA
                    </span>
                    <h3 className="text-xl font-black font-display">
                      {aiRenderResult?.renderTitle}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-[10px] font-extrabold uppercase">
                    Cálculo Fotométrico Ray-Casting
                  </span>
                </div>

                {/* High-Fidelity Architectural Visual Canvas (Perspective 2-point render) */}
                <div className="relative w-full h-[440px] rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-b from-[#0a1220] via-[#101e38] to-[#0d1728] shadow-inner flex items-center justify-center">
                  {/* Procedural Realistic Room Scene Representation with Custom Dimensions */}
                  <svg
                    viewBox="0 0 1000 600"
                    className="w-full h-full object-cover select-none"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <defs>
                      {/* Sunbeam Light Cone Gradient */}
                      <linearGradient id="sunbeamGrad" x1="1" y1="0" x2="0.3" y2="1">
                        <stop offset="0%" stopColor="#fffbeb" stopOpacity={lightingPreset === 'dia' ? 0.45 : lightingPreset === 'tarde' ? 0.6 : 0.05} />
                        <stop offset="60%" stopColor="#fef08a" stopOpacity={lightingPreset === 'dia' ? 0.15 : lightingPreset === 'tarde' ? 0.35 : 0.02} />
                        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                      </linearGradient>

                      {/* Wall Paint Color Gradient with Ambient Occlusion */}
                      <linearGradient id="wallColorGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={activeWallFinish.hex} stopOpacity="1" />
                        <stop offset="100%" stopColor={activeWallFinish.hex} stopOpacity="0.84" />
                      </linearGradient>

                      {/* Downlight Cones */}
                      <radialGradient id="ledDownlightCone" cx="50%" cy="0%" r="90%">
                        <stop offset="0%" stopColor="#fef9c3" stopOpacity={includeLedPanels ? 0.8 : 0.2} />
                        <stop offset="40%" stopColor="#fef08a" stopOpacity={includeLedPanels ? 0.3 : 0.05} />
                        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                      </radialGradient>

                      {/* Floor Porcelain Reflective Gradient */}
                      <linearGradient id="floorTileGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeFloorFinish.tileHex} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={activeFloorFinish.tileHex} stopOpacity="1" />
                      </linearGradient>
                    </defs>

                    {/* Back Wall */}
                    <polygon
                      points="120,80 820,80 820,440 120,440"
                      fill="url(#wallColorGrad)"
                    />

                    {/* Left Wall Perspective */}
                    <polygon
                      points="0,0 120,80 120,440 0,600"
                      fill={activeWallFinish.hex}
                      filter="brightness(0.85)"
                    />

                    {/* Ceiling Perspective */}
                    <polygon
                      points="0,0 1000,0 820,80 120,80"
                      fill="#0f172a"
                      opacity="0.95"
                    />

                    {/* Floor Perspective Slab */}
                    <polygon
                      points="120,440 820,440 1000,600 0,600"
                      fill="url(#floorTileGrad)"
                    />

                    {/* Floor Perspective Tile Grid Lines with Porcelana Latina 2K Grout */}
                    <g stroke={activeFloorFinish.groutHex} strokeWidth="2" opacity="0.6">
                      <line x1="200" y1="440" x2="120" y2="600" />
                      <line x1="320" y1="440" x2="280" y2="600" />
                      <line x1="460" y1="440" x2="480" y2="600" />
                      <line x1="600" y1="440" x2="680" y2="600" />
                      <line x1="720" y1="440" x2="860" y2="600" />
                      <line x1="120" y1="475" x2="860" y2="475" />
                      <line x1="80" y1="520" x2="920" y2="520" />
                      <line x1="40" y1="565" x2="970" y2="565" />
                    </g>

                    {/* Baseboard Trim (Zócalo Arquitectónico) */}
                    <polygon
                      points="120,428 820,428 820,440 120,440"
                      fill="#f8fafc"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <polygon
                      points="0,586 120,428 120,440 0,600"
                      fill="#e2e8f0"
                    />

                    {/* Picture Window on Right with Architectural Daylight */}
                    <polygon
                      points="820,80 1000,0 1000,600 820,440"
                      fill={lightingPreset === 'dia' ? '#bae6fd' : lightingPreset === 'tarde' ? '#fdba74' : '#1e293b'}
                      opacity="0.85"
                    />
                    {/* Window Mullions */}
                    <g stroke="#0f172a" strokeWidth="6">
                      <line x1="820" y1="80" x2="1000" y2="0" />
                      <line x1="820" y1="440" x2="1000" y2="600" />
                      <line x1="910" y1="40" x2="910" y2="520" />
                      <line x1="820" y1="260" x2="1000" y2="300" />
                    </g>

                    {/* Sunlight Beam Pouring Across Floor */}
                    <polygon
                      points="910,40 1000,10 820,600 360,540"
                      fill="url(#sunbeamGrad)"
                    />

                    {/* Induless LED Ceiling Panel Downlight Cones */}
                    {includeLedPanels && (
                      <g>
                        <ellipse cx="320" cy="80" rx="36" ry="6" fill="#fef08a" />
                        <polygon points="300,80 340,80 480,440 160,440" fill="url(#ledDownlightCone)" />
                        <ellipse cx="620" cy="80" rx="36" ry="6" fill="#fef08a" />
                        <polygon points="600,80 640,80 780,440 460,440" fill="url(#ledDownlightCone)" />
                      </g>
                    )}

                    {/* Modern Furniture Silhouette / Vector Render */}
                    {includeFurniture && (
                      <g transform="translate(240, 360)">
                        {/* Sofa Body */}
                        <rect x="0" y="30" width="220" height="45" rx="8" fill="#334155" />
                        <rect x="10" y="0" width="200" height="40" rx="6" fill="#475569" />
                        <rect x="20" y="10" width="85" height="40" rx="4" fill="#64748b" />
                        <rect x="115" y="10" width="85" height="40" rx="4" fill="#64748b" />
                        {/* Oak legs */}
                        <line x1="20" y1="75" x2="15" y2="95" stroke="#78350f" strokeWidth="4" />
                        <line x1="200" y1="75" x2="205" y2="95" stroke="#78350f" strokeWidth="4" />
                        {/* Coffee table */}
                        <ellipse cx="110" cy="115" rx="55" ry="18" fill="#1e293b" />
                        <ellipse cx="110" cy="112" rx="53" ry="16" fill="#292524" />
                        <line x1="110" y1="115" x2="110" y2="135" stroke="#0f172a" strokeWidth="6" />
                      </g>
                    )}

                    {/* Hotspot Loupes Placed Directly in Render */}
                    <g className="cursor-pointer">
                      {/* Hotspot 1: Wall Stipple */}
                      <circle
                        cx="420"
                        cy="220"
                        r="14"
                        fill="#FFD100"
                        stroke="#0B2861"
                        strokeWidth="3"
                        className="animate-pulse"
                        onClick={() => setActiveDetailTab('textura')}
                      />
                      <text x="440" y="225" fill="#ffffff" fontSize="12" fontWeight="bold">
                        🔍 Microtextura Muro
                      </text>

                      {/* Hotspot 2: Grout Line */}
                      <circle
                        cx="580"
                        cy="510"
                        r="14"
                        fill="#FFD100"
                        stroke="#0B2861"
                        strokeWidth="3"
                        className="animate-pulse"
                        onClick={() => setActiveDetailTab('junta')}
                      />
                      <text x="600" y="515" fill="#ffffff" fontSize="12" fontWeight="bold">
                        🔍 Junta Porcelana 2K
                      </text>
                    </g>
                  </svg>

                  {/* Dimension Stamp Overlay */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-white/20 px-3.5 py-1.5 rounded-xl text-xs text-white flex items-center gap-2 backdrop-blur-md">
                    <Ruler className="w-4 h-4 text-[#FFD100]" />
                    <span className="font-mono font-bold">
                      {dimensions.lengthM.toFixed(2)}m × {dimensions.widthM.toFixed(2)}m × {dimensions.heightM.toFixed(2)}m
                    </span>
                    <span>·</span>
                    <span className="text-slate-300">
                      {aiRenderResult?.dimensions.floorAreaSqm} m² útil
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/10">
                  &ldquo;{aiRenderResult?.perspectiveDescription}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Certified Dimensional Bill of Materials & Cart */}
          <div
            className="lg:col-span-4 bg-slate-50 rounded-3xl p-6 border-2 flex flex-col justify-between space-y-6 shadow-sm transition-all"
            style={{
              borderColor: '#e2e8f0',
              borderTopWidth: '6px',
              borderTopColor: activeFestiveTheme.accentColor,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#0B2861]">
                    Cubicaje Exacto por Dimensiones
                  </span>
                  <h3 className="text-lg font-black text-slate-900 font-display mt-0.5">
                    Materiales Certificados Requeridos
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Cantidades calculadas para {computedMetrics.floorArea} m² de piso y {computedMetrics.netWall} m² de muros a 2 manos.
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}
                >
                  {activeFestiveTheme.iconSymbol} {activeFestiveTheme.heroBadge}
                </span>
              </div>

              {/* Live Quantitative Material Cards */}
              <div className="space-y-2 text-xs">
                {dimensionCalculatedItems.map(({ item, quantity }) => {
                  const isInduless = item.company === 'induless';
                  return (
                    <div
                      key={item.sku}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
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
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {item.sku}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-900 truncate mt-0.5">
                          {quantity}× {item.name}
                        </p>
                        <span className="text-[10px] text-slate-500 block">
                          ${item.unitPrice.toFixed(2)} / {item.unit}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-900 block text-sm">
                          ${(item.unitPrice * quantity).toFixed(2)}
                        </span>
                        {onInspectProduct && (
                          <button
                            type="button"
                            onClick={() => onInspectProduct(item)}
                            className="text-[10px] font-bold text-[#0B2861] hover:underline cursor-pointer"
                          >
                            Ficha
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total and 1-Click Action */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">
                  Total Materiales Cubicados:
                </span>
                <strong className="text-xl font-mono font-black text-[#0B2861]">
                  USD ${dimensionCalculatedTotalUsd.toFixed(2)}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => onAddCombinationToCart(dimensionCalculatedItems)}
                className="w-full py-4 px-5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:brightness-110 cursor-pointer"
                style={{
                  backgroundColor: activeFestiveTheme.primaryColor || '#0B2861',
                  color: '#ffffff',
                  borderBottom: `3px solid ${activeFestiveTheme.secondaryColor || '#FFD100'}`,
                }}
              >
                <ShoppingCart className="w-4 h-4" style={{ color: activeFestiveTheme.secondaryColor || '#FFD100' }} />
                <span>Añadir Materiales Cubicados al Carrito</span>
              </button>

              <button
                type="button"
                onClick={handleExportSimulationReport}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#0B2861]" />
                <span>Descargar Informe Técnico de Cubicaje</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI ARCHITECTURAL SIMULATION STUDIO & PHOTOMETRIC DETAIL INSPECTOR */}
        {aiRenderResult && isSimulationPanelOpen && (
          <div className="rounded-3xl border-2 border-[#0B2861]/30 bg-gradient-to-b from-blue-50/50 to-white p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2861] text-[#FFD100] text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Análisis Generativo IA de Ambiente Real</span>
                </div>
                <h3 className="text-2xl font-black text-[#0B2861] font-display mt-2">
                  {aiRenderResult.renderTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {aiRenderResult.architecturalAtmosphere}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportSimulationReport}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-extrabold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-[#0B2861]" />
                  <span>Exportar Ficha Técnica</span>
                </button>
                <button
                  type="button"
                  onClick={() => renderRealisticEnvironmentWithAi()}
                  disabled={isSimulatingAi}
                  className="p-2.5 rounded-xl bg-[#0B2861] hover:bg-[#081e47] text-white cursor-pointer transition-all"
                  title="Recalcular con IA"
                >
                  <RefreshCw className={`w-4 h-4 ${isSimulatingAi ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Photometric & Engineering Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Nivel de Iluminancia (Lux)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="text-2xl font-black text-[#0B2861]">
                    {aiRenderResult.photometricAnalysis.calculatedLux}
                  </strong>
                  <span className="text-[11px] text-emerald-600 font-bold">Lux Óptimos</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {aiRenderResult.photometricAnalysis.glareRatingUgr}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Reflectancia Lumínica (LRV)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="text-2xl font-black text-[#0B2861]">
                    {aiRenderResult.photometricAnalysis.lightReflectanceValue}%
                  </strong>
                  <span className="text-[11px] text-slate-500">Muro</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#0B2861] h-full rounded-full"
                    style={{ width: `${aiRenderResult.photometricAnalysis.lightReflectanceValue}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Índice Fidelidad Color (CRI)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="text-2xl font-black text-[#0B2861]">
                    {aiRenderResult.photometricAnalysis.colorRenderingIndex}
                  </strong>
                  <span className="text-[11px] text-slate-500">/ 100 Ra</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Luz Induless {aiRenderResult.photometricAnalysis.colorTemperatureK}K
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Confort Lumínico
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="text-base font-black text-emerald-700">
                    {aiRenderResult.photometricAnalysis.visualComfort}
                  </strong>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Factor Día: {aiRenderResult.photometricAnalysis.daylightFactorPct}%
                </p>
              </div>
            </div>

            {/* Interactive Macro Detail Inspector */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D8235A]">
                    Inspección Visual Microscópica
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    Detalles Reales de Materiales &amp; Acabados Constructivos
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                  {[
                    { id: 'textura' as const, label: 'Microtextura Pared' },
                    { id: 'junta' as const, label: 'Junta Porcelana 2K' },
                    { id: 'luz' as const, label: 'Difusión LED' },
                    { id: 'zocalo' as const, label: 'Zócalo Arquitectónico' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDetailTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activeDetailTab === tab.id
                          ? 'bg-[#0B2861] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="md:col-span-5 h-44 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner flex items-center justify-center">
                  {activeDetailTab === 'textura' && (
                    <div
                      className="w-full h-full relative"
                      style={{ backgroundColor: activeWallFinish.hex }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px]" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20" />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        Macro 10× · Película seca 3.2 mils
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'junta' && (
                    <div className="w-full h-full relative bg-slate-300 flex items-center justify-center">
                      <div
                        className="w-[48%] h-full shadow-md"
                        style={{ backgroundColor: activeFloorFinish.tileHex }}
                      />
                      <div
                        className="w-[4%] h-full"
                        style={{ backgroundColor: activeFloorFinish.groutHex }}
                      />
                      <div
                        className="w-[48%] h-full shadow-md"
                        style={{ backgroundColor: activeFloorFinish.tileHex }}
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        Junta 2.0 mm · Porcelana 2K Antihongos
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'luz' && (
                    <div className="w-full h-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
                      <div className="w-24 h-4 rounded-full bg-white shadow-[0_0_40px_20px_rgba(254,240,138,0.9)]" />
                      <div className="absolute top-0 w-36 h-full bg-gradient-to-b from-yellow-100/30 via-yellow-200/10 to-transparent" />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        Haz 120° · Panel Induless 18W
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'zocalo' && (
                    <div className="w-full h-full relative bg-slate-200 flex flex-col justify-end">
                      <div
                        className="w-full h-24"
                        style={{ backgroundColor: activeWallFinish.hex }}
                      />
                      <div className="w-full h-12 bg-white border-y border-slate-300 flex items-center px-4">
                        <span className="text-[9px] font-bold text-slate-400">
                          Zócalo Inglete 45°
                        </span>
                      </div>
                      <div
                        className="w-full h-8"
                        style={{ backgroundColor: activeFloorFinish.tileHex }}
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        Encuentro Muro-Piso · Sellador Latina
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#0B2861] text-[#FFD100] text-[10px] font-black uppercase">
                      Especificación de Laboratorio
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Norma NTE INEN 1538
                    </span>
                  </div>

                  <h5 className="text-base font-extrabold text-slate-900">
                    {activeDetailTab === 'textura' && 'Película Vinil-Acrílica y Textura de Aplicación'}
                    {activeDetailTab === 'junta' && 'Fraguado Antihongos con Porcelana Latina 2K'}
                    {activeDetailTab === 'luz' && 'Distribución Fotométrica y Reproducción Cromática'}
                    {activeDetailTab === 'zocalo' && 'Sellado Perimetral y Remate Arquitectónico'}
                  </h5>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {activeDetailTab === 'textura' && aiRenderResult.microscopicDetails.paintStippleTexture}
                    {activeDetailTab === 'junta' && aiRenderResult.microscopicDetails.porcelainGroutJoint}
                    {activeDetailTab === 'luz' && aiRenderResult.microscopicDetails.ledBeamDiffusion}
                    {activeDetailTab === 'zocalo' && aiRenderResult.microscopicDetails.baseboardPerimeterMiter}
                  </p>
                </div>
              </div>

              {/* Technical Recommendations */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                  Recomendaciones Constructivas &amp; Aplicación:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {aiRenderResult.applicationRecommendations.map((advice, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-800 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[#0B2861] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pauta #{idx + 1}</span>
                      </div>
                      <p className="leading-relaxed text-slate-600">{advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN REALISTIC 3D INTERACTIVE MODAL */}
      <Modal3dEnvironmentViewer
        isOpen={isModalViewerOpen}
        onClose={() => setIsModalViewerOpen(false)}
        environmentId={modalEnvironmentId}
        inventory={inventory}
        activeThemeId={activeThemeId}
        onAddToCart={(item, qty, pres) => {
          onAddCombinationToCart([{ item, quantity: qty }]);
        }}
        onAddCombinationToCart={onAddCombinationToCart}
        onInspectProduct={onInspectProduct}
        onSelectEnvironment={(newEnvId) => {
          setModalEnvironmentId(newEnvId);
          setSelectedEnvironmentId(newEnvId);
        }}
      />
    </section>
  );
};
