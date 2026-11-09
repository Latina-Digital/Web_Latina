import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  X,
  Trophy,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  GameSimulationState,
  PalletPickup,
  HazardEntity,
  clampSimulationDt,
  createInitialGameSimulationState,
  createInitialPallets,
  createInitialHazards,
  stepHazardBehavior,
  evaluatePalletPickup,
  applyPlayerHazardImpact,
  buildRunSnapshot,
} from '../utils/industrial3dGameRules';

interface Industrial3dLogisticsGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoStart?: boolean;
}

export const Industrial3dLogisticsGameModal: React.FC<Industrial3dLogisticsGameModalProps> = ({
  isOpen,
  onClose,
  autoStart = false,
}) => {
  const [simState, setSimState] = useState<GameSimulationState>(() =>
    createInitialGameSimulationState(0, autoStart)
  );
  const [muted, setMuted] = useState(false);

  const simRef = useRef<GameSimulationState>(simState);
  const palletsRef = useRef<PalletPickup[]>(createInitialPallets());
  const hazardsRef = useRef<HazardEntity[]>(createInitialHazards());
  const mutedRef = useRef<boolean>(muted);
  const keysRef = useRef<Record<string, boolean>>({});
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Mirror shellState to document.body.dataset.state for Playwright & Ultra Mode contract
  useEffect(() => {
    if (!isOpen) {
      delete document.body.dataset.state;
      return;
    }
    document.body.dataset.state = simState.shellState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [isOpen, simState.shellState]);

  const playSynthTone = useCallback(
    (type: 'pickup' | 'hit' | 'turbo' | 'victory' | 'start') => {
      if (mutedRef.current) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        if (type === 'pickup') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.14);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'hit') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.22);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.24);
        } else if (type === 'turbo') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
        } else {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
        }
      } catch {
        // Ignore audio context restrictions
      }
    },
    []
  );

  const startNewRun = useCallback(() => {
    const fresh = createInitialGameSimulationState(simRef.current.bestScore, true);
    simRef.current = fresh;
    palletsRef.current = createInitialPallets();
    hazardsRef.current = createInitialHazards();
    setSimState({ ...fresh });
    playSynthTone('start');
  }, [playSynthTone]);

  const togglePause = useCallback(() => {
    const cur = simRef.current;
    if (cur.shellState === 'playing') {
      cur.shellState = 'paused';
      setSimState({ ...cur });
    } else if (cur.shellState === 'paused') {
      cur.shellState = 'playing';
      setSimState({ ...cur });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current[code] = true;

      if (simRef.current.shellState === 'title' && (code === 'Enter' || code === 'Space')) {
        e.preventDefault();
        startNewRun();
        return;
      }
      if (code === 'KeyP' || code === 'Escape') {
        if (
          simRef.current.shellState === 'playing' ||
          simRef.current.shellState === 'paused'
        ) {
          e.preventDefault();
          togglePause();
        }
      } else if (code === 'KeyR') {
        e.preventDefault();
        startNewRun();
      } else if (code === 'KeyM') {
        e.preventDefault();
        setMuted((m) => !m);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onBlur = () => {
      keysRef.current = {};
      if (simRef.current.shellState === 'playing') {
        simRef.current.shellState = 'paused';
        setSimState({ ...simRef.current });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [isOpen, startNewRun, togglePause]);

  useEffect(() => {
    if (!isOpen) return;
    const container = canvasHostRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1424);
    scene.fog = new THREE.FogExp2(0x0c1424, 0.015);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 160);
    camera.position.set(0, 19, 25);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software|Mesa OffScreen/i.test(rendererStr);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let pmremGenerator: THREE.PMREMGenerator | null = null;
    let envRenderTarget: THREE.WebGLRenderTarget | null = null;
    if (!isSoftwareGl) {
      try {
        pmremGenerator = new THREE.PMREMGenerator(renderer);
        envRenderTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = envRenderTarget.texture;
      } catch {
        // Ignore if environment generation fails
      }
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.2);
    keyLight.position.set(14, 24, 14);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 65;
      const d = 26;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-16, 12, -14);
    scene.add(rimLight);

    const floorGeo = new THREE.PlaneGeometry(54, 54);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.78,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(48, 24, 0xfacc15, 0x334155);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    const dockRingGeo = new THREE.RingGeometry(1.8, 2.3, 32);
    const dockRingMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
    });
    const dockRing = new THREE.Mesh(dockRingGeo, dockRingMat);
    dockRing.rotation.x = -Math.PI / 2;
    dockRing.position.y = 0.03;
    scene.add(dockRing);

    const buildForkliftGroup = () => {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.32,
        metalness: 0.35,
      });
      const navyMat = new THREE.MeshStandardMaterial({
        color: 0x0b2861,
        roughness: 0.4,
        metalness: 0.5,
      });
      const darkSteelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.5,
        metalness: 0.75,
      });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 1.8), bodyMat);
      chassis.position.y = 0.42;
      chassis.castShadow = !isSoftwareGl;
      g.add(chassis);

      const rearBlock = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.65, 0.55), navyMat);
      rearBlock.position.set(0, 0.52, -0.65);
      g.add(rearBlock);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 1.15), darkSteelMat);
      roof.position.set(0, 1.42, -0.1);
      g.add(roof);

      const mastL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.14), darkSteelMat);
      mastL.position.set(-0.38, 0.85, 0.88);
      const mastR = mastL.clone();
      mastR.position.x = 0.38;
      g.add(mastL, mastR);

      const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.85), darkSteelMat);
      forkL.position.set(-0.32, 0.2, 1.28);
      const forkR = forkL.clone();
      forkR.position.x = 0.32;
      g.add(forkL, forkR);

      const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.22, 14);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelPositions: [number, number, number][] = [
        [-0.68, 0.26, 0.58],
        [0.68, 0.26, 0.58],
        [-0.68, 0.26, -0.58],
        [0.68, 0.26, -0.58],
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, darkSteelMat);
        w.position.set(wx, wy, wz);
        g.add(w);
      });

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.22, 12),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
        })
      );
      beacon.position.set(0, 1.58, -0.1);
      g.add(beacon);

      return g;
    };

    const playerGroup = buildForkliftGroup();
    scene.add(playerGroup);

    const palletMeshes = new Map<string, THREE.Group>();
    const createPalletGroup = (brand: 'industrial_latina' | 'induless') => {
      const pg = new THREE.Group();
      const woodBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.14, 1.15),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
      );
      woodBase.position.y = 0.08;
      pg.add(woodBase);

      const drumColor = brand === 'industrial_latina' ? 0x2563eb : 0xd8235a;
      const drumMat = new THREE.MeshStandardMaterial({
        color: drumColor,
        roughness: 0.28,
        metalness: 0.35,
      });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });

      const offsets: [number, number][] = [
        [-0.28, -0.28],
        [0.28, -0.28],
        [-0.28, 0.28],
        [0.28, 0.28],
      ];
      offsets.forEach(([ox, oz]) => {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.62, 14), drumMat);
        drum.position.set(ox, 0.46, oz);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 14), capMat);
        cap.position.set(ox, 0.78, oz);
        pg.add(drum, cap);
      });

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 0.9, 24),
        new THREE.MeshBasicMaterial({
          color: brand === 'industrial_latina' ? 0x38bdf8 : 0xf43f5e,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      pg.add(ring);

      return pg;
    };

    const hazardMeshes = new Map<string, { group: THREE.Group; telegraph: THREE.Mesh }>();
    const createHazardVisual = (archetype: string) => {
      const hg = new THREE.Group();
      if (archetype === 'chaser_forklift') {
        const hull = new THREE.Mesh(
          new THREE.BoxGeometry(1.25, 0.65, 1.5),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.45 })
        );
        hull.position.y = 0.4;
        const bumper = new THREE.Mesh(
          new THREE.BoxGeometry(1.35, 0.25, 0.3),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
        );
        bumper.position.set(0, 0.22, 0.75);
        hg.add(hull, bumper);
      } else if (archetype === 'kiter_drone') {
        const core = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.55, 1),
          new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            emissive: 0x7e22ce,
            emissiveIntensity: 0.5,
            roughness: 0.25,
          })
        );
        core.position.y = 1.15;
        const rotorRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.85, 0.07, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 })
        );
        rotorRing.rotation.x = Math.PI / 2;
        rotorRing.position.y = 1.15;
        hg.add(core, rotorRing);
      } else {
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.65, 0.75, 0.9, 16),
          new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3, metalness: 0.6 })
        );
        base.position.y = 0.5;
        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(0.45, 0.9, 12),
          new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xeab308,
            emissiveIntensity: 0.6,
          })
        );
        spire.position.y = 1.3;
        hg.add(base, spire);
      }

      const telegraphGeo = new THREE.RingGeometry(0.9, 1.45, 28);
      const telegraphMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      const telegraph = new THREE.Mesh(telegraphGeo, telegraphMat);
      telegraph.rotation.x = -Math.PI / 2;
      telegraph.position.y = 0.05;
      hg.add(telegraph);

      return { group: hg, telegraph };
    };

    let disposed = false;
    let rafId = 0;
    let lastNow = performance.now();
    let titleOrbitAngle = 0;
    let uiSyncAccumulator = 0;

    const afterDraw = (cb: FrameRequestCallback) => {
      if (isSoftwareGl) {
        setTimeout(() => requestAnimationFrame(cb), 16);
      } else {
        rafId = requestAnimationFrame(cb);
      }
    };

    const syncEntitiesToScene = (nowSec: number) => {
      palletsRef.current.forEach((p) => {
        let mesh = palletMeshes.get(p.id);
        if (!mesh) {
          mesh = createPalletGroup(p.brand);
          palletMeshes.set(p.id, mesh);
          scene.add(mesh);
        }
        mesh.visible = !p.collected;
        if (!p.collected) {
          mesh.position.set(p.x, Math.sin(nowSec * 3 + p.x) * 0.08, p.z);
          mesh.rotation.y = nowSec * 0.9;
        }
      });

      hazardsRef.current.forEach((h) => {
        let entry = hazardMeshes.get(h.id);
        if (!entry) {
          entry = createHazardVisual(h.archetype);
          hazardMeshes.set(h.id, entry);
          scene.add(entry.group);
        }
        entry.group.position.set(h.x, 0, h.z);
        entry.group.rotation.y += 0.03;

        const mat = entry.telegraph.material as THREE.MeshBasicMaterial;
        if (h.windupTimer > 0) {
          const progress = Math.min(1, (0.45 - h.windupTimer) / 0.45);
          mat.opacity = 0.35 + progress * 0.6;
          const s = 1 + progress * 0.85;
          entry.telegraph.scale.set(s, s, 1);
        } else {
          mat.opacity = 0;
        }
      });
    };

    const tick = (now: number) => {
      if (disposed) return;
      const dt = clampSimulationDt((now - lastNow) / 1000);
      lastNow = now;
      const nowSec = now / 1000;

      let cur = simRef.current;

      if (cur.shellState === 'title') {
        titleOrbitAngle += dt * 0.38;
        camera.position.set(
          Math.cos(titleOrbitAngle) * 23,
          15.5,
          Math.sin(titleOrbitAngle) * 23
        );
        camera.lookAt(0, 0.8, 0);
        playerGroup.position.set(cur.playerX, 0, cur.playerZ);
        syncEntitiesToScene(nowSec);
      } else if (cur.shellState === 'playing') {
        cur.elapsedSec += dt;
        cur.invulnerableTimer = Math.max(0, cur.invulnerableTimer - dt);
        cur.dashCooldown = Math.max(0, cur.dashCooldown - dt);
        cur.comboTimer = Math.max(0, cur.comboTimer - dt);

        const keys = keysRef.current;
        let moveX = 0;
        let moveZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        let speed = 9.0;
        if (keys['Space'] && cur.dashCooldown <= 0 && (moveX !== 0 || moveZ !== 0)) {
          speed = 19.5;
          cur.dashCooldown = 1.5;
          playSynthTone('turbo');
        }

        const arenaHalf = 23;
        if (moveX !== 0 || moveZ !== 0) {
          const len = Math.hypot(moveX, moveZ) || 1;
          const nx = moveX / len;
          const nz = moveZ / len;
          cur.playerX = Math.max(-arenaHalf, Math.min(arenaHalf, cur.playerX + nx * speed * dt));
          cur.playerZ = Math.max(-arenaHalf, Math.min(arenaHalf, cur.playerZ + nz * speed * dt));
          cur.playerYaw = Math.atan2(nx, nz);
        }

        playerGroup.position.set(cur.playerX, 0, cur.playerZ);
        playerGroup.rotation.y = cur.playerYaw;

        // Check pallet pickups
        palletsRef.current = palletsRef.current.map((pallet) => {
          if (pallet.collected) return pallet;
          const res = evaluatePalletPickup(cur, pallet);
          if (res.collectedNow) {
            cur = res.state;
            simRef.current = cur;
            playSynthTone(cur.outcome === 'victory' ? 'victory' : 'pickup');
            return { ...pallet, collected: true };
          }
          return pallet;
        });

        // Step hazards & check impacts
        if (cur.shellState === 'playing') {
          hazardsRef.current = hazardsRef.current.map((h) => {
            const stepped = stepHazardBehavior(h, cur.playerX, cur.playerZ, dt, arenaHalf);
            const distToPlayer = Math.hypot(stepped.x - cur.playerX, stepped.z - cur.playerZ);
            if (distToPlayer < stepped.radius + 0.55 && cur.invulnerableTimer <= 0) {
              cur = applyPlayerHazardImpact(cur);
              simRef.current = cur;
              playSynthTone('hit');
            }
            return stepped;
          });
        }

        camera.position.lerp(
          new THREE.Vector3(cur.playerX * 0.55, 17.5, cur.playerZ * 0.55 + 17.5),
          Math.min(1, dt * 5)
        );
        camera.lookAt(cur.playerX * 0.35, 0.5, cur.playerZ * 0.35);

        syncEntitiesToScene(nowSec);

        uiSyncAccumulator += dt;
        if (uiSyncAccumulator >= 0.1 || cur.shellState !== 'playing') {
          uiSyncAccumulator = 0;
          setSimState({ ...cur });
        }
      } else {
        syncEntitiesToScene(nowSec);
      }

      renderer.render(scene, camera);
      afterDraw(tick);
    };

    afterDraw(tick);

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      floorGeo.dispose();
      floorMat.dispose();
      dockRingGeo.dispose();
      dockRingMat.dispose();
      if (envRenderTarget) envRenderTarget.dispose();
      if (pmremGenerator) pmremGenerator.dispose();
      renderer.dispose();
    };
  }, [isOpen, playSynthTone]);

  if (!isOpen) return null;

  const snapshot = buildRunSnapshot(simState);
  const isVictory = simState.outcome === 'victory';

  return (
    <div
      data-testid="industrial-3d-game-shell"
      className="fixed inset-0 z-[9999] modal-layer-top overflow-hidden bg-slate-950 select-none font-sans"
      style={{ zIndex: 9999 }}
    >
      <div
        ref={canvasHostRef}
        data-testid="industrial-3d-game-canvas-host"
        className="w-full h-full"
      />

      {/* STATE 1: TITLE SCREEN OVERLAY (data-state="title") */}
      {simState.shellState === 'title' && (
        <div
          data-testid="game-title-overlay"
          className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-[2px]"
        >
          <div className="max-w-lg w-full rounded-3xl bg-slate-900/90 border-2 border-amber-400/50 shadow-2xl p-6 sm:p-8 text-center space-y-5 text-white">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0B2861] via-blue-900 to-[#D8235A] border-2 border-[#FFD100] flex items-center justify-center shadow-lg">
              <svg
                viewBox="0 0 64 64"
                className="w-12 h-12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="8" y="34" width="32" height="16" rx="4" fill="#FFD100" />
                <rect
                  x="12"
                  y="18"
                  width="20"
                  height="16"
                  rx="3"
                  fill="#38BDF8"
                  fillOpacity="0.35"
                  stroke="#FFD100"
                  strokeWidth="2.5"
                />
                <path
                  d="M44 14V48H56"
                  stroke="#F8FAFC"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="52" r="6" fill="#0F172A" stroke="#FFD100" strokeWidth="2.5" />
                <circle cx="34" cy="52" r="6" fill="#0F172A" stroke="#FFD100" strokeWidth="2.5" />
                <circle cx="22" cy="12" r="3.5" fill="#F59E0B" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Simulador 3D WebGL • Planta Vía a Daule &amp; Mapasingue
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Operación Logística 3D: Industrial Latina &amp; Induless
              </h1>
              <p className="text-xs text-slate-300">
                Recolecta los 8 pallets de Pinturas Látex y Paneles LED evitando las grúas y drones autónomos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Conducir:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-amber-300">
                  WASD / Flechas
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Impulso Turbo:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-amber-300">
                  ESPACIO
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pausa / Audio:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200">
                  P / M
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reiniciar:</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200">
                  R
                </kbd>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                data-testid="start-3d-game-btn"
                onClick={startNewRun}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-black text-sm uppercase tracking-wider shadow-xl transition-transform active:scale-98 cursor-pointer"
              >
                Iniciar Turno Logístico (Enter)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer shrink-0"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: IN-GAME HUD */}
      {simState.shellState !== 'title' && (
        <>
          <div
            data-testid="game-hud-top-left"
            className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2"
          >
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 flex items-center gap-4 text-xs text-white shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Integridad:
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: simState.maxHp }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-xs border ${
                        idx < simState.hp
                          ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <span className="h-4 w-px bg-slate-700" />

              <div className="font-mono font-bold">
                <span className="text-slate-400 text-[10px] uppercase mr-1.5">Pallets:</span>
                <span className="text-amber-300 text-sm">
                  {simState.palletsCollected}/{simState.targetPallets}
                </span>
              </div>

              <span className="h-4 w-px bg-slate-700" />

              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span
                  className={
                    simState.dashCooldown <= 0 ? 'text-sky-300 font-bold' : 'text-slate-400'
                  }
                >
                  {simState.dashCooldown <= 0
                    ? 'TURBO LISTO'
                    : `${simState.dashCooldown.toFixed(1)}s`}
                </span>
              </div>
            </div>
          </div>

          <div
            data-testid="game-hud-top-right"
            className="absolute top-4 right-4 flex items-center gap-2"
          >
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 flex items-center gap-3 text-xs text-white font-mono shadow-lg pointer-events-none">
              <div>
                <span className="text-[10px] text-slate-400 uppercase mr-1">Puntaje:</span>
                <strong className="text-amber-300 text-sm">{simState.score}</strong>
              </div>
              <span className="h-4 w-px bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase mr-1">Tiempo:</span>
                <strong>{snapshot.clearTimeSec}s</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMuted(!muted)}
              className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Silenciar / Activar Audio (M)"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Pausar / Reanudar (P)"
            >
              {simState.shellState === 'paused' ? (
                <Play className="w-4 h-4 text-amber-400" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={startNewRun}
              className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Reiniciar Partida (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-700/60 text-red-200 cursor-pointer"
              title="Cerrar Simulador 3D"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* STATE 3: PAUSE MODAL */}
      {simState.shellState === 'paused' && (
        <div
          data-testid="game-pause-overlay"
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-sm w-full rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center space-y-4 text-white shadow-2xl">
            <h2 className="text-xl font-black">Simulación en Pausa</h2>
            <p className="text-xs text-slate-300">
              Pallets recolectados: {simState.palletsCollected}/{simState.targetPallets} • Puntaje:{' '}
              {simState.score}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={togglePause}
                className="w-full py-2.5 rounded-xl bg-[#FFD100] text-[#0B2861] font-black text-xs uppercase cursor-pointer"
              >
                Reanudar Operación (P)
              </button>
              <button
                type="button"
                onClick={startNewRun}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Reiniciar Turno (R)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                Volver a la Plataforma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: GAME OVER / VICTORY MODAL */}
      {simState.shellState === 'gameover' && (
        <div
          data-testid="game-over-overlay"
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border-2 border-amber-400/60 p-6 sm:p-7 text-center space-y-5 text-white shadow-2xl">
            <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-400/20 border border-amber-400/40 text-amber-300">
              {isVictory ? (
                <Trophy className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-400" />
              )}
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                Oleada {snapshot.waveReached} • Mejor Puntaje: {snapshot.bestScore}
              </span>
              <h2 className="text-2xl font-black mt-1">
                {isVictory
                  ? '¡Despacho 48–72h Completado!'
                  : 'Montacargas Fuera de Servicio'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {isVictory
                  ? 'Todos los pallets de Industrial Latina e Induless fueron consolidados para facturación SRI.'
                  : 'Los obstáculos autónomos detuvieron la maniobra. Intenta usar el impulso Turbo (ESPACIO).'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Puntaje</span>
                <strong className="text-amber-300 text-sm">{snapshot.score}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Pallets</span>
                <strong className="text-emerald-300 text-sm">
                  {snapshot.palletsCollected}/{snapshot.targetPallets}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tiempo</span>
                <strong className="text-white text-sm">{snapshot.clearTimeSec}s</strong>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                data-testid="play-again-3d-btn"
                onClick={startNewRun}
                className="flex-1 py-3 rounded-xl bg-[#FFD100] hover:bg-yellow-400 text-[#0B2861] font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                {isVictory ? 'Siguiente Turno (R)' : 'Jugar de Nuevo (R)'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
