import * as THREE from 'three';
import { InteractiveSurfaceTarget } from '../Modal3dEnvironmentViewer';
import {
  HDRI_ENVIRONMENT_PRESETS,
  HdriEnvironmentPresetId,
} from '../../utils/lightingRigConfig';

export interface DioramaBuildResult {
  rootGroup: THREE.Group;
  wallMeshes: THREE.Mesh[];
  floorMeshes: THREE.Mesh[];
  lightMeshes: THREE.Mesh[];
  lightObjects: (THREE.Light | THREE.SpotLight | THREE.PointLight)[];
  mesonMeshes: THREE.Mesh[];
  interactiveMap: Map<THREE.Object3D, InteractiveSurfaceTarget>;
}

// -----------------------------------------------------------------------------
// HIGH-RESOLUTION PROCEDURAL TEXTURES (1024x1024)
// -----------------------------------------------------------------------------

export function createHighResWoodTexture(woodHex: string = '#A16207'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = woodHex;
    ctx.fillRect(0, 0, 1024, 1024);

    // Plank lines (horizontal planks)
    const plankHeight = 128;
    for (let y = 0; y < 1024; y += plankHeight) {
      // Slight tone shift per plank
      const toneShift = (Math.random() - 0.5) * 20;
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, toneShift / 100)})`;
      ctx.fillRect(0, y, 1024, plankHeight);

      // Plank seam groove
      ctx.fillStyle = 'rgba(20, 10, 5, 0.45)';
      ctx.fillRect(0, y - 2, 1024, 4);

      // Wood grain lines
      for (let i = 0; i < 28; i++) {
        const lineY = y + Math.random() * plankHeight;
        const alpha = 0.04 + Math.random() * 0.08;
        ctx.fillStyle = `rgba(30, 15, 5, ${alpha})`;
        ctx.fillRect(0, lineY, 1024, 1 + Math.random() * 2.5);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createHighResTileTexture(tileHex: string = '#E2E8F0', groutHex: string = '#F8FAFC'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = groutHex;
    ctx.fillRect(0, 0, 1024, 1024);

    const tileSize = 256;
    const gap = 10;
    ctx.fillStyle = tileHex;

    for (let x = 0; x < 1024; x += tileSize) {
      for (let y = 0; y < 1024; y += tileSize) {
        ctx.fillStyle = tileHex;
        ctx.fillRect(x + gap / 2, y + gap / 2, tileSize - gap, tileSize - gap);

        // Subtle porcelain marble / cloud variation
        const alpha = 0.03 + Math.random() * 0.04;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(x + gap / 2, y + gap / 2, tileSize - gap, 28);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function createHighResPaintStippleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 1024, 1024);
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const rollerNoise = (Math.random() - 0.5) * 60;
      const microNoise = (Math.random() - 0.5) * 22;
      const v = Math.min(255, Math.max(0, 128 + rollerNoise + microNoise));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  return tex;
}

export function createHighResEpoxyTexture(baseHex: string = '#475569'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Industrial base
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle aggregate speckles
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const c = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 2, 2);
    }

    // Yellow safety striping along edge
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(0, 940, 1024, 28);
    ctx.fillRect(940, 0, 28, 1024);

    // Black diagonal stripes on the safety line
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 10;
    for (let i = -1024; i < 2048; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 940);
      ctx.lineTo(i + 28, 968);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createHighResCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, 1024, 1024);

    const stoneW = 120;
    const stoneH = 64;
    const gap = 8;
    for (let y = 0; y < 1024; y += stoneH) {
      const offset = (y / stoneH) % 2 === 0 ? 0 : stoneW / 2;
      for (let x = -offset; x < 1024; x += stoneW) {
        const val = 100 + Math.floor(Math.random() * 45);
        ctx.fillStyle = `rgb(${val}, ${val + 4}, ${val + 8})`;
        ctx.fillRect(x + gap / 2, y + gap / 2, stoneW - gap, stoneH - gap);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

// -----------------------------------------------------------------------------
// BASE SLAB GENERATOR (Isometric corner cutout platform)
// -----------------------------------------------------------------------------

export function createDioramaBase(
  sizeX: number = 6.4,
  sizeZ: number = 6.4,
  slabThickness: number = 0.4
): { baseGroup: THREE.Group; slabMesh: THREE.Mesh } {
  const group = new THREE.Group();

  // Dark pedestal beneath
  const pedestalGeo = new THREE.BoxGeometry(sizeX + 0.2, 0.25, sizeZ + 0.2);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
    metalness: 0.1,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, -slabThickness - 0.125, 0);
  pedestal.receiveShadow = true;
  group.add(pedestal);

  // Main floor slab with thickness
  const slabGeo = new THREE.BoxGeometry(sizeX, slabThickness, sizeZ);
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
  });
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.set(0, -slabThickness / 2, 0);
  slab.receiveShadow = true;
  group.add(slab);

  return { baseGroup: group, slabMesh: slab };
}

// -----------------------------------------------------------------------------
// 1. SALA DE ESTAR VANGUARDISTA
// -----------------------------------------------------------------------------
export function buildLivingRoomDiorama(
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  mesonMat: THREE.Material,
  ledMat: THREE.Material
): DioramaBuildResult {
  const root = new THREE.Group();
  const wallMeshes: THREE.Mesh[] = [];
  const floorMeshes: THREE.Mesh[] = [];
  const lightMeshes: THREE.Mesh[] = [];
  const lightObjects: THREE.Light[] = [];
  const mesonMeshes: THREE.Mesh[] = [];
  const interactiveMap = new Map<THREE.Object3D, InteractiveSurfaceTarget>();

  const size = 6.4;
  const wallH = 4.0;
  const wallThick = 0.32;
  const wainscotH = 1.35;

  // 1. Floor
  const { baseGroup } = createDioramaBase(size, size, 0.4);
  root.add(baseGroup);

  const floorPlaneGeo = new THREE.BoxGeometry(size, 0.04, size);
  const floorMesh = new THREE.Mesh(floorPlaneGeo, floorMat);
  floorMesh.position.set(0, 0.02, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData = { target: 'pisos', label: 'Piso de Madera Roble (Industrial Latina & Induless)' };
  interactiveMap.set(floorMesh, 'pisos');
  floorMeshes.push(floorMesh);
  root.add(floorMesh);

  // 2. Walls (Left Wall along Z, Back Wall along X)
  // Left wall upper (paintable)
  const leftUpperGeo = new THREE.BoxGeometry(wallThick, wallH - wainscotH, size);
  const leftUpper = new THREE.Mesh(leftUpperGeo, wallMat);
  leftUpper.position.set(-size / 2 + wallThick / 2, wainscotH + (wallH - wainscotH) / 2, 0);
  leftUpper.castShadow = true;
  leftUpper.receiveShadow = true;
  leftUpper.userData = { target: 'paredes', label: 'Muro Superior Pintable (Industrial Latina)' };
  interactiveMap.set(leftUpper, 'paredes');
  wallMeshes.push(leftUpper);
  root.add(leftUpper);

  // Back wall upper (paintable)
  const backUpperGeo = new THREE.BoxGeometry(size, wallH - wainscotH, wallThick);
  const backUpper = new THREE.Mesh(backUpperGeo, wallMat);
  backUpper.position.set(0, wainscotH + (wallH - wainscotH) / 2, -size / 2 + wallThick / 2);
  backUpper.castShadow = true;
  backUpper.receiveShadow = true;
  backUpper.userData = { target: 'paredes', label: 'Muro Frontal Pintable (Industrial Latina)' };
  interactiveMap.set(backUpper, 'paredes');
  wallMeshes.push(backUpper);
  root.add(backUpper);

  // Wainscoting (Lower half vertical wood slats)
  const wainscotMat = new THREE.MeshStandardMaterial({
    color: 0x9a7b56,
    roughness: 0.45,
    metalness: 0.05,
  });

  const leftWainscot = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick + 0.02, wainscotH, size),
    wainscotMat
  );
  leftWainscot.position.set(-size / 2 + wallThick / 2, wainscotH / 2, 0);
  leftWainscot.receiveShadow = true;
  root.add(leftWainscot);

  const backWainscot = new THREE.Mesh(
    new THREE.BoxGeometry(size, wainscotH, wallThick + 0.02),
    wainscotMat
  );
  backWainscot.position.set(0, wainscotH / 2, -size / 2 + wallThick / 2);
  backWainscot.receiveShadow = true;
  root.add(backWainscot);

  // Top molding rails for wainscoting
  const railMat = new THREE.MeshStandardMaterial({ color: 0x785632, roughness: 0.3 });
  const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, size), railMat);
  railLeft.position.set(-size / 2 + wallThick + 0.01, wainscotH, 0);
  root.add(railLeft);

  const railBack = new THREE.Mesh(new THREE.BoxGeometry(size, 0.05, 0.06), railMat);
  railBack.position.set(0, wainscotH, -size / 2 + wallThick + 0.01);
  root.add(railBack);

  // 3. Left Wall Large Window with Horizontal Blinds & Curtains
  const windowGroup = new THREE.Group();
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
    transmission: 0.9,
    roughness: 0.05,
  });

  const windowW = 2.6;
  const windowH = 2.1;
  const windowZ = -0.4;
  const windowY = 2.2;

  // Window frame & sill (alféizar)
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, windowW + 0.3), railMat);
  sill.position.set(-size / 2 + wallThick + 0.08, windowY - windowH / 2 - 0.04, windowZ);
  windowGroup.add(sill);

  const glassPane = new THREE.Mesh(new THREE.BoxGeometry(0.02, windowH, windowW), glassMat);
  glassPane.position.set(-size / 2 + wallThick / 2, windowY, windowZ);
  windowGroup.add(glassPane);

  // Horizontal blinds (persianas)
  const blindMat = new THREE.MeshStandardMaterial({ color: 0xede8df, roughness: 0.4 });
  for (let b = 0; b < 16; b++) {
    const blind = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, windowW - 0.1), blindMat);
    blind.position.set(-size / 2 + wallThick + 0.04, windowY - windowH / 2 + 0.12 * b + 0.1, windowZ);
    blind.rotation.z = 0.25;
    windowGroup.add(blind);
  }

  // Curtains on left & right
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xfaf5ee,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const curtainL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.45), curtainMat);
  curtainL.position.set(-size / 2 + wallThick + 0.08, 1.8, windowZ - windowW / 2 + 0.2);
  curtainL.castShadow = true;
  windowGroup.add(curtainL);

  const curtainR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.45), curtainMat);
  curtainR.position.set(-size / 2 + wallThick + 0.08, 1.8, windowZ + windowW / 2 - 0.2);
  curtainR.castShadow = true;
  windowGroup.add(curtainR);

  // Curtain rod & Fairy Lights Garland (Guirnalda de luces)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, windowW + 0.8, 16), windowFrameMat);
  rod.rotation.x = Math.PI / 2;
  rod.position.set(-size / 2 + wallThick + 0.09, windowY + windowH / 2 + 0.2, windowZ);
  windowGroup.add(rod);

  // Garland glowing spheres
  for (let i = 0; i < 9; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), ledMat);
    const sag = Math.sin((i / 8) * Math.PI) * 0.18;
    const bulbZ = windowZ - windowW / 2 + 0.25 + (i * (windowW - 0.5)) / 8;
    bulb.position.set(-size / 2 + wallThick + 0.1, windowY + windowH / 2 + 0.14 - sag, bulbZ);
    bulb.userData = { target: 'iluminacion', label: 'Guirnalda de Luces LED Induless' };
    interactiveMap.set(bulb, 'iluminacion');
    lightMeshes.push(bulb);
    windowGroup.add(bulb);
  }
  root.add(windowGroup);

  // 4. Detailed Sofa (Structure, base, cushions)
  const sofaGroup = new THREE.Group();
  const sofaBaseMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.6 });
  const sofaFabricMat = new THREE.MeshStandardMaterial({ color: 0x7c4a2d, roughness: 0.75 }); // Rich cognac leather/fabric
  const pillowMat1 = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 }); // Mustard
  const pillowMat2 = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.8 }); // Teal/Green

  // Sofa base plinth
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 1.1), sofaBaseMat);
  sofaBase.position.set(0.2, 0.12, -2.2);
  sofaBase.castShadow = true;
  sofaGroup.add(sofaBase);

  // Main seat cushion
  const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.35, 1.0), sofaFabricMat);
  sofaSeat.position.set(0.2, 0.35, -2.2);
  sofaSeat.castShadow = true;
  sofaSeat.receiveShadow = true;
  sofaGroup.add(sofaSeat);

  // Sofa backrest
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.65, 0.28), sofaFabricMat);
  sofaBack.position.set(0.2, 0.72, -2.62);
  sofaBack.castShadow = true;
  sofaGroup.add(sofaBack);

  // Armrests
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 1.05), sofaFabricMat);
  armL.position.set(-1.1, 0.52, -2.2);
  armL.castShadow = true;
  sofaGroup.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 1.05), sofaFabricMat);
  armR.position.set(1.5, 0.52, -2.2);
  armR.castShadow = true;
  sofaGroup.add(armR);

  // Accent pillows
  const pil1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), pillowMat1);
  pil1.position.set(-0.7, 0.65, -2.35);
  pil1.rotation.y = 0.2;
  sofaGroup.add(pil1);

  const pil2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.12), pillowMat2);
  pil2.position.set(1.1, 0.65, -2.35);
  pil2.rotation.y = -0.2;
  sofaGroup.add(pil2);

  root.add(sofaGroup);

  // 5. Side Tables
  // Left: Metal C-table
  const sideTableL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.45), mesonMat);
  sideTableL.position.set(-1.45, 0.28, -2.15);
  sideTableL.castShadow = true;
  sideTableL.userData = { target: 'muebles', label: 'Mesa Lateral Negra Induless' };
  interactiveMap.set(sideTableL, 'muebles');
  mesonMeshes.push(sideTableL);
  root.add(sideTableL);

  // Right: Cylindrical wooden stool / table
  const sideTableR = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.48, 24), railMat);
  sideTableR.position.set(1.9, 0.24, -2.0);
  sideTableR.castShadow = true;
  root.add(sideTableR);

  // 6. Center Coffee Table with Metal Legs & Books
  const coffeeTableGroup = new THREE.Group();
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.75), mesonMat);
  tableTop.position.set(0.15, 0.45, -0.7);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableTop.userData = { target: 'muebles', label: 'Cubierta Mesa de Centro (Mesón)' };
  interactiveMap.set(tableTop, 'muebles');
  mesonMeshes.push(tableTop);
  coffeeTableGroup.add(tableTop);

  // 4 Black metal legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
  [
    [-0.55, -0.28],
    [0.55, -0.28],
    [-0.55, 0.28],
    [0.55, 0.28],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.44, 12), legMat);
    leg.position.set(0.15 + lx, 0.22, -0.7 + lz);
    leg.castShadow = true;
    coffeeTableGroup.add(leg);
  });

  // Books on coffee table
  const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.22), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
  book1.position.set(0.0, 0.51, -0.7);
  coffeeTableGroup.add(book1);

  const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.2), new THREE.MeshStandardMaterial({ color: 0xe11d48 }));
  book2.position.set(0.02, 0.54, -0.7);
  book2.rotation.y = 0.25;
  coffeeTableGroup.add(book2);

  // Small potted succulent
  const plantCup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  plantCup.position.set(0.5, 0.54, -0.65);
  coffeeTableGroup.add(plantCup);
  root.add(coffeeTableGroup);

  // Low upholstered ottoman / footstool
  const stool = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.42), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 }));
  stool.position.set(0.15, 0.14, 0.1);
  stool.castShadow = true;
  root.add(stool);

  // 7. Wall Shelves, Tall White Bookcase & Clock on Back Wall
  // Floating box shelves above sofa
  const shelfWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const boxShelf1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.22), shelfWhiteMat);
  boxShelf1.position.set(-0.6, 2.7, -size / 2 + wallThick + 0.1);
  root.add(boxShelf1);

  const boxShelf2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.22), shelfWhiteMat);
  boxShelf2.position.set(0.3, 2.5, -size / 2 + wallThick + 0.1);
  root.add(boxShelf2);

  // Tall vertical white bookcase on the right
  const bookcase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.6, 0.32), shelfWhiteMat);
  bookcase.position.set(2.4, 1.3, -size / 2 + wallThick + 0.15);
  bookcase.castShadow = true;
  root.add(bookcase);

  // Circular clock on the right wall
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 }));
  clock.rotation.x = Math.PI / 2;
  clock.position.set(1.7, 2.6, -size / 2 + wallThick + 0.03);
  root.add(clock);

  // 8. Potted Monstera / Ficus Plant in Terracotta Pot
  const plantGroup = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.18, 0.48, 20),
    new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 })
  );
  pot.position.set(-2.0, 0.24, 0.9);
  pot.castShadow = true;
  plantGroup.add(pot);

  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  for (let l = 0; l < 8; l++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), foliageMat);
    leaf.scale.set(1.4, 0.2, 0.8);
    const angle = (l / 8) * Math.PI * 2;
    leaf.position.set(-2.0 + Math.cos(angle) * 0.25, 0.55 + Math.sin(l) * 0.12, 0.9 + Math.sin(angle) * 0.25);
    leaf.rotation.z = Math.cos(angle) * 0.4;
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  root.add(plantGroup);

  // 9. Corner console table in far left corner
  const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.9), mesonMat);
  consoleTable.position.set(-size / 2 + wallThick + 0.3, 0.38, 2.1);
  consoleTable.castShadow = true;
  consoleTable.userData = { target: 'muebles', label: 'Consola Esquinera de Madera' };
  interactiveMap.set(consoleTable, 'muebles');
  mesonMeshes.push(consoleTable);
  root.add(consoleTable);

  return {
    rootGroup: root,
    wallMeshes,
    floorMeshes,
    lightMeshes,
    lightObjects,
    mesonMeshes,
    interactiveMap,
  };
}

// -----------------------------------------------------------------------------
// 2. COCINA GOURMET
// -----------------------------------------------------------------------------
export function buildKitchenDiorama(
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  mesonMat: THREE.Material,
  ledMat: THREE.Material
): DioramaBuildResult {
  const root = new THREE.Group();
  const wallMeshes: THREE.Mesh[] = [];
  const floorMeshes: THREE.Mesh[] = [];
  const lightMeshes: THREE.Mesh[] = [];
  const lightObjects: THREE.Light[] = [];
  const mesonMeshes: THREE.Mesh[] = [];
  const interactiveMap = new Map<THREE.Object3D, InteractiveSurfaceTarget>();

  const size = 6.4;
  const wallH = 4.0;
  const wallThick = 0.32;

  // Base & Floor
  const { baseGroup } = createDioramaBase(size, size, 0.4);
  root.add(baseGroup);

  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.04, size), floorMat);
  floorMesh.position.set(0, 0.02, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData = { target: 'pisos', label: 'Piso Porcelanato Gran Formato (Industrial Latina)' };
  interactiveMap.set(floorMesh, 'pisos');
  floorMeshes.push(floorMesh);
  root.add(floorMesh);

  // Back Wall (Paintable upper + tiled backsplash lower)
  const backUpper = new THREE.Mesh(new THREE.BoxGeometry(size, 2.0, wallThick), wallMat);
  backUpper.position.set(0, 3.0, -size / 2 + wallThick / 2);
  backUpper.castShadow = true;
  backUpper.receiveShadow = true;
  backUpper.userData = { target: 'paredes', label: 'Muro Superior de Cocina (Industrial Latina)' };
  interactiveMap.set(backUpper, 'paredes');
  wallMeshes.push(backUpper);
  root.add(backUpper);

  // Left Wall with natural window
  const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, size), wallMat);
  leftUpper.position.set(-size / 2 + wallThick / 2, wallH / 2, 0);
  leftUpper.castShadow = true;
  leftUpper.receiveShadow = true;
  leftUpper.userData = { target: 'paredes', label: 'Muro Lateral Cocina' };
  interactiveMap.set(leftUpper, 'paredes');
  wallMeshes.push(leftUpper);
  root.add(leftUpper);

  // Backsplash
  const tileTex = createHighResTileTexture('#F1F5F9', '#CBD5E1');
  const backsplashMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.25 });
  const backsplash = new THREE.Mesh(new THREE.BoxGeometry(size, 1.2, 0.06), backsplashMat);
  backsplash.position.set(0, 1.4, -size / 2 + wallThick + 0.03);
  root.add(backsplash);

  // Back Lower Cabinets
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
  const lowerCabs = new THREE.Mesh(new THREE.BoxGeometry(size - 1.2, 0.85, 0.75), cabinetMat);
  lowerCabs.position.set(0.6, 0.425, -size / 2 + wallThick + 0.38);
  lowerCabs.castShadow = true;
  lowerCabs.receiveShadow = true;
  root.add(lowerCabs);

  // Main Countertop (Mesón de fondo)
  const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(size - 1.15, 0.08, 0.82), mesonMat);
  mainCounter.position.set(0.6, 0.89, -size / 2 + wallThick + 0.41);
  mainCounter.castShadow = true;
  mainCounter.receiveShadow = true;
  mainCounter.userData = { target: 'muebles', label: 'Encimera Principal de Cuarzo (Mesón)' };
  interactiveMap.set(mainCounter, 'muebles');
  mesonMeshes.push(mainCounter);
  root.add(mainCounter);

  // Upper Modular Cabinets with Under-Cabinet LED Strip
  const upperCabs = new THREE.Mesh(new THREE.BoxGeometry(size - 1.6, 0.85, 0.42), cabinetMat);
  upperCabs.position.set(0.8, 2.45, -size / 2 + wallThick + 0.21);
  upperCabs.castShadow = true;
  root.add(upperCabs);

  // Under-cabinet LED Strip
  const underCabinetLed = new THREE.Mesh(new THREE.BoxGeometry(size - 1.65, 0.03, 0.06), ledMat);
  underCabinetLed.position.set(0.8, 2.01, -size / 2 + wallThick + 0.21);
  underCabinetLed.userData = { target: 'iluminacion', label: 'Tira LED Bajo Alacena Induless' };
  interactiveMap.set(underCabinetLed, 'iluminacion');
  lightMeshes.push(underCabinetLed);
  root.add(underCabinetLed);

  // Modern Range Hood (Campana extractora de acero inox)
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.45), hoodMat);
  hood.position.set(0.3, 2.3, -size / 2 + wallThick + 0.26);
  root.add(hood);

  // Stainless Steel Double-Door Refrigerator on Right
  const fridgeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.8), fridgeMat);
  fridge.position.set(-size / 2 + wallThick + 0.6, 1.05, -size / 2 + wallThick + 0.45);
  fridge.castShadow = true;
  root.add(fridge);

  // Stainless Steel Undermount Sink & Curved Gooseneck Faucet
  const sinkMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.15 });
  const sink = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.45), sinkMat);
  sink.position.set(1.4, 0.935, -size / 2 + wallThick + 0.41);
  root.add(sink);

  const faucetCurve = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 16), sinkMat);
  faucetCurve.position.set(1.4, 1.15, -size / 2 + wallThick + 0.2);
  root.add(faucetCurve);

  // ---------------------------------------------------------------------------
  // Central Kitchen Island with Waterfall Quartz Edge
  // ---------------------------------------------------------------------------
  const islandGroup = new THREE.Group();
  const islandW = 2.4;
  const islandH = 0.95;
  const islandD = 1.15;
  const islandPos = new THREE.Vector3(0.1, 0, 0.4);

  // Island Body
  const islandBody = new THREE.Mesh(new THREE.BoxGeometry(islandW - 0.2, islandH - 0.08, islandD - 0.15), cabinetMat);
  islandBody.position.set(islandPos.x, (islandH - 0.08) / 2, islandPos.z);
  islandBody.castShadow = true;
  islandBody.receiveShadow = true;
  islandGroup.add(islandBody);

  // Waterfall Top
  const islandTop = new THREE.Mesh(new THREE.BoxGeometry(islandW, 0.08, islandD), mesonMat);
  islandTop.position.set(islandPos.x, islandH - 0.04, islandPos.z);
  islandTop.castShadow = true;
  islandTop.receiveShadow = true;
  islandTop.userData = { target: 'muebles', label: 'Isla Central Cuarzo Cascada (Mesón)' };
  interactiveMap.set(islandTop, 'muebles');
  mesonMeshes.push(islandTop);
  islandGroup.add(islandTop);

  // Left Waterfall side panel
  const waterfallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, islandH, islandD), mesonMat);
  waterfallLeft.position.set(islandPos.x - islandW / 2 + 0.04, islandH / 2, islandPos.z);
  waterfallLeft.castShadow = true;
  waterfallLeft.userData = { target: 'muebles', label: 'Cascada de Cuarzo Lateral' };
  interactiveMap.set(waterfallLeft, 'muebles');
  mesonMeshes.push(waterfallLeft);
  islandGroup.add(waterfallLeft);

  // 2 Bar Stools with Footrest
  const stoolMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 });
  const stoolLegMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });

  [-0.45, 0.45].forEach((sx) => {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24), stoolMat);
    seat.position.set(islandPos.x + sx, 0.65, islandPos.z + 0.85);
    seat.castShadow = true;
    islandGroup.add(seat);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 12), stoolLegMat);
    leg.position.set(islandPos.x + sx, 0.31, islandPos.z + 0.85);
    leg.castShadow = true;
    islandGroup.add(leg);
  });

  root.add(islandGroup);

  // 2 Glass Pendant Lights over Island
  [-0.5, 0.5].forEach((lx) => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8), stoolLegMat);
    cord.position.set(islandPos.x + lx, 3.4, islandPos.z);
    root.add(cord);

    const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 20), ledMat);
    pendant.position.set(islandPos.x + lx, 2.7, islandPos.z);
    pendant.userData = { target: 'iluminacion', label: 'Lámpara Colgante LED Induless' };
    interactiveMap.set(pendant, 'iluminacion');
    lightMeshes.push(pendant);
    root.add(pendant);
  });

  return {
    rootGroup: root,
    wallMeshes,
    floorMeshes,
    lightMeshes,
    lightObjects,
    mesonMeshes,
    interactiveMap,
  };
}

// -----------------------------------------------------------------------------
// 3. MASTER SUITE CONTEMPORÁNEA
// -----------------------------------------------------------------------------
export function buildBedroomDiorama(
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  mesonMat: THREE.Material,
  ledMat: THREE.Material
): DioramaBuildResult {
  const root = new THREE.Group();
  const wallMeshes: THREE.Mesh[] = [];
  const floorMeshes: THREE.Mesh[] = [];
  const lightMeshes: THREE.Mesh[] = [];
  const lightObjects: THREE.Light[] = [];
  const mesonMeshes: THREE.Mesh[] = [];
  const interactiveMap = new Map<THREE.Object3D, InteractiveSurfaceTarget>();

  const size = 6.4;
  const wallH = 4.0;
  const wallThick = 0.32;

  // Base & Floor
  const { baseGroup } = createDioramaBase(size, size, 0.4);
  root.add(baseGroup);

  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.04, size), floorMat);
  floorMesh.position.set(0, 0.02, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData = { target: 'pisos', label: 'Piso de Madera Duelas Cálidas' };
  interactiveMap.set(floorMesh, 'pisos');
  floorMeshes.push(floorMesh);
  root.add(floorMesh);

  // Woven Area Rug Under Bed
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 3.4), rugMat);
  rug.position.set(0.1, 0.05, -0.9);
  rug.receiveShadow = true;
  root.add(rug);

  // Back Wall (Paintable)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(size, wallH, wallThick), wallMat);
  backWall.position.set(0, wallH / 2, -size / 2 + wallThick / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  backWall.userData = { target: 'paredes', label: 'Muro Cabecero Suite (Industrial Latina)' };
  interactiveMap.set(backWall, 'paredes');
  wallMeshes.push(backWall);
  root.add(backWall);

  // Left Wall (Paintable)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, size), wallMat);
  leftWall.position.set(-size / 2 + wallThick / 2, wallH / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  leftWall.userData = { target: 'paredes', label: 'Muro Lateral Dormitorio' };
  interactiveMap.set(leftWall, 'paredes');
  wallMeshes.push(leftWall);
  root.add(leftWall);

  // Flanking Acoustic Wood Slat Panels on Back Wall
  const acousticMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
  [-2.2, 2.2].forEach((px) => {
    const acousticPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 0.08), acousticMat);
    acousticPanel.position.set(px, 1.8, -size / 2 + wallThick + 0.04);
    acousticPanel.castShadow = true;
    root.add(acousticPanel);
  });

  // LED Halo backlight strip behind Headboard
  const headboardLed = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.04), ledMat);
  headboardLed.position.set(0.1, 1.82, -size / 2 + wallThick + 0.06);
  headboardLed.userData = { target: 'iluminacion', label: 'Retroiluminación LED Cabecero' };
  interactiveMap.set(headboardLed, 'iluminacion');
  lightMeshes.push(headboardLed);
  root.add(headboardLed);

  // King Size Bed
  const bedGroup = new THREE.Group();
  const bedUpholsteryMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
  const duvetMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

  // Padded block headboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 0.25), bedUpholsteryMat);
  headboard.position.set(0.1, 0.9, -size / 2 + wallThick + 0.15);
  headboard.castShadow = true;
  bedGroup.add(headboard);

  // Bed Base frame
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 2.5), bedUpholsteryMat);
  bedBase.position.set(0.1, 0.22, -1.3);
  bedBase.castShadow = true;
  bedBase.receiveShadow = true;
  bedGroup.add(bedBase);

  // Mattress
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.32, 2.3), sheetMat);
  mattress.position.set(0.1, 0.52, -1.3);
  mattress.castShadow = true;
  bedGroup.add(mattress);

  // Folded duvet quilt
  const duvet = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.14, 1.4), duvetMat);
  duvet.position.set(0.1, 0.65, -0.8);
  duvet.castShadow = true;
  bedGroup.add(duvet);

  // 4 Pillows
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  [-0.5, 0.5].forEach((px) => {
    const pilA = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.38), pillowMat);
    pilA.position.set(0.1 + px, 0.72, -2.1);
    bedGroup.add(pilA);

    const pilB = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.32), duvetMat);
    pilB.position.set(0.1 + px, 0.78, -1.8);
    pilB.rotation.x = 0.3;
    bedGroup.add(pilB);
  });

  // End-of-bed upholstered bench (banquito pie de cama)
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.38, 0.45), bedUpholsteryMat);
  bench.position.set(0.1, 0.24, 0.25);
  bench.castShadow = true;
  bedGroup.add(bench);
  root.add(bedGroup);

  // Floating Nightstands with Reading Lamps
  [-1.55, 1.75].forEach((nx) => {
    const nstand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.4, 0.42), mesonMat);
    nstand.position.set(nx, 0.55, -size / 2 + wallThick + 0.25);
    nstand.castShadow = true;
    nstand.userData = { target: 'muebles', label: 'Mesa de Noche de Lujo (Mesón)' };
    interactiveMap.set(nstand, 'muebles');
    mesonMeshes.push(nstand);
    root.add(nstand);

    // Warm table lamp
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 }));
    lampBase.position.set(nx, 0.88, -size / 2 + wallThick + 0.25);
    root.add(lampBase);

    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 16), ledMat);
    lampShade.position.set(nx, 1.08, -size / 2 + wallThick + 0.25);
    lampShade.userData = { target: 'iluminacion', label: 'Lámpara de Lectura Cálida Induless' };
    interactiveMap.set(lampShade, 'iluminacion');
    lightMeshes.push(lampShade);
    root.add(lampShade);
  });

  // Right Side Modern Dresser with Circular Mirror
  const dresser = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 1.4), mesonMat);
  dresser.position.set(2.4, 0.425, 1.2);
  dresser.castShadow = true;
  dresser.userData = { target: 'muebles', label: 'Cómoda de Dormitorio (Mesón)' };
  interactiveMap.set(dresser, 'muebles');
  mesonMeshes.push(dresser);
  root.add(dresser);

  const mirrorCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.05 }));
  mirrorCircle.rotation.x = Math.PI / 2;
  mirrorCircle.position.set(2.4, 1.5, 1.2);
  root.add(mirrorCircle);

  return {
    rootGroup: root,
    wallMeshes,
    floorMeshes,
    lightMeshes,
    lightObjects,
    mesonMeshes,
    interactiveMap,
  };
}

// -----------------------------------------------------------------------------
// 4. BAÑO DE LUJO ESTILO SPA
// -----------------------------------------------------------------------------
export function buildBathroomDiorama(
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  mesonMat: THREE.Material,
  ledMat: THREE.Material
): DioramaBuildResult {
  const root = new THREE.Group();
  const wallMeshes: THREE.Mesh[] = [];
  const floorMeshes: THREE.Mesh[] = [];
  const lightMeshes: THREE.Mesh[] = [];
  const lightObjects: THREE.Light[] = [];
  const mesonMeshes: THREE.Mesh[] = [];
  const interactiveMap = new Map<THREE.Object3D, InteractiveSurfaceTarget>();

  const size = 6.4;
  const wallH = 4.0;
  const wallThick = 0.32;

  // Base & Floor
  const { baseGroup } = createDioramaBase(size, size, 0.4);
  root.add(baseGroup);

  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.04, size), floorMat);
  floorMesh.position.set(0, 0.02, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData = { target: 'pisos', label: 'Piso Antideslizante Porcelana 2K (Industrial Latina)' };
  interactiveMap.set(floorMesh, 'pisos');
  floorMeshes.push(floorMesh);
  root.add(floorMesh);

  // Walls
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(size, wallH, wallThick), wallMat);
  backWall.position.set(0, wallH / 2, -size / 2 + wallThick / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  backWall.userData = { target: 'paredes', label: 'Muro Impermeable Satinado (Industrial Latina)' };
  interactiveMap.set(backWall, 'paredes');
  wallMeshes.push(backWall);
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, size), wallMat);
  leftWall.position.set(-size / 2 + wallThick / 2, wallH / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  leftWall.userData = { target: 'paredes', label: 'Muro Ducha Antihongos' };
  interactiveMap.set(leftWall, 'paredes');
  wallMeshes.push(leftWall);
  root.add(leftWall);

  // Recessed Lit Niches in Back Wall
  [-1.2, 1.2].forEach((nx) => {
    const nicheFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.12), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    nicheFrame.position.set(nx, 2.0, -size / 2 + wallThick + 0.06);
    root.add(nicheFrame);

    const nicheGlow = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.1), ledMat);
    nicheGlow.position.set(nx, 2.36, -size / 2 + wallThick + 0.06);
    nicheGlow.userData = { target: 'iluminacion', label: 'Iluminación LED Nicho Baño' };
    interactiveMap.set(nicheGlow, 'iluminacion');
    lightMeshes.push(nicheGlow);
    root.add(nicheGlow);
  });

  // Freestanding Bathtub (Tina Exenta Ovalada)
  const tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
  const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 0.72, 32), tubMat);
  tub.scale.set(1.5, 1.0, 0.9);
  tub.position.set(1.4, 0.38, -0.6);
  tub.castShadow = true;
  tub.receiveShadow = true;
  root.add(tub);

  // Floor-mounted Tub Filler Faucet in Matte Black
  const blackFaucMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
  const tubFaucet = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 16), blackFaucMat);
  tubFaucet.position.set(2.4, 0.48, -0.6);
  root.add(tubFaucet);

  // Walk-in Shower Glass Screen (Mampara de vidrio templado)
  const showerGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    transmission: 0.92,
    roughness: 0.05,
  });
  const showerScreen = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.6, 2.2), showerGlassMat);
  showerScreen.position.set(-1.1, 1.3, -1.8);
  showerScreen.castShadow = true;
  root.add(showerScreen);

  // Matte Black Shower Frame Post
  const showerPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.6, 0.04), blackFaucMat);
  showerPost.position.set(-1.1, 1.3, -0.7);
  root.add(showerPost);

  // Overhead Rain Shower Head in Matte Black
  const rainHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24), blackFaucMat);
  rainHead.position.set(-2.0, 2.8, -1.8);
  root.add(rainHead);

  // Floating Vanity Countertop with Double Vessel Sinks
  const vanityGroup = new THREE.Group();
  const vanityTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.75), mesonMat);
  vanityTop.position.set(-0.2, 0.88, 1.8);
  vanityTop.castShadow = true;
  vanityTop.receiveShadow = true;
  vanityTop.userData = { target: 'muebles', label: 'Mesón Tocador de Madera/Mármol (Mesón)' };
  interactiveMap.set(vanityTop, 'muebles');
  mesonMeshes.push(vanityTop);
  vanityGroup.add(vanityTop);

  // Floating lower drawer
  const vanityDrawer = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.4, 0.72), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 }));
  vanityDrawer.position.set(-0.2, 0.62, 1.8);
  vanityDrawer.castShadow = true;
  vanityGroup.add(vanityDrawer);

  // 2 Vessel Sinks
  [-0.6, 0.6].forEach((vx) => {
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.16, 24), tubMat);
    vessel.position.set(-0.2 + vx, 1.02, 1.8);
    vessel.castShadow = true;
    vanityGroup.add(vessel);

    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 16), blackFaucMat);
    f.position.set(-0.2 + vx, 1.1, 1.55);
    vanityGroup.add(f);
  });

  // Large Mirror with Perimeter LED Backlighting
  const mirrorHalo = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.04), ledMat);
  mirrorHalo.position.set(-0.2, 1.95, -size / 2 + wallThick + 0.03);
  mirrorHalo.userData = { target: 'iluminacion', label: 'Luz Perimetral Espejo Baño' };
  interactiveMap.set(mirrorHalo, 'iluminacion');
  lightMeshes.push(mirrorHalo);
  root.add(mirrorHalo);

  const mirrorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 1.05, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95, roughness: 0.04 })
  );
  mirrorGlass.position.set(-0.2, 1.95, -size / 2 + wallThick + 0.06);
  root.add(mirrorGlass);

  root.add(vanityGroup);

  // Leaning Bamboo Towel Ladder
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.08), bambooMat);
  ladder.position.set(2.4, 0.9, 1.2);
  ladder.rotation.x = -0.15;
  ladder.castShadow = true;
  root.add(ladder);

  return {
    rootGroup: root,
    wallMeshes,
    floorMeshes,
    lightMeshes,
    lightObjects,
    mesonMeshes,
    interactiveMap,
  };
}

// -----------------------------------------------------------------------------
// 5. FACHADA EXTERIOR
// -----------------------------------------------------------------------------
export function buildFacadeDiorama(
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  mesonMat: THREE.Material,
  ledMat: THREE.Material
): DioramaBuildResult {
  const root = new THREE.Group();
  const wallMeshes: THREE.Mesh[] = [];
  const floorMeshes: THREE.Mesh[] = [];
  const lightMeshes: THREE.Mesh[] = [];
  const lightObjects: THREE.Light[] = [];
  const mesonMeshes: THREE.Mesh[] = [];
  const interactiveMap = new Map<THREE.Object3D, InteractiveSurfaceTarget>();

  const size = 6.4;

  // Base & Ground Pavement
  const { baseGroup } = createDioramaBase(size, size, 0.4);
  root.add(baseGroup);

  const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.04, size), floorMat);
  groundMesh.position.set(0, 0.02, 0);
  groundMesh.receiveShadow = true;
  groundMesh.userData = { target: 'pisos', label: 'Pavimento Exterior & Adoquín' };
  interactiveMap.set(groundMesh, 'pisos');
  floorMeshes.push(groundMesh);
  root.add(groundMesh);

  // Garden Lawn Strip on Right
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 3.2), lawnMat);
  lawn.position.set(1.9, 0.03, 1.4);
  lawn.receiveShadow = true;
  root.add(lawn);

  // Main House Facade (Volúmenes arquitectónicos en voladizo)
  // Ground Floor Main Volume (Paintable)
  const gfVolume = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 2.8), wallMat);
  gfVolume.position.set(-0.8, 1.1, -1.4);
  gfVolume.castShadow = true;
  gfVolume.receiveShadow = true;
  gfVolume.userData = { target: 'paredes', label: 'Volumen Fachada Planta Baja' };
  interactiveMap.set(gfVolume, 'paredes');
  wallMeshes.push(gfVolume);
  root.add(gfVolume);

  // Second Floor Cantilever Volume (Volumen en voladizo)
  const ffVolume = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.9, 3.2), wallMat);
  ffVolume.position.set(-0.5, 3.15, -1.2);
  ffVolume.castShadow = true;
  ffVolume.receiveShadow = true;
  ffVolume.userData = { target: 'paredes', label: 'Volumen Superior en Voladizo (Industrial Latina)' };
  interactiveMap.set(ffVolume, 'paredes');
  wallMeshes.push(ffVolume);
  root.add(ffVolume);

  // Architectural Cornices & Moldings (Mesón Target)
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 0.18), mesonMat);
  cornice.position.set(-0.5, 4.15, 0.42);
  cornice.castShadow = true;
  cornice.userData = { target: 'muebles', label: 'Cornisas y Remates Arquitectónicos (Mesón)' };
  interactiveMap.set(cornice, 'muebles');
  mesonMeshes.push(cornice);
  root.add(cornice);

  // Tall Pivoting Teak Entrance Door
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.3, 0.12), doorMat);
  door.position.set(-0.4, 1.15, 0.05);
  door.castShadow = true;
  root.add(door);

  // Long Stainless Steel Vertical Door Pull Handle
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });
  const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 12), handleMat);
  doorHandle.position.set(0.05, 1.15, 0.14);
  root.add(doorHandle);

  // Floating Illuminated Entrance Steps (Escalones flotantes con tiras LED)
  const stepMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
  [
    [0.12, 0.6],
    [0.22, 1.0],
    [0.32, 1.4],
  ].forEach(([sy, sz], i) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.55), stepMat);
    step.position.set(-0.4, sy, sz);
    step.castShadow = true;
    step.receiveShadow = true;
    root.add(step);

    // Step LED Strip
    const stepLed = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.04), ledMat);
    stepLed.position.set(-0.4, sy - 0.05, sz + 0.26);
    stepLed.userData = { target: 'iluminacion', label: `Luz LED Escalón #${i + 1} Induless` };
    interactiveMap.set(stepLed, 'iluminacion');
    lightMeshes.push(stepLed);
    root.add(stepLed);
  });

  // Architectural Balcony Glass Railing on 2nd Floor
  const railingGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
    transmission: 0.9,
    roughness: 0.05,
  });
  const glassRailing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 0.04), railingGlassMat);
  glassRailing.position.set(-0.6, 2.7, 0.45);
  root.add(glassRailing);

  // Exterior Wall Washers (Apliques Murales LED)
  [-1.8, 0.8].forEach((wx) => {
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    sconce.position.set(wx, 1.6, 0.05);
    root.add(sconce);

    const sconceGlow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.06), ledMat);
    sconceGlow.position.set(wx, 1.5, 0.06);
    sconceGlow.userData = { target: 'iluminacion', label: 'Aplique LED Exterior (Wall Washer) Induless' };
    interactiveMap.set(sconceGlow, 'iluminacion');
    lightMeshes.push(sconceGlow);
    root.add(sconceGlow);
  });

  // Modern Decorative Tree & Shrubs
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
  trunk.position.set(2.0, 0.8, 1.8);
  trunk.castShadow = true;
  root.add(trunk);

  const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 }));
  foliage.position.set(2.0, 1.85, 1.8);
  foliage.castShadow = true;
  root.add(foliage);

  return {
    rootGroup: root,
    wallMeshes,
    floorMeshes,
    lightMeshes,
    lightObjects,
    mesonMeshes,
    interactiveMap,
  };
}

