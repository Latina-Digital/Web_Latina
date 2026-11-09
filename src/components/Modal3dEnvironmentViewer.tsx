import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  HelpCircle,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  Moon,
  Palette,
  Ruler,
  ShoppingCart,
  Sliders,
  Sparkles,
  Sun,
  Sunset,
  X,
  Zap,
} from 'lucide-react';
import { EcuadorFestiveThemeId, InventoryItem } from '../types/erp';
import { AMBIENTES_ECUADOR, EnvironmentPreset } from '../data/seedData';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';
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
  toggleLightVisibility,
  setAllLightsVisibility,
  getActiveLightsSummary,
  applyHdriEnvironmentPreset,
} from '../utils/lightingRigConfig';

export interface Modal3dEnvironmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  environmentId: string;
  inventory: InventoryItem[];
  activeThemeId?: EcuadorFestiveThemeId;
  onAddToCart: (item: InventoryItem, quantity: number, presentation?: string) => void;
  onAddCombinationToCart?: (items: { item: InventoryItem; quantity: number }[]) => void;
  onInspectProduct?: (item: InventoryItem) => void;
  onSelectEnvironment?: (envId: string) => void;
}

export type InteractiveSurfaceTarget = 'paredes' | 'pisos' | 'iluminacion' | 'muebles' | 'techo';

export interface ArchitecturalFinishOption {
  id: string;
  name: string;
  sku: string;
  hex: string;
  company: 'industrial_latina' | 'induless';
  categoryLabel: string;
  surfaceTarget: InteractiveSurfaceTarget;
  roughness: number;
  clearcoat: number;
  bumpScale: number;
  bumpType: 'stipple' | 'smooth' | 'tile' | 'wood' | 'stucco' | 'epoxy';
  description: string;
  unitPrice: number;
  unit: string;
}

