import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPresetLightingRigConfig,
  clampLightingRigConfig,
  calculateEffectiveSceneLux,
  toggleLightVisibility,
  setAllLightsVisibility,
  getActiveLightsSummary,
  HDRI_ENVIRONMENT_PRESETS,
  HDRI_ENVIRONMENT_LIST,
  applyHdriEnvironmentPreset,
} from './lightingRigConfig';

describe('3D Scene Lighting Rig Configuration (Ambient, Directional, Point, Visibility & HDRi Presets)', () => {
  it('returns distinct valid presets for dia, tarde, noche, and rasante with all lights enabled by default', () => {
    const dia = getPresetLightingRigConfig('dia');
    const noche = getPresetLightingRigConfig('noche');
    const rasante = getPresetLightingRigConfig('rasante');

    assert.equal(dia.ambient.enabled, true);
    assert.equal(dia.directional.enabled, true);
    assert.equal(dia.point.enabled, true);
    assert.equal(dia.hdriPreset, 'industrial');
    assert.ok(dia.ambient.intensity > noche.ambient.intensity);
    assert.ok(dia.directional.intensity > noche.directional.intensity);
    assert.ok(noche.point.intensity > dia.point.intensity);
    assert.deepEqual(dia.directional.position, [8.5, 12.0, 7.5]);
    assert.deepEqual(rasante.directional.position, [-3.6, 2.0, 3.0]);
  });

  it('clamps out-of-range intensity, envMapIntensity, and X/Y/Z coordinates safely while preserving enabled flags', () => {
    const raw = {
      ambient: { enabled: true, intensity: 12, colorHex: '#ffffff', groundColorHex: '#000000' },
      directional: {
        enabled: false,
        intensity: -3,
        position: [99, -5, -45] as [number, number, number],
        colorHex: '#ffffff',
      },
      point: {
        enabled: true,
        intensity: 20,
        position: [-25, 0, 30] as [number, number, number],
        distance: 100,
        decay: 1.5,
        colorHex: '#ffffff',
      },
      showLightHelpers: true,
      hdriPreset: 'oficina' as const,
      envMapIntensity: 9.5,
    };

    const clamped = clampLightingRigConfig(raw);
    assert.equal(clamped.ambient.enabled, true);
    assert.equal(clamped.directional.enabled, false);
    assert.equal(clamped.ambient.intensity, 4);
    assert.equal(clamped.directional.intensity, 0);
    assert.deepEqual(clamped.directional.position, [20, 0.5, -20]);
    assert.equal(clamped.point.intensity, 8);
    assert.deepEqual(clamped.point.position, [-10, 0.2, 10]);
    assert.equal(clamped.point.distance, 30);
    assert.equal(clamped.showLightHelpers, true);
    assert.equal(clamped.hdriPreset, 'oficina');
    assert.equal(clamped.envMapIntensity, 3);
  });

  it('defines preconfigured HDRi environments (Industrial, Almacén, Oficina) and updates global ambient illumination on selection', () => {
    assert.ok(HDRI_ENVIRONMENT_LIST.length >= 3);
    assert.equal(HDRI_ENVIRONMENT_PRESETS.industrial.label, 'Industrial');
    assert.equal(HDRI_ENVIRONMENT_PRESETS.almacen.label, 'Almacén');
    assert.equal(HDRI_ENVIRONMENT_PRESETS.oficina.label, 'Oficina');

    const base = getPresetLightingRigConfig('noche');
    const warehouseRig = applyHdriEnvironmentPreset(base, 'almacen');
    assert.equal(warehouseRig.hdriPreset, 'almacen');
    assert.equal(warehouseRig.ambient.enabled, true);
    assert.equal(
      warehouseRig.ambient.colorHex,
      HDRI_ENVIRONMENT_PRESETS.almacen.recommendedAmbient.colorHex
    );
    assert.equal(
      warehouseRig.envMapIntensity,
      HDRI_ENVIRONMENT_PRESETS.almacen.defaultEnvMapIntensity
    );

    const officeRig = applyHdriEnvironmentPreset(warehouseRig, 'oficina');
    assert.equal(officeRig.hdriPreset, 'oficina');
    assert.equal(
      officeRig.ambient.colorHex,
      HDRI_ENVIRONMENT_PRESETS.oficina.recommendedAmbient.colorHex
    );
    assert.ok(officeRig.ambient.intensity > warehouseRig.ambient.intensity);
  });

  it('calculates effective scene illuminance (Lux) responsive to light intensity, position, HDRi envMapIntensity, and on/off visibility', () => {
    const base = getPresetLightingRigConfig('dia');
    const baseLux = calculateEffectiveSceneLux(base, 24);

    const boosted = {
      ...base,
      ambient: { ...base.ambient, intensity: base.ambient.intensity + 1.0 },
      directional: { ...base.directional, intensity: base.directional.intensity + 1.5 },
      point: {
        ...base.point,
        intensity: base.point.intensity + 2.0,
        position: [0, 1.5, 0] as [number, number, number],
      },
      envMapIntensity: 2.5,
    };
    const boostedLux = calculateEffectiveSceneLux(boosted, 24);
    assert.ok(boostedLux > baseLux, `Expected boostedLux (${boostedLux}) > baseLux (${baseLux})`);

    // Turning off directional light lowers Lux
    const withoutDirectional = toggleLightVisibility(base, 'directional', false);
    const luxNoDir = calculateEffectiveSceneLux(withoutDirectional, 24);
    assert.ok(luxNoDir < baseLux, `Expected luxNoDir (${luxNoDir}) < baseLux (${baseLux})`);

    // Turning off all lights drops Lux to 0
    const allOff = setAllLightsVisibility(base, false);
    assert.equal(calculateEffectiveSceneLux(allOff, 24), 0);
    assert.deepEqual(getActiveLightsSummary(allOff), {
      activeCount: 0,
      totalCount: 3,
      allEnabled: false,
      noneEnabled: true,
    });
  });
});