// -----------------------------------------------------------------------------
// 6. CUBIERTA INDUSTRIAL, GALPÓN
// -----------------------------------------------------------------------------
export function buildIndustrialDiorama(
  wallMat: THREE.Material,
  floorMat: THREE.Material,
  mesonMat: THREE.Material,
  ledMat: THREE.Material
): DioramaBuildResult {
  const root = new THREE.Group();
  const wallMeshes: THREE.Mesh[] = [];
  const floorMeshes: THREE.Mesh[] = [];
  const lightMeshes: THREE.Mesh[] = [];
  const lightObjects: THREE.Light[] = [];
  const mesonMeshes: THREE.Mesh[] = [];
  const interactiveMap = new Map<THREE.Object3D, InteractiveSurfaceTarget>();

  const size = 6.4;
  const colH = 3.6;

  // Base & Industrial Epoxy Floor with Warning Lines
  const { baseGroup } = createDioramaBase(size, size, 0.4);
  root.add(baseGroup);

  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(size, 0.04, size), floorMat);
  floorMesh.position.set(0, 0.02, 0);
  floorMesh.receiveShadow = true;
  floorMesh.userData = { target: 'pisos', label: 'Piso Epóxico / Hormigón Pulido (Industrial Latina)' };
  interactiveMap.set(floorMesh, 'pisos');
  floorMeshes.push(floorMesh);
  root.add(floorMesh);

  // Lower Half Masonry Wall (Mampostería de bloque)
  const masonry = new THREE.Mesh(new THREE.BoxGeometry(size, 1.4, 0.25), wallMat);
  masonry.position.set(0, 0.7, -size / 2 + 0.15);
  masonry.castShadow = true;
  masonry.receiveShadow = true;
  masonry.userData = { target: 'paredes', label: 'Mampostería de Muros Galpón' };
  interactiveMap.set(masonry, 'paredes');
  wallMeshes.push(masonry);
  root.add(masonry);

  // Heavy Steel H-Columns (Columnas IPE/HEB)
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
  [-2.6, 0, 2.6].forEach((cx) => {
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.2, colH, 0.2), mesonMat);
    column.position.set(cx, colH / 2, -size / 2 + 0.35);
    column.castShadow = true;
    column.userData = { target: 'muebles', label: 'Columna Estructural de Acero (Mesón)' };
    interactiveMap.set(column, 'muebles');
    mesonMeshes.push(column);
    root.add(column);
  });

  // Reticulated Roof Trusses (Cerchas Metálicas Triangulares)
  const trussGroup = new THREE.Group();
  const trussTopChord = new THREE.Mesh(new THREE.BoxGeometry(size, 0.1, 0.12), mesonMat);
  trussTopChord.position.set(0, colH + 0.4, -size / 2 + 0.35);
  trussTopChord.userData = { target: 'muebles', label: 'Cercha Metálica Reticulada' };
  interactiveMap.set(trussTopChord, 'muebles');
  mesonMeshes.push(trussTopChord);
  trussGroup.add(trussTopChord);

  const trussBottomChord = new THREE.Mesh(new THREE.BoxGeometry(size, 0.08, 0.1), mesonMat);
  trussBottomChord.position.set(0, colH, -size / 2 + 0.35);
  trussGroup.add(trussBottomChord);

  // Diagonal web members
  for (let d = -2.6; d <= 2.6; d += 0.8) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), steelMat);
    strut.position.set(d, colH + 0.2, -size / 2 + 0.35);
    strut.rotation.z = 0.5;
    trussGroup.add(strut);
  }
  root.add(trussGroup);

  // Pitched Roof with Corrugated Techoforte Panels
  const roofSlope = new THREE.Mesh(new THREE.BoxGeometry(size, 0.08, 2.8), wallMat);
  roofSlope.position.set(0, colH + 0.65, -size / 2 + 1.4);
  roofSlope.rotation.x = -0.15;
  roofSlope.castShadow = true;
  roofSlope.userData = { target: 'paredes', label: 'Cubierta Termoacústica Techoforte (Industrial Latina)' };
  interactiveMap.set(roofSlope, 'paredes');
  wallMeshes.push(roofSlope);
  root.add(roofSlope);

  // Heavy Duty Industrial Warehouse Racks (Estanterías de carga pesada)
  const rackGroup = new THREE.Group();
  const rackUprightMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 }); // Blue uprights
  const rackBeamMat = new THREE.MeshStandardMaterial({ color: 0xea580c }); // Orange beams
  const palletMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.8 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });

  // 3 Upright frames
  [-1.0, 0.2, 1.4].forEach((rx) => {
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.8, 0.8), rackUprightMat);
    upright.position.set(-2.0, 1.4, rx);
    upright.castShadow = true;
    rackGroup.add(upright);
  });

  // Beams & Loaded Pallets on 2 levels
  [0.8, 1.8].forEach((by) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 2.6), rackBeamMat);
    beam.position.set(-1.6, by, 0.2);
    rackGroup.add(beam);

    // 2 Pallets per shelf with boxes
    [-0.4, 0.8].forEach((pz) => {
      const pallet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.85), palletMat);
      pallet.position.set(-2.0, by + 0.08, pz);
      pallet.castShadow = true;
      rackGroup.add(pallet);

      const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.75), boxMat);
      box.position.set(-2.0, by + 0.35, pz);
      box.castShadow = true;
      rackGroup.add(box);
    });
  });
  root.add(rackGroup);

  // Sectional Roll-up Loading Door on Back (Portón seccional industrial)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.35 });
  const loadingDoor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.08), doorMat);
  loadingDoor.position.set(1.4, 1.3, -size / 2 + 0.2);
  loadingDoor.castShadow = true;
  root.add(loadingDoor);

  // Industrial High-Bay UFO LED Pendant Fixtures
  [-1.0, 1.0].forEach((hx) => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 8), steelMat);
    cord.position.set(hx, colH + 0.1, 0.4);
    root.add(cord);

    const ufo = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.12, 24), ledMat);
    ufo.position.set(hx, colH - 0.35, 0.4);
    ufo.userData = { target: 'iluminacion', label: 'Campana Industrial LED High-Bay UFO Induless' };
    interactiveMap.set(ufo, 'iluminacion');
    lightMeshes.push(ufo);
    root.add(ufo);
  });

  return {
    rootGroup: root,
    wallMeshes,
    floorMeshes,
    lightMeshes,
    lightObjects,
    mesonMeshes,
    interactiveMap,
  };
}

