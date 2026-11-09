import React, { useEffect } from 'react';
import {
  ERP_INTERACTIVE_LAYER_Z_INDEX,
  THEMATIC_AMBIENT_LAYER_Z_INDEX,
  getDynamicZIndexConfig,
  syncDomDynamicZIndexLayers,
} from '../utils/thematic3dAmbientLogic';

interface DynamicZIndexManagerProps {
  activeTrigger?: string | number | boolean;
}

/**
 * Dynamic Z-Index Layer Manager:
 * Explicitly enforces that the 3D figures container stays at z-index: 10
 * while all interactive ERP elements (modals, drawers, headers, navigation bars,
 * category bars, and action bars) maintain a superior z-index (z-index: 9999)
 * to prevent any visual overlap or interaction interference.
 */
export const DynamicZIndexManager: React.FC<DynamicZIndexManagerProps> = ({
  activeTrigger,
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const config = getDynamicZIndexConfig();
    const rootStyle = document.documentElement.style;
    Object.entries(config.cssVariables).forEach(([key, val]) => {
      rootStyle.setProperty(key, val);
    });

    // Initial synchronous pass
    syncDomDynamicZIndexLayers(document);

    // Observe dynamic DOM mutations (opening/closing modals, drawers, dropdowns, ERP subviews)
    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncDomDynamicZIndexLayers(document);
      });
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [activeTrigger]);

  return (
    <span
      data-testid="dynamic-z-index-manager"
      data-ambient-z={String(THEMATIC_AMBIENT_LAYER_Z_INDEX)}
      data-erp-interactive-z={String(ERP_INTERACTIVE_LAYER_Z_INDEX)}
      aria-hidden="true"
      className="hidden"
    />
  );
};