// -----------------------------------------------------------------------------
// CATALOG OF ARCHITECTURAL FINISHES (Industrial Latina & Induless)
// -----------------------------------------------------------------------------
export const ARCHITECTURAL_FINISHES: ArchitecturalFinishOption[] = [
  // 1. Paredes & Muros (Industrial Latina)
  {
    id: 'fin_cobalto',
    name: 'Azul Cobalto Corporativo (Látex LVA)',
    sku: 'LAT-LVA-01',
    hex: '#1E4E8C',
    company: 'industrial_latina',
    categoryLabel: 'Látex Vinil Acrílico · Tipo 2',
    surfaceTarget: 'paredes',
    roughness: 0.52,
    clearcoat: 0.12,
    bumpScale: 0.018,
    bumpType: 'stipple',
    description: 'Recubrimiento vinil acrílico de alta adherencia y color vivo con cubrimiento de 20 m²/gal a 2 manos.',
    unitPrice: 14.5,
    unit: 'Galón',
  },
  {
    id: 'fin_blanco_marfil',
    name: 'Blanco Marfil Sedoso (Satinado Tipo 1)',
    sku: 'LAT-SAT-01',
    hex: '#F4F1EA',
    company: 'industrial_latina',
    categoryLabel: 'Satinado Tipo 1 · Súper Lavable',
    surfaceTarget: 'paredes',
    roughness: 0.28,
    clearcoat: 0.65,
    bumpScale: 0.012,
    bumpType: 'stipple',
    description: 'Pintura satinada con brillo sedoso, 100% lavable y antibacterial para interiores de alto tránsito.',
    unitPrice: 22.9,
    unit: 'Galón',
  },
  {
    id: 'fin_gris_andino',
    name: 'Gris Andino Contemporáneo (Satinado Tipo 1)',
    sku: 'LAT-SAT-01',
    hex: '#94A3B8',
    company: 'industrial_latina',
    categoryLabel: 'Satinado Tipo 1 · Arquitectónico',
    surfaceTarget: 'paredes',
    roughness: 0.32,
    clearcoat: 0.55,
    bumpScale: 0.014,
    bumpType: 'stipple',
    description: 'Tono neutro elegante que aporta equilibrio visual y reflectancia lumínica controlada en muros principales.',
    unitPrice: 22.9,
    unit: 'Galón',
  },
  {
    id: 'fin_esmeralda_duralin',
    name: 'Verde Esmeralda (Duralin Forte Acrílico)',
    sku: 'LAT-DUR-01',
    hex: '#0F766E',
    company: 'industrial_latina',
    categoryLabel: 'Duralin Forte · 100% Acrílico',
    surfaceTarget: 'paredes',
    roughness: 0.38,
    clearcoat: 0.35,
    bumpScale: 0.02,
    bumpType: 'stipple',
    description: 'Pintura 100% acrílica para interiores y fachadas con máxima resistencia a la humedad y hongos.',
    unitPrice: 25.5,
    unit: 'Galón',
  },
  {
    id: 'fin_terracota_teja',
    name: 'Rojo Teja Colonial (Elastomérico Impermeable)',
    sku: 'LAT-ELA-01',
    hex: '#B91C1C',
    company: 'industrial_latina',
    categoryLabel: 'Elastomérico · Hidrorepelente',
    surfaceTarget: 'paredes',
    roughness: 0.46,
    clearcoat: 0.22,
    bumpScale: 0.025,
    bumpType: 'stucco',
    description: 'Membrana impermeabilizante elástica que puentea microfisuras de hasta 1mm y bloquea filtraciones.',
    unitPrice: 29.9,
    unit: 'Galón',
  },
  {
    id: 'fin_amarillo_sol',
    name: 'Amarillo Sol Ecuatoriano (Látex LVA)',
    sku: 'LAT-LVA-01',
    hex: '#EAB308',
    company: 'industrial_latina',
    categoryLabel: 'Látex LVA · Antihongos',
    surfaceTarget: 'paredes',
    roughness: 0.48,
    clearcoat: 0.18,
    bumpScale: 0.016,
    bumpType: 'stipple',
    description: 'Pigmento vibrante resistente a los rayos UV, ideal para paredes de acento en comedores y estancias.',
    unitPrice: 14.5,
    unit: 'Galón',
  },
  {
    id: 'fin_blanco_puro',
    name: 'Blanco Puro Hospitalario (Látex Antibacterial)',
    sku: 'LAT-LVA-01',
    hex: '#FFFFFF',
    company: 'industrial_latina',
    categoryLabel: 'Látex Grado Médico · Blanco Óptico',
    surfaceTarget: 'paredes',
    roughness: 0.35,
    clearcoat: 0.3,
    bumpScale: 0.01,
    bumpType: 'smooth',
    description: 'Máxima luminosidad (88% LRV) con formulación lavable con cloro diluido y agentes antimoho.',
    unitPrice: 14.5,
    unit: 'Galón',
  },
  {
    id: 'fin_arena_pacifico',
    name: 'Arena del Pacífico Cálido (Empaste Acrílico)',
    sku: 'LAT-EMP-EXT',
    hex: '#D7C4A5',
    company: 'industrial_latina',
    categoryLabel: 'Empaste Fino + Acabado Mate Sedoso',
    surfaceTarget: 'paredes',
    roughness: 0.42,
    clearcoat: 0.2,
    bumpScale: 0.015,
    bumpType: 'smooth',
    description: 'Acabado suave y aterciopelado que disimula imperfecciones en la mampostería con tono tierra natural.',
    unitPrice: 28.0,
    unit: 'Caneca 5 Gal',
  },

  // 2. Pisos & Superficies Horizontales
  {
    id: 'fin_piso_gris_andino',
    name: 'Porcelanato Gris Andino Rectificado (Mortero Latina)',
    sku: 'LAT-MOR-POR',
    hex: '#CBD5E1',
    company: 'industrial_latina',
    categoryLabel: 'Porcelanato 60x120 + Fragua 2K',
    surfaceTarget: 'pisos',
    roughness: 0.18,
    clearcoat: 0.8,
    bumpScale: 0.01,
    bumpType: 'tile',
    description: 'Planchas porcelánicas pulidas fijadas con mortero adhesivo impermeable Latina de alta adherencia.',
    unitPrice: 8.5,
    unit: 'Saco 25 Kg',
  },
  {
    id: 'fin_piso_marfil_calido',
    name: 'Porcelanato Marfil Pulido Espejo',
    sku: 'LAT-MOR-POR',
    hex: '#E7E0D3',
    company: 'industrial_latina',
    categoryLabel: 'Porcelanato Vitrificado Alto Brillo',
    surfaceTarget: 'pisos',
    roughness: 0.12,
    clearcoat: 0.95,
    bumpScale: 0.008,
    bumpType: 'tile',
    description: 'Reflejos cristalinos con juntas invisibles de 2mm selladas con Porcelana 2K Antihongos.',
    unitPrice: 8.5,
    unit: 'Saco 25 Kg',
  },
  {
    id: 'fin_piso_madera_roble',
    name: 'Piso Laminado Texturizado Roble Miel',
    sku: 'LAT-POR-2K',
    hex: '#8C5D36',
    company: 'industrial_latina',
    categoryLabel: 'Acabado Madera con Vetas Realistas',
    surfaceTarget: 'pisos',
    roughness: 0.35,
    clearcoat: 0.35,
    bumpScale: 0.025,
    bumpType: 'wood',
    description: 'Vetas continuas sincronizadas con calidez acústica y resistencia al desgaste AC4.',
    unitPrice: 3.8,
    unit: 'Funda 2 Kg',
  },
  {
    id: 'fin_piso_grafito_industrial',
    name: 'Piso Cerámico Grafito Mate Antideslizante',
    sku: 'LAT-MOR-POR',
    hex: '#334155',
    company: 'industrial_latina',
    categoryLabel: 'Cerámica Rústica Alto Tránsito',
    surfaceTarget: 'pisos',
    roughness: 0.45,
    clearcoat: 0.1,
    bumpScale: 0.02,
    bumpType: 'tile',
    description: 'Superficie de textura pétrea con alta tracción, recomendada para cocinas comerciales y terrazas.',
    unitPrice: 8.5,
    unit: 'Saco 25 Kg',
  },
  {
    id: 'fin_piso_epoxi_industrial',
    name: 'Piso Epóxico Autonivelante Industrial con Franja',
    sku: 'LAT-MOR-POR',
    hex: '#1E293B',
    company: 'industrial_latina',
    categoryLabel: 'Recubrimiento Epóxico Grado Logístico',
    surfaceTarget: 'pisos',
    roughness: 0.22,
    clearcoat: 0.85,
    bumpScale: 0.008,
    bumpType: 'epoxy',
    description: 'Piso de tránsito pesado resistente a químicos y montacargas con demarcación de seguridad amarilla.',
    unitPrice: 34.0,
    unit: 'Kit Galón',
  },
  {
    id: 'fin_piso_adoquin_rustico',
    name: 'Adoquines Rústicos Piedra Volcánica',
    sku: 'LAT-MOR-POR',
    hex: '#475569',
    company: 'industrial_latina',
    categoryLabel: 'Pavimento Exterior Rústico',
    surfaceTarget: 'pisos',
    roughness: 0.65,
    clearcoat: 0.05,
    bumpScale: 0.035,
    bumpType: 'tile',
    description: 'Adoquinado de alta resistencia a la intemperie para accesos vehiculares y caminerías.',
    unitPrice: 9.2,
    unit: 'm²',
  },

  // 3. Iluminación & Luminarias (Induless)
  {
    id: 'fin_luz_led_blanco_frio',
    name: 'Paneles LED Induless 18W Blanco Frío 6500K',
    sku: 'PRL18E',
    hex: '#E0F2FE',
    company: 'induless',
    categoryLabel: 'Iluminación LED Comercial · 1450 Lúmenes',
    surfaceTarget: 'iluminacion',
    roughness: 0.2,
    clearcoat: 0.8,
    bumpScale: 0.005,
    bumpType: 'smooth',
    description: 'Difusor esmerilado sin parpadeo (UGR < 19) para áreas de trabajo, cocinas y mesones de precisión.',
    unitPrice: 6.8,
    unit: 'Unidad',
  },
  {
    id: 'fin_luz_led_blanco_calido',
    name: 'Spots LED Induless Luz Cálida Acogedora 3000K',
    sku: 'PRL18E',
    hex: '#FEF08A',
    company: 'induless',
    categoryLabel: 'Iluminación Residencial Cálida',
    surfaceTarget: 'iluminacion',
    roughness: 0.2,
    clearcoat: 0.8,
    bumpScale: 0.005,
    bumpType: 'smooth',
    description: 'Luz dorada relajante ideal para salas de estar, comedores y dormitorios principales.',
    unitPrice: 6.8,
    unit: 'Unidad',
  },
  {
    id: 'fin_luz_led_ambar',
    name: 'Tira LED Oculta Ámbar Indirecta 2700K',
    sku: 'PRL18E',
    hex: '#FBBF24',
    company: 'induless',
    categoryLabel: 'Iluminación Arquitectónica Indirecta',
    surfaceTarget: 'iluminacion',
    roughness: 0.2,
    clearcoat: 0.8,
    bumpScale: 0.005,
    bumpType: 'smooth',
    description: 'Guirnaldas y retroiluminación perimetral en zócalos, nichos y cabeceros de cama.',
    unitPrice: 12.5,
    unit: 'Rollo 5m',
  },
  {
    id: 'fin_luz_highbay_ufo',
    name: 'Campana Industrial High-Bay UFO 150W Induless',
    sku: '8235F',
    hex: '#F8FAFC',
    company: 'induless',
    categoryLabel: 'Luminaria Galpón & Bodega IP65',
    surfaceTarget: 'iluminacion',
    roughness: 0.15,
    clearcoat: 0.9,
    bumpScale: 0.005,
    bumpType: 'smooth',
    description: 'Flujo lumínico de 21,000 lúmenes con disipador de aluminio puro y encendido instantáneo.',
    unitPrice: 48.0,
    unit: 'Unidad',
  },

  // 4. Muebles, Mesones & Equipamiento Arquitectónico
  {
    id: 'fin_meson_cuarzo_blanco',
    name: 'Cubierta Cuarzo Blanco Cascada Silestone',
    sku: '3184',
    hex: '#F8FAFC',
    company: 'industrial_latina',
    categoryLabel: 'Superficie Compacta de Alta Resistencia',
    surfaceTarget: 'muebles',
    roughness: 0.12,
    clearcoat: 0.9,
    bumpScale: 0.004,
    bumpType: 'smooth',
    description: 'Tope antibacterial no poroso, resistente al rayado y manchas de ácidos culinarios.',
    unitPrice: 75.0,
    unit: 'ml',
  },
  {
    id: 'fin_mueble_acero_inox',
    name: 'Mesón y Fregadero Acero Inox 304 Induless',
    sku: '3184',
    hex: '#94A3B8',
    company: 'induless',
    categoryLabel: 'Acero Inoxidable Quirúrgico 304',
    surfaceTarget: 'muebles',
    roughness: 0.22,
    clearcoat: 0.7,
    bumpScale: 0.005,
    bumpType: 'smooth',
    description: 'Resistencia absoluta a la corrosión con pulido satinado scotch-brite fácil de desinfectar.',
    unitPrice: 62.0,
    unit: 'Unidad',
  },
  {
    id: 'fin_mueble_negro_mate',
    name: 'Mobiliario Negro Mate Soft-Touch & Grifería',
    sku: 'IL22-007D-N',
    hex: '#1E293B',
    company: 'induless',
    categoryLabel: 'Termolaminado Negro Mate Anti-huella',
    surfaceTarget: 'muebles',
    roughness: 0.38,
    clearcoat: 0.15,
    bumpScale: 0.008,
    bumpType: 'smooth',
    description: 'Acabado minimalista moderno con herrajes alemanes de cierre amortiguado soft-close.',
    unitPrice: 38.5,
    unit: 'Unidad',
  },
  {
    id: 'fin_meson_granito_negro',
    name: 'Granito San Gabriel Pulido Espejo',
    sku: '3184',
    hex: '#18181B',
    company: 'industrial_latina',
    categoryLabel: 'Piedra Natural Pulida',
    surfaceTarget: 'muebles',
    roughness: 0.1,
    clearcoat: 0.95,
    bumpScale: 0.004,
    bumpType: 'smooth',
    description: 'Piedra natural de dureza excepcional resistente a temperaturas superiores a 300°C.',
    unitPrice: 68.0,
    unit: 'ml',
  },
  {
    id: 'fin_meson_madera_teca',
    name: 'Cubierta Madera de Teca Tratada con Aceite',
    sku: 'LAT-POR-2K',
    hex: '#78350F',
    company: 'industrial_latina',
    categoryLabel: 'Madera Maciza Hidrorrepelente',
    surfaceTarget: 'muebles',
    roughness: 0.35,
    clearcoat: 0.3,
    bumpScale: 0.015,
    bumpType: 'wood',
    description: 'Tablón alistonado de teca seleccionada con acabado sedoso mate de alta durabilidad.',
    unitPrice: 55.0,
    unit: 'ml',
  },
];