// -----------------------------------------------------------------------------
// PROCEDURAL HDRi ENVIRONMENT SCENE BUILDER (FOR PMREMGenerator)
// -----------------------------------------------------------------------------
export function buildProceduralHdriEnvironmentScene(
  presetId: HdriEnvironmentPresetId
): THREE.Scene {
  const spec =
    HDRI_ENVIRONMENT_PRESETS[presetId] || HDRI_ENVIRONMENT_PRESETS.industrial;
  const envScene = new THREE.Scene();

  // Enclosure shell with distinct Zenith (+Y), Ground (-Y), and Horizon (Sides) materials
  const zenithMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(spec.zenithColorHex),
    side: THREE.BackSide,
  });
  const groundMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(spec.groundColorHex),
    side: THREE.BackSide,
  });
  const horizonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(spec.horizonColorHex),
    side: THREE.BackSide,
  });

  // BoxGeometry material order: +X, -X, +Y (top), -Y (bottom), +Z, -Z
  const shellGeo = new THREE.BoxGeometry(32, 26, 32);
  const shellMesh = new THREE.Mesh(shellGeo, [
    horizonMat,
    horizonMat,
    zenithMat,
    groundMat,
    horizonMat,
    horizonMat,
  ]);
  shellMesh.position.set(0, 5, 0);
  envScene.add(shellMesh);

  // Add HDR Emissive Light Panels (color multiplied > 1.0 for true HDR specular reflections)
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  spec.emitters.forEach((emitter) => {
    const hdrColor = new THREE.Color(emitter.colorHex).multiplyScalar(
      emitter.hdrMultiplier
    );
    const emitterMat = new THREE.MeshBasicMaterial({ color: hdrColor });
    const mesh = new THREE.Mesh(unitBox, emitterMat);
    mesh.position.set(
      emitter.position[0],
      emitter.position[1],
      emitter.position[2]
    );
    mesh.scale.set(emitter.scale[0], emitter.scale[1], emitter.scale[2]);
    if (emitter.rotation) {
      mesh.rotation.set(
        emitter.rotation[0],
        emitter.rotation[1],
        emitter.rotation[2]
      );
    }
    envScene.add(mesh);
  });

  return envScene;
}

