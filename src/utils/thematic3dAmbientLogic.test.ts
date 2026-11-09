import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  THEMATIC_AMBIENT_LAYER_Z_INDEX,
  FOREGROUND_CONTENT_Z_INDEX,
  CATEGORY_BAR_HD_Z_INDEX,
  LOGO_PEDESTAL_HD_Z_INDEX,
  MODAL_AND_DRAWER_Z_INDEX,
  ERP_INTERACTIVE_LAYER_Z_INDEX,
  generateCommemorative3dFloatingFigures,
  getCommemorativeBannerArtConfig,
  getDynamicZIndexConfig,
  getDynamicElementZIndexStyle,
  verifyLayerAndInteractionCompliance,
} from './thematic3dAmbientLogic';
import { ECUADOR_FESTIVE_THEMES } from './ecuadorThemes';
import { EcuadorFestiveThemeId } from '../types/erp';

describe('3D Commemorative Ambient Figures & Strict Layer Hierarchy', () => {
  it('1. Dibujitos 3D Conmemorativos en Movimiento: generates 12 multi-depth 3D figures across all 10 themes', () => {
    const themeIds = Object.keys(ECUADOR_FESTIVE_THEMES) as EcuadorFestiveThemeId[];
    for (const themeId of themeIds) {
      const figures = generateCommemorative3dFloatingFigures(themeId);
      assert.equal(figures.length, 12);

      const depthPlanes = new Set(figures.map((f) => f.depthPlane));
      assert.equal(depthPlanes.has('far'), true);
      assert.equal(depthPlanes.has('mid'), true);
      assert.equal(depthPlanes.has('near'), true);

      for (const fig of figures) {
        assert.equal(fig.themeId, themeId);
        assert.equal(fig.pointerEvents, 'none');
        assert.equal(fig.userSelect, 'none');
        assert.ok(fig.sizePx >= 34 && fig.sizePx <= 64);
      }
    }
  });

  it('2. Jerarquía de Capas Estricta y Gestor Dinámico de Z-Index: ambient layer (z-index: 10) vs ERP bars & modals (z-index: 9999)', () => {
    assert.equal(THEMATIC_AMBIENT_LAYER_Z_INDEX, 10);
    assert.equal(FOREGROUND_CONTENT_Z_INDEX, 20);
    assert.equal(CATEGORY_BAR_HD_Z_INDEX, 40);
    assert.equal(LOGO_PEDESTAL_HD_Z_INDEX, 50);
    assert.equal(MODAL_AND_DRAWER_Z_INDEX, 9999);
    assert.equal(ERP_INTERACTIVE_LAYER_Z_INDEX, 9999);

    const dynamicConfig = getDynamicZIndexConfig(2);
    assert.equal(dynamicConfig.ambient3dZIndex, 10);
    assert.equal(dynamicConfig.erpBarZIndex, 9999);
    assert.equal(dynamicConfig.erpModalZIndex, 9999);
    assert.equal(dynamicConfig.erpInteractiveZIndex, 9999);
    assert.equal(dynamicConfig.cssVariables['--z-ambient-3d-container'], '10');
    assert.equal(dynamicConfig.cssVariables['--z-erp-interactive-layer'], '9999');
    assert.equal(dynamicConfig.cssVariables['--z-erp-bar-layer'], '9999');
    assert.equal(dynamicConfig.cssVariables['--z-erp-modal-layer'], '9999');

    const ambientStyle = getDynamicElementZIndexStyle('ambient_3d');
    assert.equal(ambientStyle.zIndex, 10);
    assert.equal(ambientStyle.pointerEvents, 'none');

    const erpBarStyle = getDynamicElementZIndexStyle('erp_bar');
    assert.equal(erpBarStyle.zIndex, 9999);
    assert.equal(erpBarStyle.isolation, 'isolate');

    const erpModalStyle = getDynamicElementZIndexStyle('erp_modal');
    assert.equal(erpModalStyle.zIndex, 9999);
    assert.equal(erpModalStyle.isolation, 'isolate');

    const check = verifyLayerAndInteractionCompliance({
      ambientZIndex: THEMATIC_AMBIENT_LAYER_Z_INDEX,
      categoryBarZIndex: CATEGORY_BAR_HD_Z_INDEX,
      logoZIndex: LOGO_PEDESTAL_HD_Z_INDEX,
      erpBarZIndex: ERP_INTERACTIVE_LAYER_Z_INDEX,
      modalZIndex: MODAL_AND_DRAWER_Z_INDEX,
      pointerEvents: 'none',
      userSelect: 'none',
    });
    assert.equal(check.valid, true);
    assert.equal(check.isBehindModals, true);
    assert.equal(check.isBehindLogoAndCategoryBar, true);
    assert.equal(check.isBehindErpBars, true);
    assert.equal(check.isClickThrough, true);
  });

  it('3. Imágenes y Banners Conmemorativos: returns color-harmonized banner art config and supports custom commemorative titles', () => {
    const quitoBanner = getCommemorativeBannerArtConfig('quito', 'Bicentenario Quiteño 2026');
    assert.equal(quitoBanner.themeId, 'quito');
    assert.equal(quitoBanner.commemorativeTitle, 'Bicentenario Quiteño 2026');
    assert.equal(quitoBanner.pointerEvents, 'none');
    assert.equal(quitoBanner.userSelect, 'none');
    assert.ok(quitoBanner.primaryStop.length > 0);
  });
});

