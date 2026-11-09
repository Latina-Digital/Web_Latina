import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STOREFRONT_SECTIONS_VISIBILITY,
  STOREFRONT_SECTION_DESCRIPTORS,
  computeAdaptiveNavbarMetrics,
  getActiveStorefrontSections,
  resolveValidStorefrontScreen,
  sanitizeSectionsVisibilityMap,
  setAllStorefrontSections,
  toggleStorefrontSection,
} from './storefrontSectionsConfig';
import {
  ECUADOR_FESTIVE_THEMES,
  getActiveFestiveTheme,
} from './ecuadorThemes';

describe('Storefront Sections Visibility & Adaptive Navbar Logic', () => {
  it('defaults all 11 storefront sections to active', () => {
    const active = getActiveStorefrontSections(DEFAULT_STOREFRONT_SECTIONS_VISIBILITY);
    assert.equal(active.length, 11);
    assert.equal(STOREFRONT_SECTION_DESCRIPTORS.length, 11);
  });

  it('toggles individual sections on and off while coupling active navigation list', () => {
    let map = { ...DEFAULT_STOREFRONT_SECTIONS_VISIBILITY };
    map = toggleStorefrontSection(map, 'blogs', false);
    map = toggleStorefrontSection(map, 'tendencias', false);
    map = toggleStorefrontSection(map, 'juego_3d', false);

    assert.equal(map.blogs, false);
    assert.equal(map.tendencias, false);
    assert.equal(map.juego_3d, false);
    assert.equal(map.inicio, true);

    const activeList = getActiveStorefrontSections(map);
    assert.equal(activeList.length, 8);
    assert.ok(!activeList.some((s) => s.id === 'blogs'));
  });

  it('prevents blank storefront by keeping inicio active if all navigable screens are disabled', () => {
    const allFalse = {
      inicio: false,
      productos: false,
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
    const sanitized = sanitizeSectionsVisibilityMap(allFalse);
    assert.equal(sanitized.inicio, true);
  });

  it('resolves valid fallback screen when active screen is deactivated in ERP', () => {
    const map = setAllStorefrontSections(false); // only inicio & productos active
    assert.equal(resolveValidStorefrontScreen('disenador', map), 'inicio');
    assert.equal(resolveValidStorefrontScreen('productos', map), 'productos');
  });

  it('computes adaptive navbar metrics according to active section count', () => {
    const essentialMap = setAllStorefrontSections(false); // 2 active
    const metricsFew = computeAdaptiveNavbarMetrics(essentialMap);
    assert.equal(metricsFew.activeCount, 2);
    assert.ok(metricsFew.containerGapClass.includes('gap-3'));

    const fullMetrics = computeAdaptiveNavbarMetrics(DEFAULT_STOREFRONT_SECTIONS_VISIBILITY);
    assert.equal(fullMetrics.activeCount, 11);
  });
});

describe('Festive Themes including Halloween & Black Friday 3D Ambience', () => {
  it('includes halloween and black_friday themes with complete 3D skeuomorphic and particle tokens', () => {
    const halloween = getActiveFestiveTheme('halloween');
    assert.equal(halloween.id, 'halloween');
    assert.equal(halloween.particleMotif, 'halloween_magic');
    assert.ok(halloween.name.toLowerCase().includes('halloween'));
    assert.ok(halloween.particleColors.length >= 4);

    const blackFriday = getActiveFestiveTheme('black_friday');
    assert.equal(blackFriday.id, 'black_friday');
    assert.equal(blackFriday.particleMotif, 'black_friday_luxury');
    assert.ok(blackFriday.name.toLowerCase().includes('black friday'));
    assert.ok(blackFriday.bevelHighlightRgba.length > 0);
  });

  it('provides 3D glassmorphic, skeuomorphic, and illustration tokens for all 10 themes', () => {
    const allThemes = Object.values(ECUADOR_FESTIVE_THEMES);
    assert.equal(allThemes.length, 10);
    for (const theme of allThemes) {
      assert.ok(theme.glassTintRgba, `Missing glassTintRgba for ${theme.id}`);
      assert.ok(theme.glowColorRgba, `Missing glowColorRgba for ${theme.id}`);
      assert.ok(theme.cardSurfaceGradient, `Missing cardSurfaceGradient for ${theme.id}`);
      assert.ok(theme.modalHeaderGradient, `Missing modalHeaderGradient for ${theme.id}`);
      assert.ok(theme.illustrationLabel, `Missing illustrationLabel for ${theme.id}`);
    }
  });
});
