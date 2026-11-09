import React, { useEffect, useMemo, useRef } from 'react';
import { EcuadorFestiveThemeId } from '../types/erp';
import { getActiveFestiveTheme } from '../utils/ecuadorThemes';
import {
  THEMATIC_AMBIENT_LAYER_Z_INDEX,
  generateCommemorative3dFloatingFigures,
} from '../utils/thematic3dAmbientLogic';
import { renderCommemorative3dFigureSvg } from './ThematicCommemorativeBannerArt';

interface ThematicAmbientCanvasProps {
  activeThemeId: EcuadorFestiveThemeId;
  customCommemorativeTitle?: string;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depthLayer: 0 | 1 | 2; // 0 = far/blurred, 1 = mid, 2 = foreground/crisp
  rotation: number;
  vRot: number;
  color: string;
  opacity: number;
  shapeIndex: number;
}

export const ThematicAmbientCanvas: React.FC<ThematicAmbientCanvasProps> = ({
  activeThemeId,
  customCommemorativeTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = getActiveFestiveTheme(activeThemeId);

  const floatingFigures = useMemo(
    () => generateCommemorative3dFloatingFigures(activeThemeId, customCommemorativeTitle),
    [activeThemeId, customCommemorativeTitle]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / Math.max(1, width) - 0.5) * 24;
      mouseY = (e.clientY / Math.max(1, height) - 0.5) * 24;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const palette =
      theme.particleColors.length > 0
        ? theme.particleColors
        : ['#0B2861', '#FFD100', '#E3000F'];

    const particleCount = 24;
    const particles: AmbientParticle[] = Array.from({ length: particleCount }, (_, idx) => {
      const depthLayer = (idx % 3) as 0 | 1 | 2;
      const baseSize = depthLayer === 0 ? 7 : depthLayer === 1 ? 12 : 17;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (0.35 + depthLayer * 0.2),
        vy: -0.25 - Math.random() * (0.4 + depthLayer * 0.25),
        size: baseSize + Math.random() * 5,
        depthLayer,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.018,
        color: palette[idx % palette.length],
        opacity: depthLayer === 0 ? 0.14 : depthLayer === 1 ? 0.22 : 0.3,
        shapeIndex: idx % 3,
      };
    });

    const drawParticleShape = (p: AmbientParticle) => {
      ctx.save();
      const parallaxX = p.x + mouseX * (p.depthLayer + 1) * 0.35;
      const parallaxY = p.y + mouseY * (p.depthLayer + 1) * 0.35;
      ctx.translate(parallaxX, parallaxY);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      const s = p.size;
      const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.2, s * 0.05, 0, 0, s * 0.7);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.45, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1;

      if (theme.particleMotif === 'halloween_magic') {
        if (p.shapeIndex === 0) {
          ctx.beginPath();
          ctx.ellipse(0, 0, s * 0.65, s * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (p.shapeIndex === 1) {
          ctx.beginPath();
          ctx.moveTo(-s * 0.8, 0);
          ctx.quadraticCurveTo(-s * 0.4, -s * 0.5, 0, -s * 0.15);
          ctx.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.8, 0);
          ctx.quadraticCurveTo(s * 0.3, s * 0.3, 0, s * 0.45);
          ctx.quadraticCurveTo(-s * 0.3, s * 0.3, -s * 0.8, 0);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (theme.particleMotif === 'black_friday_luxury') {
        if (p.shapeIndex === 0) {
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.65);
          ctx.lineTo(s * 0.5, 0);
          ctx.lineTo(0, s * 0.65);
          ctx.lineTo(-s * 0.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(angle) * s * 0.65, Math.sin(angle) * s * 0.65);
            const mid = angle + Math.PI / 4;
            ctx.lineTo(Math.cos(mid) * s * 0.22, Math.sin(mid) * s * 0.22);
          }
          ctx.closePath();
          ctx.fill();
        }
      } else {
        if (p.shapeIndex === 0) {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const inner = outer + Math.PI / 5;
            ctx.lineTo(Math.cos(outer) * s * 0.6, Math.sin(outer) * s * 0.6);
            ctx.lineTo(Math.cos(inner) * s * 0.26, Math.sin(inner) * s * 0.26);
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shapeIndex === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(-s * 0.35, -s * 0.2, s * 0.7, s * 0.4);
        }
      }

      ctx.restore();
    };

    let timerId: number | null = null;
    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx * 2.2;
        p.y += p.vy * 2.2;
        p.rotation += p.vRot * 2.2;

        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;

        drawParticleShape(p);
      }
      timerId = window.setTimeout(renderFrame, 65);
    };

    renderFrame();

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [activeThemeId, theme]);

  return (
    <div
      data-testid="thematic-ambient-root"
      data-z-layer="ambient-3d"
      data-z-managed={String(THEMATIC_AMBIENT_LAYER_Z_INDEX)}
      aria-hidden="true"
      className="thematic-ambient-root fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: THEMATIC_AMBIENT_LAYER_Z_INDEX,
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Layer 1: Smooth Ambient 3D Particle Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="thematic-ambient-canvas"
        aria-hidden="true"
        className="w-full h-full pointer-events-none select-none"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />

      {/* Layer 2: Floating 3D Volumetric Commemorative SVG Figures across the Viewport */}
      <div
        data-testid="thematic-ambient-3d-figures"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {floatingFigures.map((fig) => (
          <div
            key={fig.id}
            data-testid="commemorative-3d-figure"
            data-depth={fig.depthPlane}
            aria-hidden="true"
            className={`thematic-3d-figure absolute pointer-events-none select-none ${fig.trajectoryClass}`}
            style={{
              left: `${fig.leftPct}%`,
              top: `${fig.topPct}%`,
              width: `${fig.sizePx}px`,
              height: `${fig.sizePx}px`,
              opacity: fig.opacity,
              filter:
                fig.blurPx > 0
                  ? `blur(${fig.blurPx}px) drop-shadow(0 8px 14px rgba(0,0,0,0.22))`
                  : 'drop-shadow(0 12px 20px rgba(0,0,0,0.28))',
              animationDuration: `${fig.durationSec}s`,
              animationDelay: `-${fig.delaySec}s`,
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {renderCommemorative3dFigureSvg(fig.themeId, fig.variantIndex, fig.id)}
          </div>
        ))}
      </div>
    </div>
  );
};