const ENV_EXACT_NAMES: Record<string, string> = {
  amb_sala_estar: 'Sala de Estar Vanguardista',
  amb_cocina_gourmet: 'Cocina Gourmet',
  amb_dormitorio_master: 'Master Suite Contemporánea',
  amb_bano_spa: 'Baño de Lujo Estilo Spa',
  amb_fachada_exterior: 'Fachada',
  amb_cubierta_obra: 'Cubierta Industrial, Galpón',
};

export const Modal3dEnvironmentViewer: React.FC<Modal3dEnvironmentViewerProps> = ({
  isOpen,
  onClose,
  environmentId,
  inventory,
  activeThemeId,
  onAddToCart,
  onAddCombinationToCart,
  onInspectProduct,
  onSelectEnvironment,
}) => {
  const activeFestiveTheme = getActiveFestiveTheme(activeThemeId);
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Active environment
  const currentEnv: EnvironmentPreset = useMemo(() => {
    return (
      AMBIENTES_ECUADOR.find((e) => e.id === environmentId) ||
      AMBIENTES_ECUADOR[0]
    );
  }, [environmentId]);

  // Selected Interactive Surface Target
  const [selectedSurface, setSelectedSurface] = useState<InteractiveSurfaceTarget>('paredes');
  const [selectedFinishId, setSelectedFinishId] = useState<string>('fin_blanco_marfil');
  const [lightingPreset, setLightingPreset] = useState<'dia' | 'tarde' | 'noche' | 'rasante'>('dia');
  const [cameraView, setCameraView] = useState<'general' | 'humana' | 'detalle' | 'planta'>('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clickIndicatorPos, setClickIndicatorPos] = useState<{ x: number; y: number; label: string } | null>(null);

  // Surface states for dynamic 3D customization
  const [wallColorHex, setWallColorHex] = useState<string>('#F4F1EA');
  const [wallRoughness, setWallRoughness] = useState<number>(0.28);
  const [wallClearcoat, setWallClearcoat] = useState<number>(0.65);
  const [wallBumpScale, setWallBumpScale] = useState<number>(0.012);

  const [floorColorHex, setFloorColorHex] = useState<string>('#CBD5E1');
  const [floorRoughness, setFloorRoughness] = useState<number>(0.18);
  const [floorMetalness, setFloorMetalness] = useState<number>(0.08);

  const [lightColorHex, setLightColorHex] = useState<string>('#E0F2FE');
  const [lightIntensity, setLightIntensity] = useState<number>(2.2);

  const [furnitureColorHex, setFurnitureColorHex] = useState<string>('#94A3B8');
  const [furnitureRoughness, setFurnitureRoughness] = useState<number>(0.22);

  // Modal Scene Lighting Rig State (Vista Global, Ambiental, Direccional, Punto)
  const [modalLightingRig, setModalLightingRig] = useState<SceneLightingRigConfig>(() =>
    getPresetLightingRigConfig('dia')
  );
  const [modalLightTab, setModalLightTab] = useState<'global' | 'ambiental' | 'direccional' | 'punto'>('global');

  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Target positions for smooth camera lerp transitions
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(7.2, 5.2, 7.8));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.4, 0));
  const isUserInteractingRef = useRef<boolean>(false);

  // Meshes & materials mapped to interactive targets
  const currentDioramaGroupRef = useRef<THREE.Group | null>(null);
  const interactiveMeshesRef = useRef<Map<THREE.Object3D, InteractiveSurfaceTarget>>(new Map());
  const wallMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const floorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const mesonMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ledMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    hemi: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
    point: THREE.PointLight;
    fill: THREE.DirectionalLight;
    spot1: THREE.SpotLight;
    spot2: THREE.SpotLight;
  } | null>(null);
  const activeModalHdriRef = useRef<HdriEnvironmentPresetId>('industrial');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync initial color & finish when environment changes
  useEffect(() => {
    if (currentEnv.id === 'amb_sala_estar') {
      setWallColorHex('#1E4E8C');
      setFloorColorHex('#8C5D36');
      setSelectedFinishId('fin_cobalto');
      setFurnitureColorHex('#1E293B');
    } else if (currentEnv.id === 'amb_cocina_gourmet') {
      setWallColorHex('#F4F1EA');
      setFloorColorHex('#CBD5E1');
      setSelectedFinishId('fin_blanco_marfil');
      setFurnitureColorHex('#F8FAFC');
    } else if (currentEnv.id === 'amb_dormitorio_master') {
      setWallColorHex('#94A3B8');
      setFloorColorHex('#8C5D36');
      setSelectedFinishId('fin_gris_andino');
      setFurnitureColorHex('#78350F');
    } else if (currentEnv.id === 'amb_bano_spa') {
      setWallColorHex('#F4F1EA');
      setFloorColorHex('#E7E0D3');
      setSelectedFinishId('fin_blanco_puro');
      setFurnitureColorHex('#1E293B');
    } else if (currentEnv.id === 'amb_fachada_exterior') {
      setWallColorHex('#B91C1C');
      setFloorColorHex('#475569');
      setSelectedFinishId('fin_terracota_teja');
      setFurnitureColorHex('#78350F');
    } else if (currentEnv.id === 'amb_cubierta_obra') {
      setWallColorHex('#0F766E');
      setFloorColorHex('#1E293B');
      setSelectedFinishId('fin_esmeralda_duralin');
      setFurnitureColorHex('#94A3B8');
    }
  }, [currentEnv.id]);

  // Current active finish item
  const currentActiveFinish = useMemo(() => {
    return (
      ARCHITECTURAL_FINISHES.find((f) => f.id === selectedFinishId) ||
      ARCHITECTURAL_FINISHES[0]
    );
  }, [selectedFinishId]);

  // Available finishes for currently selected surface target
  const availableFinishesForTarget = useMemo(() => {
    return ARCHITECTURAL_FINISHES.filter((f) => f.surfaceTarget === selectedSurface);
  }, [selectedSurface]);

  // Inventory matching item
  const matchedInventoryProduct = useMemo(() => {
    return inventory.find((i) => i.sku === currentActiveFinish.sku) || inventory[0];
  }, [inventory, currentActiveFinish.sku]);

  // ---------------------------------------------------------------------------
  // INITIALIZE THREE.JS SCENE, LIGHTS & CONTROLS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const container = mountRef.current;
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

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1933);
    scene.fog = new THREE.Fog(0x0c1933, 18, 48);
    sceneRef.current = scene;

    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envScene = buildProceduralHdriEnvironmentScene('industrial');
      scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture;
      activeModalHdriRef.current = 'industrial';
      pmremGenerator.dispose();
    } catch {
      try {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
        pmremGenerator.dispose();
      } catch {
        // Fallback
      }
    }

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 90);
    camera.position.set(7.2, 5.2, 7.8);
    cameraRef.current = camera;
    targetCamPos.current.set(7.2, 5.2, 7.8);
    targetCamLook.current.set(0, 1.4, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.4, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.0;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controlsRef.current = controls;

    // Detect user manual orbit to prevent lerp interference
    controls.addEventListener('start', () => {
      isUserInteractingRef.current = true;
    });
    controls.addEventListener('end', () => {
      isUserInteractingRef.current = false;
      targetCamPos.current.copy(camera.position);
      targetCamLook.current.copy(controls.target);
    });

    // ARCHITECTURAL LIGHTING RIG
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.95);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(9.0, 12.0, 8.0);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -7.5;
    sunLight.shadow.camera.right = 7.5;
    sunLight.shadow.camera.top = 7.5;
    sunLight.shadow.camera.bottom = -7.5;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const pointLight = new THREE.PointLight(0xfff8eb, 1.8, 14, 1.5);
    pointLight.position.set(0.0, 3.2, 0.5);
    pointLight.castShadow = !isSoftwareGl;
    scene.add(pointLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    fillLight.position.set(-8, 5, -6);
    scene.add(fillLight);

    const spot1 = new THREE.SpotLight(0xfff8eb, 2.5, 12, Math.PI / 3.6, 0.45, 1.2);
    spot1.position.set(-1.6, 4.2, 0.5);
    spot1.target.position.set(-1.6, 0, 0.5);
    scene.add(spot1);
    scene.add(spot1.target);

    const spot2 = new THREE.SpotLight(0xfff8eb, 2.5, 12, Math.PI / 3.6, 0.45, 1.2);
    spot2.position.set(1.6, 4.2, 0.5);
    spot2.target.position.set(1.6, 0, 0.5);
    scene.add(spot2);
    scene.add(spot2.target);

    lightsRef.current = {
      ambient: ambientLight,
      hemi: hemiLight,
      sun: sunLight,
      point: pointLight,
      fill: fillLight,
      spot1,
      spot2,
    };

    // SHARED REUSABLE PBR MATERIALS
    const paintStipple = createHighResPaintStippleTexture();
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(wallColorHex),
      roughness: wallRoughness,
      clearcoat: wallClearcoat,
      clearcoatRoughness: 0.25,
      bumpMap: paintStipple,
      bumpScale: wallBumpScale,
    });
    wallMaterialRef.current = wallMat;

    const floorTile = createHighResTileTexture(floorColorHex, '#F8FAFC');
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTile,
      roughness: floorRoughness,
      metalness: floorMetalness,
    });
    floorMaterialRef.current = floorMat;

    const mesonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(furnitureColorHex),
      roughness: furnitureRoughness,
      metalness: 0.15,
    });
    mesonMaterialRef.current = mesonMat;

    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(lightColorHex),
      emissiveIntensity: lightIntensity,
      roughness: 0.1,
    });
    ledMaterialRef.current = ledMat;

    // DIRECT SURFACE RAYCASTING WITH TACTILE PULSE
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!renderer || !camera) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const objectsToIntersect = Array.from(interactiveMeshesRef.current.keys());
      const intersects = raycaster.intersectObjects(objectsToIntersect, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        let target = interactiveMeshesRef.current.get(hit.object);
        if (!target && hit.object.parent) {
          target = interactiveMeshesRef.current.get(hit.object.parent);
        }
        if (!target && hit.object.userData?.target) {
          target = hit.object.userData.target as InteractiveSurfaceTarget;
        }

        if (target) {
          setSelectedSurface(target);
          setIsSidebarOpen(true);

          // Subtle tactile pulse on clicked mesh
          if (hit.object instanceof THREE.Mesh && hit.object.material) {
            const mat = hit.object.material as THREE.MeshStandardMaterial;
            if (mat.emissive) {
              const origEmissive = mat.emissive.clone();
              const origIntensity = mat.emissiveIntensity;
              mat.emissive.setHex(0xffd100);
              mat.emissiveIntensity = 1.2;
              setTimeout(() => {
                mat.emissive.copy(origEmissive);
                mat.emissiveIntensity = origIntensity;
              }, 350);
            }
          }

          // Select matching finish
          const matched = ARCHITECTURAL_FINISHES.find((f) => f.surfaceTarget === target);
          if (matched) {
            setSelectedFinishId(matched.id);
          }

          setClickIndicatorPos({
            x: event.clientX,
            y: event.clientY,
            label: hit.object.userData.label || `Superficie: ${target.toUpperCase()}`,
          });

          setTimeout(() => {
            setClickIndicatorPos(null);
          }, 2400);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // SMOOTH ANIMATION LOOP WITH CAMERA LERP
    let isMounted = true;
    const animate = () => {
      if (!isMounted) return;
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isUserInteractingRef.current) {
        camera.position.lerp(targetCamPos.current, 0.06);
        controls.target.lerp(targetCamLook.current, 0.06);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
      scene.clear();
      container.innerHTML = '';
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // BUILD / SWAP THE 6 ARCHITECTURAL ISOMETRIC DIORAMAS DYNAMICALLY
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear previous diorama
    if (currentDioramaGroupRef.current) {
      scene.remove(currentDioramaGroupRef.current);
      currentDioramaGroupRef.current = null;
    }
    interactiveMeshesRef.current.clear();

    const wallMat = wallMaterialRef.current;
    const floorMat = floorMaterialRef.current;
    const mesonMat = mesonMaterialRef.current;
    const ledMat = ledMaterialRef.current;

    if (!wallMat || !floorMat || !mesonMat || !ledMat) return;

    // Switch floor texture map to match diorama context
    let newFloorTex: THREE.CanvasTexture;
    if (currentEnv.id === 'amb_sala_estar' || currentEnv.id === 'amb_dormitorio_master') {
      newFloorTex = createHighResWoodTexture(floorColorHex);
    } else if (currentEnv.id === 'amb_fachada_exterior') {
      newFloorTex = createHighResCobblestoneTexture();
    } else if (currentEnv.id === 'amb_cubierta_obra') {
      newFloorTex = createHighResEpoxyTexture(floorColorHex);
    } else {
      newFloorTex = createHighResTileTexture(floorColorHex, '#F8FAFC');
    }
    const prevTex = floorMat.map;
    floorMat.map = newFloorTex;
    floorMat.needsUpdate = true;
    prevTex?.dispose();

    // Call the respective diorama builder
    let dioramaResult: DioramaBuildResult;
    switch (currentEnv.id) {
      case 'amb_sala_estar':
        dioramaResult = buildLivingRoomDiorama(wallMat, floorMat, mesonMat, ledMat);
        break;
      case 'amb_cocina_gourmet':
        dioramaResult = buildKitchenDiorama(wallMat, floorMat, mesonMat, ledMat);
        break;
      case 'amb_dormitorio_master':
        dioramaResult = buildBedroomDiorama(wallMat, floorMat, mesonMat, ledMat);
        break;
      case 'amb_bano_spa':
        dioramaResult = buildBathroomDiorama(wallMat, floorMat, mesonMat, ledMat);
        break;
      case 'amb_fachada_exterior':
        dioramaResult = buildFacadeDiorama(wallMat, floorMat, mesonMat, ledMat);
        break;
      case 'amb_cubierta_obra':
        dioramaResult = buildIndustrialDiorama(wallMat, floorMat, mesonMat, ledMat);
        break;
      default:
        dioramaResult = buildLivingRoomDiorama(wallMat, floorMat, mesonMat, ledMat);
    }

    scene.add(dioramaResult.rootGroup);
    currentDioramaGroupRef.current = dioramaResult.rootGroup;

    // Register all interactive meshes for raycasting
    dioramaResult.interactiveMap.forEach((target, obj) => {
      interactiveMeshesRef.current.set(obj, target);
    });

    // Reset default isometric camera perspective smoothly
    targetCamPos.current.set(7.2, 5.2, 7.8);
    targetCamLook.current.set(0, 1.4, 0);
    setCameraView('general');
  }, [isOpen, currentEnv.id]);

  // ---------------------------------------------------------------------------
  // REAL-TIME MATERIAL & TEXTURE PROPAGATION (Zero reload / instant response)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (wallMaterialRef.current) {
      wallMaterialRef.current.color.set(wallColorHex);
      wallMaterialRef.current.roughness = wallRoughness;
      wallMaterialRef.current.clearcoat = wallClearcoat;
      wallMaterialRef.current.bumpScale = wallBumpScale;
      wallMaterialRef.current.needsUpdate = true;
    }
  }, [wallColorHex, wallRoughness, wallClearcoat, wallBumpScale]);

  useEffect(() => {
    if (floorMaterialRef.current) {
      floorMaterialRef.current.roughness = floorRoughness;
      floorMaterialRef.current.metalness = floorMetalness;
      // Regenerate appropriate procedural pattern with updated color
      let newTex: THREE.CanvasTexture;
      if (currentEnv.id === 'amb_cubierta_obra') {
        newTex = createHighResEpoxyTexture(floorColorHex);
      } else if (currentEnv.id === 'amb_fachada_exterior') {
        newTex = createHighResCobblestoneTexture();
      } else if (currentEnv.id === 'amb_sala_estar' || currentEnv.id === 'amb_dormitorio_master') {
        newTex = createHighResWoodTexture(floorColorHex);
      } else {
        newTex = createHighResTileTexture(floorColorHex, '#F8FAFC');
      }
      const old = floorMaterialRef.current.map;
      floorMaterialRef.current.map = newTex;
      floorMaterialRef.current.needsUpdate = true;
      old?.dispose();
    }
  }, [floorColorHex, floorRoughness, floorMetalness, currentEnv.id]);

  useEffect(() => {
    if (mesonMaterialRef.current) {
      mesonMaterialRef.current.color.set(furnitureColorHex);
      mesonMaterialRef.current.roughness = furnitureRoughness;
      mesonMaterialRef.current.needsUpdate = true;
    }
  }, [furnitureColorHex, furnitureRoughness]);

  useEffect(() => {
    if (ledMaterialRef.current) {
      ledMaterialRef.current.emissive.set(lightColorHex);
      ledMaterialRef.current.emissiveIntensity = lightIntensity;
      ledMaterialRef.current.needsUpdate = true;
    }
  }, [lightColorHex, lightIntensity]);

  // ---------------------------------------------------------------------------
  // LIGHTING PRESETS & RIG SYNC (Ambiental, Direccional, Punto)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setModalLightingRig((prev) => ({
      ...getPresetLightingRigConfig(lightingPreset),
      showLightHelpers: prev.showLightHelpers,
    }));
  }, [lightingPreset]);

  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { ambient, hemi, sun, point, fill, spot1, spot2 } = lightsRef.current;
    const scene = sceneRef.current;
    const safe = clampLightingRigConfig(modalLightingRig);

    if (lightingPreset === 'dia') {
      scene.background = new THREE.Color(0x0c1933);
      fill.intensity = 0.55;
      spot1.intensity = 1.6;
      spot2.intensity = 1.6;
    } else if (lightingPreset === 'tarde') {
      scene.background = new THREE.Color(0x1f142b);
      fill.intensity = 0.35;
      spot1.intensity = 2.6;
      spot2.intensity = 2.6;
    } else if (lightingPreset === 'noche') {
      scene.background = new THREE.Color(0x060d1a);
      fill.intensity = 0.08;
      spot1.intensity = 4.8;
      spot2.intensity = 4.8;
    } else if (lightingPreset === 'rasante') {
      scene.background = new THREE.Color(0x0a1426);
      fill.intensity = 0.15;
      spot1.intensity = 1.0;
      spot2.intensity = 1.0;
    }

    const ambOn = safe.ambient.enabled !== false;
    const dirOn = safe.directional.enabled !== false;
    const ptOn = safe.point.enabled !== false;

    ambient.visible = ambOn;
    ambient.intensity = ambOn ? safe.ambient.intensity * 0.45 : 0;
    ambient.color.set(safe.ambient.colorHex);
    hemi.visible = ambOn;
    hemi.intensity = ambOn ? safe.ambient.intensity : 0;
    hemi.color.set(safe.ambient.colorHex);
    hemi.groundColor.set(safe.ambient.groundColorHex);

    sun.visible = dirOn;
    sun.intensity = dirOn ? safe.directional.intensity : 0;
    sun.color.set(safe.directional.colorHex);
    sun.position.set(
      safe.directional.position[0],
      safe.directional.position[1],
      safe.directional.position[2]
    );

    point.visible = ptOn;
    point.intensity = ptOn ? safe.point.intensity : 0;
    point.color.set(safe.point.colorHex);
    point.distance = safe.point.distance;
    point.position.set(
      safe.point.position[0],
      safe.point.position[1],
      safe.point.position[2]
    );

    // Sync Procedural HDRi Environment & Global IBL Intensity
    const targetHdri: HdriEnvironmentPresetId = safe.hdriPreset || 'industrial';
    const hdriSpec =
      HDRI_ENVIRONMENT_PRESETS[targetHdri] || HDRI_ENVIRONMENT_PRESETS.industrial;
    if (targetHdri !== activeModalHdriRef.current && rendererRef.current) {
      activeModalHdriRef.current = targetHdri;
      try {
        const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
        const envScene = buildProceduralHdriEnvironmentScene(targetHdri);
        const prevEnv = scene.environment;
        scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture;
        prevEnv?.dispose();
        pmremGenerator.dispose();
      } catch {
        // Ignore if software GL context fails
      }
      scene.background = new THREE.Color(hdriSpec.sceneBackgroundHex);
      rendererRef.current.toneMappingExposure = hdriSpec.toneMappingExposure;
    }
    const envIntensity = safe.envMapIntensity ?? hdriSpec.defaultEnvMapIntensity;
    (scene as unknown as { environmentIntensity?: number }).environmentIntensity =
      envIntensity;
    if (wallMaterialRef.current) {
      wallMaterialRef.current.envMapIntensity = envIntensity;
      wallMaterialRef.current.needsUpdate = true;
    }
    if (floorMaterialRef.current) {
      floorMaterialRef.current.envMapIntensity = envIntensity;
      floorMaterialRef.current.needsUpdate = true;
    }
    if (mesonMaterialRef.current) {
      mesonMaterialRef.current.envMapIntensity = envIntensity;
      mesonMaterialRef.current.needsUpdate = true;
    }
  }, [lightingPreset, modalLightingRig]);

  // ---------------------------------------------------------------------------
  // CAMERA VIEW PRESETS (Smooth lerp transitions)
  // ---------------------------------------------------------------------------
  const handleCameraChange = (mode: 'general' | 'humana' | 'detalle' | 'planta') => {
    setCameraView(mode);
    isUserInteractingRef.current = false;

    if (mode === 'general') {
      targetCamPos.current.set(7.2, 5.2, 7.8);
      targetCamLook.current.set(0, 1.4, 0);
    } else if (mode === 'humana') {
      targetCamPos.current.set(2.8, 1.65, 3.2);
      targetCamLook.current.set(-0.5, 1.5, -0.6);
    } else if (mode === 'detalle') {
      targetCamPos.current.set(-0.8, 1.8, -1.2);
      targetCamLook.current.set(-1.6, 1.8, -2.6);
    } else if (mode === 'planta') {
      targetCamPos.current.set(0.1, 9.5, 0.1);
      targetCamLook.current.set(0, 0, 0);
    }
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Capture realistic snapshot photo
  const handleCaptureSnapshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    try {
      const dataUrl = renderer.domElement.toDataURL('image/png');
      const filename = `render_diorama_${currentEnv.id}_${currentActiveFinish.sku}.png`;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.click();
      showToast('¡Foto render fotorrealista 3D descargada en alta resolución!');
    } catch {
      showToast('Captura completada.');
    }
  };

  // Select a preset finish
  const handleApplyFinish = (finish: ArchitecturalFinishOption) => {
    setSelectedFinishId(finish.id);
    if (finish.surfaceTarget === 'paredes') {
      setWallColorHex(finish.hex);
      setWallRoughness(finish.roughness);
      setWallClearcoat(finish.clearcoat);
      setWallBumpScale(finish.bumpScale);
    } else if (finish.surfaceTarget === 'pisos') {
      setFloorColorHex(finish.hex);
      setFloorRoughness(finish.roughness);
    } else if (finish.surfaceTarget === 'iluminacion') {
      setLightColorHex(finish.hex);
    } else if (finish.surfaceTarget === 'muebles') {
      setFurnitureColorHex(finish.hex);
      setFurnitureRoughness(finish.roughness);
    }
    showToast(`Aplicado: ${finish.name} sobre ${finish.surfaceTarget}`);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-3d-title"
      className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-fade-in"
      style={{ zIndex: 9999 }}
    >
      {/* =========================================================================
          TOP ARCHITECTURAL APPBAR (Brand, Environment Tabs & Camera/Lighting Controls)
         ========================================================================= */}
      <header
        className={`px-4 sm:px-6 py-2.5 text-white flex flex-wrap items-center justify-between gap-3 border-b-2 bg-gradient-to-r ${activeFestiveTheme.bannerGradient} shadow-2xl relative z-20`}
        style={{ borderBottomColor: activeFestiveTheme.secondaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
            {activeFestiveTheme.iconSymbol}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${activeFestiveTheme.badgeBg} ${activeFestiveTheme.badgeText}`}>
                {activeFestiveTheme.heroBadge}
              </span>
              <span className="text-[10px] font-mono text-yellow-300 font-bold">
                Visualizador Fotorrealista 3D
              </span>
            </div>
            <h2 id="modal-3d-title" className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              <span>{ENV_EXACT_NAMES[currentEnv.id] || currentEnv.name}</span>
              <span className="text-xs font-normal text-blue-200 hidden md:inline">
                · {currentEnv.roomType}
              </span>
            </h2>
          </div>
        </div>

        {/* Center Environment 6-Tab Bar */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/15 overflow-x-auto max-w-full">
          {AMBIENTES_ECUADOR.map((env) => {
            const isCurrent = env.id === currentEnv.id;
            const tabName = ENV_EXACT_NAMES[env.id] || env.name.split('&')[0].trim();
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => {
                  onSelectEnvironment?.(env.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#FFD100] text-[#0B2861] shadow-md font-black'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tabName}
              </button>
            );
          })}
        </div>

        {/* Right Tools (Cameras, Lighting, Fullscreen, Close) */}
        <div className="flex items-center gap-2">
          {/* Lighting Mode Selector */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/20 text-xs">
            <button
              type="button"
              onClick={() => setLightingPreset('dia')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingPreset === 'dia' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
              title="Luz de Día Soleado"
              aria-label="Luz de Día"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLightingPreset('tarde')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingPreset === 'tarde' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
              title="Atardecer Cálido Dorado"
              aria-label="Atardecer Cálido"
            >
              <Sunset className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLightingPreset('noche')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingPreset === 'noche' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
              title="Iluminación Cálida Nocturna"
              aria-label="Iluminación Nocturna"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLightingPreset('rasante')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingPreset === 'rasante' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
              title="Luz Rasante para Textura y Relieve"
              aria-label="Luz Rasante"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>

          {/* Camera View Presets */}
          <div className="hidden sm:flex items-center bg-black/40 p-1 rounded-xl border border-white/20 text-xs">
            <button
              type="button"
              onClick={() => handleCameraChange('general')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                cameraView === 'general' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
            >
              3D General
            </button>
            <button
              type="button"
              onClick={() => handleCameraChange('humana')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                cameraView === 'humana' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
            >
              Ojo Humano
            </button>
            <button
              type="button"
              onClick={() => handleCameraChange('detalle')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                cameraView === 'detalle' ? 'bg-[#FFD100] text-[#0B2861]' : 'text-white/80 hover:text-white'
              }`}
            >
              Detalle Pared
            </button>
          </div>

          {/* Photo Render Snapshot Button */}
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Descargar Foto Render 3D"
            aria-label="Descargar Foto Render 3D"
          >
            <Camera className="w-4 h-4 text-[#FFD100]" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Pantalla Completa"
            aria-label="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-[#E3000F] text-white transition-all cursor-pointer"
            title="Cerrar Diseñador 3D"
            aria-label="Cerrar Diseñador 3D"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN 3D VIEWPORT WITH RAYCASTING + FLOATING CUSTOMIZATION DRAWER
         ========================================================================= */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* 3D WebGL Canvas Mount */}
        <div
          ref={mountRef}
          className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing bg-[#0C1933]"
        />

        {/* Floating Instruction Banner on Viewport */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
          <div className="bg-slate-950/85 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl text-xs text-white shadow-xl flex items-center gap-2.5 max-w-sm">
            <span className="p-1 rounded-lg bg-[#FFD100] text-[#0B2861] font-black text-xs">
              👆
            </span>
            <div>
              <p className="font-extrabold text-[#FFD100]">Interactividad Directa:</p>
              <p className="text-[11px] text-slate-300">
                Haz clic sobre <strong>paredes, pisos, mesón o luces</strong> en el diorama 3D para personalizar su acabado en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Click Pulse Marker Tooltip */}
        {clickIndicatorPos && (
          <div
            className="fixed z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 animate-bounce-subtle"
            style={{ left: clickIndicatorPos.x, top: clickIndicatorPos.y }}
          >
            <div className="px-3 py-1.5 rounded-xl bg-[#0B2861] text-[#FFD100] font-extrabold text-xs shadow-2xl border-2 border-[#FFD100] flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" />
              <span>{clickIndicatorPos.label}</span>
            </div>
          </div>
        )}

        {/* Floating Sidebar Toggle Button (if collapsed) */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 right-6 z-20 px-4 py-3 bg-[#0B2861] hover:bg-blue-900 text-white rounded-2xl shadow-2xl border-2 border-[#FFD100] font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Palette className="w-4 h-4 text-[#FFD100]" />
            <span>Personalizar Acabados ({selectedSurface.toUpperCase()})</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* FLOATING CUSTOMIZATION DRAWER (PANEL LATERAL EN TIEMPO REAL) */}
        {isSidebarOpen && (
          <aside
            aria-label="Panel de personalización de texturas y colores"
            className="w-full sm:w-[410px] bg-slate-900/95 backdrop-blur-xl border-l-2 border-slate-700/80 text-white flex flex-col justify-between shadow-2xl relative z-20 animate-fade-in-up sm:animate-none overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#FFD100]" />
                <h3 className="font-black text-sm text-white">
                  Personalización de Acabados
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Minimizar panel lateral"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* 1. Surface Target Selector Tabs (4 selectors) */}
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  1. Seleccione Superficie a Diseñar:
                </span>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedSurface('paredes')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      selectedSurface === 'paredes'
                        ? 'bg-[#0B2861] text-[#FFD100] shadow-sm font-extrabold border border-[#FFD100]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🧱</span>
                    <span>Paredes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurface('pisos')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      selectedSurface === 'pisos'
                        ? 'bg-[#0B2861] text-[#FFD100] shadow-sm font-extrabold border border-[#FFD100]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>✨</span>
                    <span>Pisos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurface('iluminacion')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      selectedSurface === 'iluminacion'
                        ? 'bg-[#0B2861] text-[#FFD100] shadow-sm font-extrabold border border-[#FFD100]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>💡</span>
                    <span>Luz LED</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurface('muebles')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      selectedSurface === 'muebles'
                        ? 'bg-[#0B2861] text-[#FFD100] shadow-sm font-extrabold border border-[#FFD100]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🪵</span>
                    <span>Mesón</span>
                  </button>
                </div>
              </div>

              {/* 2. Official Color Catalog with Real Names & Swatches */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    2. Catálogo de Color Oficial:
                  </span>
                  <span className="text-[10px] text-[#FFD100] font-mono font-bold">
                    {availableFinishesForTarget.length} opciones
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableFinishesForTarget.map((finish) => {
                    const isSelected = finish.id === selectedFinishId;
                    return (
                      <button
                        key={finish.id}
                        type="button"
                        onClick={() => handleApplyFinish(finish)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#0B2861]/90 border-[#FFD100] shadow-lg ring-2 ring-[#FFD100]/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-sm flex items-center justify-center text-xs"
                          style={{ backgroundColor: finish.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-white truncate leading-tight">
                            {finish.name}
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                            {finish.sku} · ${finish.unitPrice.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Sliders: Texture relief, stipple & Gloss/Roughness */}
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFD100] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Control de Texturizado &amp; Brillo</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Tiempo Real</span>
                </div>

                {selectedSurface === 'paredes' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Acabado (Mate ↔ Satinado):</span>
                        <span className="font-mono text-[#FFD100] font-black">
                          {wallClearcoat > 0.4 ? 'Satinado Lavable' : 'Mate Sedoso'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={wallClearcoat}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWallClearcoat(val);
                          setWallRoughness(0.7 - val * 0.45);
                        }}
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Relieve Microtextura Rodillo:</span>
                        <span className="font-mono text-[#FFD100] font-black">
                          {(wallBumpScale * 1000).toFixed(0)} mils
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.035"
                        step="0.002"
                        value={wallBumpScale}
                        onChange={(e) => setWallBumpScale(Number(e.target.value))}
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {selectedSurface === 'pisos' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Pulido / Reflejo Superficie:</span>
                        <span className="font-mono text-[#FFD100] font-black">
                          {floorRoughness < 0.2 ? 'Pulido Espejo 95%' : 'Mate Antideslizante'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.65"
                        step="0.02"
                        value={floorRoughness}
                        onChange={(e) => setFloorRoughness(Number(e.target.value))}
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Sellado y Metalicidad:</span>
                        <span className="font-mono text-[#FFD100] font-black">
                          {(floorMetalness * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.3"
                        step="0.02"
                        value={floorMetalness}
                        onChange={(e) => setFloorMetalness(Number(e.target.value))}
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {selectedSurface === 'iluminacion' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Intensidad Lumínica LED:</span>
                      <span className="font-mono text-[#FFD100] font-black">
                        {lightIntensity.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="4.5"
                      step="0.2"
                      value={lightIntensity}
                      onChange={(e) => setLightIntensity(Number(e.target.value))}
                      className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {selectedSurface === 'muebles' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Pulido y Brillo de Mesón:</span>
                      <span className="font-mono text-[#FFD100] font-black">
                        {furnitureRoughness < 0.2 ? 'Pulido Piedra Natural' : 'Satinado Mate'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.06"
                      max="0.6"
                      step="0.02"
                      value={furnitureRoughness}
                      onChange={(e) => setFurnitureRoughness(Number(e.target.value))}
                      className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 4. Scene Lighting Rig Controls (Vista Global · Ambiental · Direccional · Punto) */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFD100] flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5" />
                    <span>4. Luces 3D ({getActiveLightsSummary(modalLightingRig).activeCount}/3 Activas)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const summary = getActiveLightsSummary(modalLightingRig);
                      setModalLightingRig((prev) =>
                        setAllLightsVisibility(prev, !summary.allEnabled)
                      );
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-[#FFD100] cursor-pointer"
                  >
                    {getActiveLightsSummary(modalLightingRig).allEnabled
                      ? 'Apagar Todas'
                      : 'Encender Todas'}
                  </button>
                </div>

                {/* Modal HDRi Environment Selector (Industrial, Almacén, Oficina, Estudio, Exterior) */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#FFD100] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Entorno HDRi Global:</span>
                    </span>
                    <span className="text-[10px] font-mono text-sky-300 font-bold">
                      {
                        (
                          HDRI_ENVIRONMENT_PRESETS[
                            modalLightingRig.hdriPreset || 'industrial'
                          ] || HDRI_ENVIRONMENT_PRESETS.industrial
                        ).kelvin
                      }
                      K
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {HDRI_ENVIRONMENT_LIST.map((env) => {
                      const isSel =
                        (modalLightingRig.hdriPreset || 'industrial') === env.id;
                      return (
                        <button
                          key={env.id}
                          type="button"
                          title={env.description}
                          onClick={() =>
                            setModalLightingRig((prev) =>
                              applyHdriEnvironmentPreset(prev, env.id)
                            )
                          }
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer border transition-all ${
                            isSel
                              ? 'bg-[#FFD100] text-[#0B2861] border-[#FFD100]'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{env.icon}</span>
                          <span className="truncate">{env.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Reflejo HDRi:
                    </span>
                    <input
                      type="range"
                      aria-label="Modal Intensidad Reflejo HDRi"
                      min="0"
                      max="3.0"
                      step="0.05"
                      value={modalLightingRig.envMapIntensity ?? 1.35}
                      onChange={(e) =>
                        setModalLightingRig((prev) => ({
                          ...prev,
                          envMapIntensity: parseFloat(e.target.value),
                        }))
                      }
                      className="w-28 accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-[#FFD100] font-bold">
                      {(modalLightingRig.envMapIntensity ?? 1.35).toFixed(2)}x
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl">
                  {[
                    { id: 'global' as const, label: 'Global' },
                    { id: 'ambiental' as const, label: 'Ambiental' },
                    { id: 'direccional' as const, label: 'Direccional' },
                    { id: 'punto' as const, label: 'Punto' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setModalLightTab(t.id)}
                      className={`py-1.5 px-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                        modalLightTab === t.id
                          ? 'bg-[#FFD100] text-[#0B2861]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {modalLightTab === 'global' && (
                  <div className="space-y-2.5 pt-1">
                    {/* Global Row 1: Ambiental */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white">🌤️ Luz Ambiental</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#FFD100]">
                            {modalLightingRig.ambient.intensity.toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalLightingRig((prev) =>
                                toggleLightVisibility(prev, 'ambient')
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                              modalLightingRig.ambient.enabled
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {modalLightingRig.ambient.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        aria-label="Modal Global Intensidad Ambiental"
                        min="0"
                        max="3.0"
                        step="0.05"
                        disabled={!modalLightingRig.ambient.enabled}
                        value={modalLightingRig.ambient.intensity}
                        onChange={(e) =>
                          setModalLightingRig((prev) => ({
                            ...prev,
                            ambient: { ...prev.ambient, intensity: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Global Row 2: Direccional */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white">☀️ Luz Direccional</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#FFD100]">
                            {modalLightingRig.directional.intensity.toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalLightingRig((prev) =>
                                toggleLightVisibility(prev, 'directional')
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                              modalLightingRig.directional.enabled
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {modalLightingRig.directional.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        aria-label="Modal Global Intensidad Direccional"
                        min="0"
                        max="5.0"
                        step="0.1"
                        disabled={!modalLightingRig.directional.enabled}
                        value={modalLightingRig.directional.intensity}
                        onChange={(e) =>
                          setModalLightingRig((prev) => ({
                            ...prev,
                            directional: {
                              ...prev.directional,
                              intensity: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                          <div key={axis}>
                            <div className="flex justify-between text-[9px]">
                              <span className="text-slate-400 font-bold">{axis}:</span>
                              <span className="font-mono text-sky-400">
                                {modalLightingRig.directional.position[idx].toFixed(1)}m
                              </span>
                            </div>
                            <input
                              type="range"
                              aria-label={`Modal Global Posición ${axis} Direccional`}
                              min={idx === 1 ? '1' : '-15'}
                              max={idx === 1 ? '18' : '15'}
                              step="0.5"
                              disabled={!modalLightingRig.directional.enabled}
                              value={modalLightingRig.directional.position[idx]}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setModalLightingRig((prev) => {
                                  const nextPos: [number, number, number] = [
                                    ...prev.directional.position,
                                  ];
                                  nextPos[idx] = v;
                                  return {
                                    ...prev,
                                    directional: { ...prev.directional, position: nextPos },
                                  };
                                });
                              }}
                              className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Global Row 3: Punto */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white">💡 Luz de Punto</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#FFD100]">
                            {modalLightingRig.point.intensity.toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalLightingRig((prev) =>
                                toggleLightVisibility(prev, 'point')
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                              modalLightingRig.point.enabled
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {modalLightingRig.point.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        aria-label="Modal Global Intensidad Punto"
                        min="0"
                        max="6.0"
                        step="0.1"
                        disabled={!modalLightingRig.point.enabled}
                        value={modalLightingRig.point.intensity}
                        onChange={(e) =>
                          setModalLightingRig((prev) => ({
                            ...prev,
                            point: { ...prev.point, intensity: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                          <div key={axis}>
                            <div className="flex justify-between text-[9px]">
                              <span className="text-slate-400 font-bold">{axis}:</span>
                              <span className="font-mono text-emerald-400">
                                {modalLightingRig.point.position[idx].toFixed(1)}m
                              </span>
                            </div>
                            <input
                              type="range"
                              aria-label={`Modal Global Posición ${axis} Punto`}
                              min={idx === 1 ? '0.5' : '-6'}
                              max={idx === 1 ? '6.5' : '6'}
                              step="0.2"
                              disabled={!modalLightingRig.point.enabled}
                              value={modalLightingRig.point.position[idx]}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setModalLightingRig((prev) => {
                                  const nextPos: [number, number, number] = [
                                    ...prev.point.position,
                                  ];
                                  nextPos[idx] = v;
                                  return {
                                    ...prev,
                                    point: { ...prev.point, position: nextPos },
                                  };
                                });
                              }}
                              className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {modalLightTab === 'ambiental' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Intensidad Ambiental:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#FFD100] font-black">
                          {modalLightingRig.ambient.intensity.toFixed(2)}x
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalLightingRig((prev) =>
                              toggleLightVisibility(prev, 'ambient')
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                            modalLightingRig.ambient.enabled
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {modalLightingRig.ambient.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      aria-label="Modal Intensidad Luz Ambiental"
                      min="0"
                      max="3.0"
                      step="0.05"
                      disabled={!modalLightingRig.ambient.enabled}
                      value={modalLightingRig.ambient.intensity}
                      onChange={(e) =>
                        setModalLightingRig((prev) => ({
                          ...prev,
                          ambient: { ...prev.ambient, intensity: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {modalLightTab === 'direccional' && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Intensidad Direccional:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#FFD100] font-black">
                            {modalLightingRig.directional.intensity.toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalLightingRig((prev) =>
                                toggleLightVisibility(prev, 'directional')
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                              modalLightingRig.directional.enabled
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {modalLightingRig.directional.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        aria-label="Modal Intensidad Luz Direccional"
                        min="0"
                        max="5.0"
                        step="0.1"
                        disabled={!modalLightingRig.directional.enabled}
                        value={modalLightingRig.directional.intensity}
                        onChange={(e) =>
                          setModalLightingRig((prev) => ({
                            ...prev,
                            directional: {
                              ...prev.directional,
                              intensity: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                        <div key={axis}>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-bold">Pos {axis}:</span>
                            <span className="font-mono text-sky-400">
                              {modalLightingRig.directional.position[idx].toFixed(1)}m
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label={`Modal Posición ${axis} Luz Direccional`}
                            min={idx === 1 ? '1' : '-15'}
                            max={idx === 1 ? '18' : '15'}
                            step="0.5"
                            value={modalLightingRig.directional.position[idx]}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              setModalLightingRig((prev) => {
                                const nextPos: [number, number, number] = [
                                  ...prev.directional.position,
                                ];
                                nextPos[idx] = v;
                                return {
                                  ...prev,
                                  directional: { ...prev.directional, position: nextPos },
                                };
                              });
                            }}
                            className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modalLightTab === 'punto' && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Intensidad Luz de Punto:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#FFD100] font-black">
                            {modalLightingRig.point.intensity.toFixed(2)}x
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setModalLightingRig((prev) =>
                                toggleLightVisibility(prev, 'point')
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
                              modalLightingRig.point.enabled
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {modalLightingRig.point.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        aria-label="Modal Intensidad Luz de Punto"
                        min="0"
                        max="6.0"
                        step="0.1"
                        disabled={!modalLightingRig.point.enabled}
                        value={modalLightingRig.point.intensity}
                        onChange={(e) =>
                          setModalLightingRig((prev) => ({
                            ...prev,
                            point: { ...prev.point, intensity: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full accent-[#FFD100] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                        <div key={axis}>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-bold">Pos {axis}:</span>
                            <span className="font-mono text-emerald-400">
                              {modalLightingRig.point.position[idx].toFixed(1)}m
                            </span>
                          </div>
                          <input
                            type="range"
                            aria-label={`Modal Posición ${axis} Luz de Punto`}
                            min={idx === 1 ? '0.5' : '-6'}
                            max={idx === 1 ? '6.5' : '6'}
                            step="0.2"
                            value={modalLightingRig.point.position[idx]}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              setModalLightingRig((prev) => {
                                const nextPos: [number, number, number] = [
                                  ...prev.point.position,
                                ];
                                nextPos[idx] = v;
                                return {
                                  ...prev,
                                  point: { ...prev.point, position: nextPos },
                                };
                              });
                            }}
                            className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Product E-Commerce Card */}
              <div className="p-4 rounded-2xl bg-white text-slate-900 shadow-xl space-y-3 border-2 border-[#FFD100]">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      currentActiveFinish.company === 'induless'
                        ? 'bg-[#D8235A] text-white'
                        : 'bg-[#0B2861] text-[#FFD100]'
                    }`}
                  >
                    {currentActiveFinish.company === 'induless' ? 'INDULESS' : 'INDUSTRIAL LATINA'}
                  </span>
                  <span className="font-mono text-xs font-black text-slate-600">
                    CÓD: {currentActiveFinish.sku}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {currentActiveFinish.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {currentActiveFinish.description}
                  </p>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Precio Oficial:</span>
                  <strong className="text-lg font-mono font-black text-[#0B2861]">
                    ${currentActiveFinish.unitPrice.toFixed(2)} USD / {currentActiveFinish.unit}
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (matchedInventoryProduct) {
                        onAddToCart(matchedInventoryProduct, 1);
                        showToast(`¡${matchedInventoryProduct.name} añadido al carrito!`);
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-[#FFD100]" />
                    <span>Añadir Unidad</span>
                  </button>

                  {onInspectProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        if (matchedInventoryProduct) {
                          onInspectProduct(matchedInventoryProduct);
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <span>Ficha Técnica</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom 1-Click Environment Purchase */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 sticky bottom-0 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const itemsToAdd: { item: InventoryItem; quantity: number }[] = [];
                  (currentEnv.materialsBreakdown || []).forEach((cat) => {
                    cat.items.forEach((it) => {
                      const found = inventory.find((inv) => inv.sku === it.sku);
                      if (found) {
                        itemsToAdd.push({ item: found, quantity: it.neededQuantity });
                      }
                    });
                  });

                  if (itemsToAdd.length > 0 && onAddCombinationToCart) {
                    onAddCombinationToCart(itemsToAdd);
                    showToast(`¡Ambiente completo (${itemsToAdd.length} productos) añadido al carrito!`);
                  } else if (matchedInventoryProduct) {
                    onAddToCart(matchedInventoryProduct, 2);
                    showToast('Materiales del ambiente añadidos al carrito.');
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FFD100] via-yellow-400 to-[#FFD100] hover:brightness-105 text-[#0B2861] font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Añadir Ambiente Completo al Carrito</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Bottom Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#0B2861] text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#FFD100] text-xs font-bold flex items-center gap-2 animate-bounce-subtle">
          <Sparkles className="w-4 h-4 text-[#FFD100]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
