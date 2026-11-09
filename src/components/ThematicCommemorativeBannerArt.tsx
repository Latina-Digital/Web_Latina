import React from 'react';
import { EcuadorFestiveThemeId } from '../types/erp';
import { getCommemorativeBannerArtConfig } from '../utils/thematic3dAmbientLogic';

/**
 * Renders a realistic 3D volumetric commemorative SVG figure (with radial gradients,
 * specular highlights, bevel volume, and depth shadow) for each theme and variant (0, 1, 2).
 */
export function renderCommemorative3dFigureSvg(
  themeId: EcuadorFestiveThemeId,
  variantIndex: 0 | 1 | 2,
  uid: string
): React.ReactNode {
  switch (themeId) {
    case 'quito': {
      if (variantIndex === 0) {
        // Trompo Quiteño 3D con franjas y punta metálica
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`uio-body-${uid}`} cx="34%" cy="28%" r="68%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="35%" stopColor="#F39C12" />
                <stop offset="72%" stopColor="#922B21" />
                <stop offset="100%" stopColor="#154360" />
              </radialGradient>
              <radialGradient id={`uio-cap-${uid}`} cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FFFDE7" />
                <stop offset="55%" stopColor="#FFD100" />
                <stop offset="100%" stopColor="#B7950B" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="108" rx="22" ry="5" fill="rgba(0,0,0,0.28)" />
            <path
              d="M60 18 C86 18, 94 44, 86 64 C78 82, 65 94, 60 104 C55 94, 42 82, 34 64 C26 44, 34 18, 60 18 Z"
              fill={`url(#uio-body-${uid})`}
              stroke="#FFD100"
              strokeWidth="2.2"
            />
            <path d="M32 45 Q60 56 88 45" stroke="#FFD100" strokeWidth="4" fill="none" />
            <path d="M34 57 Q60 68 86 57" stroke="#154360" strokeWidth="5.5" fill="none" />
            <ellipse
              cx="46"
              cy="36"
              rx="7"
              ry="13"
              fill="rgba(255,255,255,0.45)"
              transform="rotate(-22 46 36)"
            />
            <circle cx="60" cy="15" r="6" fill={`url(#uio-cap-${uid})`} />
            <polygon points="57,102 63,102 60,113" fill="#E2E8F0" />
          </svg>
        );
      }
      if (variantIndex === 1) {
        // Guitarra / Rondador Festivo Quiteño 3D
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`uio-gtr-${uid}`} cx="35%" cy="32%" r="68%">
                <stop offset="0%" stopColor="#F5B041" />
                <stop offset="55%" stopColor="#BA4A00" />
                <stop offset="100%" stopColor="#4A235A" />
              </radialGradient>
            </defs>
            <g transform="rotate(-24 60 60)">
              <rect x="55" y="10" width="10" height="44" rx="3" fill="#154360" stroke="#FFD100" strokeWidth="1.5" />
              <circle cx="60" cy="58" r="18" fill={`url(#uio-gtr-${uid})`} stroke="#FFD100" strokeWidth="2" />
              <circle cx="60" cy="84" r="24" fill={`url(#uio-gtr-${uid})`} stroke="#FFD100" strokeWidth="2.2" />
              <circle cx="60" cy="70" r="8" fill="#154360" stroke="#FFD100" strokeWidth="2" />
              <rect x="52" y="92" width="16" height="4" rx="2" fill="#FFD100" />
              <ellipse cx="48" cy="78" rx="5" ry="10" fill="rgba(255,255,255,0.38)" />
            </g>
          </svg>
        );
      }
      // Globo Conmemorativo Azul y Rojo de Quito 3D
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible pointer-events-none select-none"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`uio-orb-${uid}`} cx="35%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#FF8A80" />
              <stop offset="48%" stopColor="#C0392B" />
              <stop offset="100%" stopColor="#154360" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="52" r="32" fill={`url(#uio-orb-${uid})`} stroke="#FFD100" strokeWidth="2.5" />
          <path d="M29 52 Q60 64 91 52" stroke="#FFD100" strokeWidth="3.5" fill="none" />
          <ellipse cx="46" cy="36" rx="9" ry="5" fill="rgba(255,255,255,0.48)" transform="rotate(-28 46 36)" />
          <rect x="50" y="90" width="20" height="14" rx="4" fill="#B9770E" stroke="#FFD100" strokeWidth="1.8" />
        </svg>
      );
    }

    case 'guayaquil': {
      if (variantIndex === 0) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`gye-orb-${uid}`} cx="34%" cy="28%" r="68%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="45%" stopColor="#009FE3" />
                <stop offset="100%" stopColor="#0B2861" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="36" fill={`url(#gye-orb-${uid})`} stroke="#FFFFFF" strokeWidth="2.5" />
            <polygon
              points="60,22 69,45 94,45 74,60 81,84 60,69 39,84 46,60 26,45 51,45"
              fill="#FFFFFF"
              stroke="#0284C7"
              strokeWidth="1.5"
            />
            <ellipse cx="44" cy="36" rx="9" ry="4.5" fill="rgba(255,255,255,0.55)" transform="rotate(-28 44 36)" />
          </svg>
        );
      }
      if (variantIndex === 1) {
        // Faro de Santa Ana 3D
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`gye-faro-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <polygon points="44,96 50,36 70,36 76,96" fill={`url(#gye-faro-${uid})`} stroke="#0B2861" strokeWidth="2" />
            <rect x="46" y="54" width="28" height="10" fill="#009FE3" />
            <rect x="45" y="74" width="30" height="10" fill="#009FE3" />
            <circle cx="60" cy="28" r="10" fill="#FEF08A" stroke="#0284C7" strokeWidth="2" />
            <path d="M48 22 C48 12, 72 12, 72 22 Z" fill="#0B2861" />
          </svg>
        );
      }
      // Esfera Celeste y Blanco Perla del Pacífico 3D
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible pointer-events-none select-none"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`gye-pearl-${uid}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#0369A1" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="32" fill={`url(#gye-pearl-${uid})`} stroke="#38BDF8" strokeWidth="2" />
          <ellipse cx="48" cy="44" rx="8" ry="5" fill="rgba(255,255,255,0.75)" transform="rotate(-25 48 44)" />
        </svg>
      );
    }

    case 'halloween': {
      if (variantIndex === 0) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`hw-pk-${uid}`} cx="36%" cy="30%" r="68%">
                <stop offset="0%" stopColor="#FFCC80" />
                <stop offset="45%" stopColor="#FF6D00" />
                <stop offset="85%" stopColor="#BF360C" />
                <stop offset="100%" stopColor="#3B0764" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="68" rx="34" ry="27" fill={`url(#hw-pk-${uid})`} stroke="#FFB74D" strokeWidth="1.5" />
            <ellipse cx="60" cy="68" rx="21" ry="27" fill={`url(#hw-pk-${uid})`} stroke="#E65100" strokeWidth="1.2" />
            <polygon points="45,62 52,52 55,64" fill="#FFF59D" />
            <polygon points="75,62 68,52 65,64" fill="#FFF59D" />
            <path d="M42 75 Q60 88 78 75" stroke="#FFF59D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="44" cy="54" rx="7" ry="11" fill="rgba(255,255,255,0.36)" transform="rotate(-20 44 54)" />
          </svg>
        );
      }
      if (variantIndex === 1) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`hw-bat-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="50%" stopColor="#3B0764" />
                <stop offset="100%" stopColor="#090414" />
              </linearGradient>
            </defs>
            <path
              d="M12 58 C26 36, 42 42, 52 52 L60 42 L68 52 C78 42, 94 36, 108 58 C92 58, 78 68, 60 76 C42 68, 28 58, 12 58 Z"
              fill={`url(#hw-bat-${uid})`}
              stroke="#F59E0B"
              strokeWidth="1.8"
            />
            <circle cx="56" cy="54" r="2.2" fill="#FFD600" />
            <circle cx="64" cy="54" r="2.2" fill="#FFD600" />
          </svg>
        );
      }
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible pointer-events-none select-none"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`hw-orb-${uid}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="30" fill={`url(#hw-orb-${uid})`} stroke="#FF6D00" strokeWidth="2" />
          <ellipse cx="48" cy="46" rx="8" ry="4" fill="rgba(255,255,255,0.5)" transform="rotate(-25 48 46)" />
        </svg>
      );
    }

    case 'black_friday': {
      if (variantIndex === 0) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`bf-tag-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id={`bf-gld-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="45%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#A16207" />
              </linearGradient>
            </defs>
            <g transform="rotate(-14 60 60)">
              <rect
                x="30"
                y="22"
                width="60"
                height="74"
                rx="12"
                fill={`url(#bf-tag-${uid})`}
                stroke={`url(#bf-gld-${uid})`}
                strokeWidth="3"
              />
              <rect x="33" y="48" width="54" height="20" fill="#E11D48" />
              <circle cx="60" cy="34" r="5" fill="#020617" stroke={`url(#bf-gld-${uid})`} strokeWidth="2.5" />
              <text x="60" y="62" textAnchor="middle" fill="#FFD700" fontSize="14" fontWeight="900">
                VIP %
              </text>
            </g>
          </svg>
        );
      }
      if (variantIndex === 1) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`bf-coin-${uid}`} cx="35%" cy="28%" r="68%">
                <stop offset="0%" stopColor="#FEF9C3" />
                <stop offset="45%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#854D0E" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="32" fill={`url(#bf-coin-${uid})`} stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="60" cy="60" r="24" fill="none" stroke="#854D0E" strokeWidth="2" strokeDasharray="4 3" />
            <text x="60" y="67" textAnchor="middle" fill="#0F172A" fontSize="22" fontWeight="900">
              %
            </text>
            <ellipse cx="46" cy="42" rx="8" ry="4" fill="rgba(255,255,255,0.55)" transform="rotate(-25 46 42)" />
          </svg>
        );
      }
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible pointer-events-none select-none"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          aria-hidden="true"
        >
          <polygon
            points="68,16 38,62 58,62 46,104 86,52 64,52"
            fill="#FFD700"
            stroke="#E11D48"
            strokeWidth="2.5"
          />
        </svg>
      );
    }

    default: {
      // Universal 3D Commemorative Volumetric Sphere / Emblem / Paint Bucket adapted to active theme colors
      const art = getCommemorativeBannerArtConfig(themeId);
      if (variantIndex === 0) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`gen-sph-${uid}`} cx="34%" cy="28%" r="68%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="38%" stopColor={art.secondaryStop} />
                <stop offset="82%" stopColor={art.primaryStop} />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="33"
              fill={`url(#gen-sph-${uid})`}
              stroke={art.accentStop}
              strokeWidth="2.4"
            />
            <ellipse
              cx="46"
              cy="42"
              rx="9"
              ry="5"
              fill="rgba(255,255,255,0.58)"
              transform="rotate(-26 46 42)"
            />
          </svg>
        );
      }
      if (variantIndex === 1) {
        return (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`gen-star-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDE7" />
                <stop offset="50%" stopColor={art.secondaryStop} />
                <stop offset="100%" stopColor={art.accentStop} />
              </linearGradient>
            </defs>
            <polygon
              points="60,18 71,44 98,44 76,61 84,88 60,72 36,88 44,61 22,44 49,44"
              fill={`url(#gen-star-${uid})`}
              stroke={art.primaryStop}
              strokeWidth="2"
            />
          </svg>
        );
      }
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full overflow-visible pointer-events-none select-none"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`gen-bkt-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={art.primaryStop} />
              <stop offset="100%" stopColor={art.accentStop} />
            </linearGradient>
          </defs>
          <path
            d="M32 40 L88 40 L80 90 C80 96, 40 96, 40 90 Z"
            fill={`url(#gen-bkt-${uid})`}
            stroke={art.secondaryStop}
            strokeWidth="2.5"
          />
          <ellipse cx="60" cy="40" rx="28" ry="8" fill={art.secondaryStop} stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      );
    }
  }
}

interface ThematicCommemorativeBannerArtProps {
  themeId: EcuadorFestiveThemeId;
  customCommemorativeTitle?: string;
  variant?: 'hero-backdrop' | 'section-banner';
  className?: string;
}

/**
 * High-Resolution 3D Commemorative Banner Graphic harmonized with the page palette.
 * Enforces pointer-events: none and user-select: none so it never interferes with clicks or text selection.
 */
export const ThematicCommemorativeBannerArt: React.FC<
  ThematicCommemorativeBannerArtProps
> = ({
  themeId,
  customCommemorativeTitle,
  variant = 'hero-backdrop',
  className = '',
}) => {
  const art = getCommemorativeBannerArtConfig(themeId, customCommemorativeTitle);

  if (variant === 'section-banner') {
    return (
      <div
        data-testid="thematic-commemorative-section-banner"
        aria-hidden="true"
        className={`thematic-commemorative-banner pointer-events-none select-none relative overflow-hidden rounded-2xl border border-white/25 px-5 py-3.5 flex items-center justify-between gap-4 ${className}`}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          background: `linear-gradient(135deg, ${art.primaryStop} 0%, ${art.accentStop} 100%)`,
        }}
      >
        <div className="flex items-center gap-3 text-white pointer-events-none select-none">
          <div className="w-12 h-12 shrink-0 pointer-events-none select-none">
            {renderCommemorative3dFigureSvg(themeId, 0, `sec-${themeId}`)}
          </div>
          <div className="pointer-events-none select-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-200 block">
              {art.editionBadge}
            </span>
            <p className="text-sm sm:text-base font-extrabold text-white leading-tight">
              {art.commemorativeTitle} · {art.monumentTitle}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 pointer-events-none select-none">
          <div className="w-10 h-10 pointer-events-none select-none">
            {renderCommemorative3dFigureSvg(themeId, 1, `sec-b-${themeId}`)}
          </div>
          <div className="w-10 h-10 pointer-events-none select-none">
            {renderCommemorative3dFigureSvg(themeId, 2, `sec-c-${themeId}`)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="thematic-commemorative-banner-art"
      aria-hidden="true"
      className={`thematic-commemorative-banner absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 1440 680"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover pointer-events-none select-none"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`hero-bg-${themeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={art.primaryStop} />
            <stop offset="52%" stopColor="#091936" />
            <stop offset="100%" stopColor={art.accentStop} />
          </linearGradient>
          <radialGradient id={`hero-glow-a-${themeId}`} cx="78%" cy="36%" r="48%">
            <stop offset="0%" stopColor={art.secondaryStop} stopOpacity="0.46" />
            <stop offset="55%" stopColor={art.accentStop} stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`hero-glow-b-${themeId}`} cx="22%" cy="75%" r="45%">
            <stop offset="0%" stopColor={art.primaryStop} stopOpacity="0.55" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`hero-arch-${themeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>

        {/* Harmonized 3D Architectural Canvas Backdrop */}
        <rect width="1440" height="680" fill={`url(#hero-bg-${themeId})`} />
        <rect width="1440" height="680" fill={`url(#hero-glow-a-${themeId})`} />
        <rect width="1440" height="680" fill={`url(#hero-glow-b-${themeId})`} />

        {/* 3D Architectural Perspective Grid & Volumetric Waves */}
        <path
          d="M0 520 Q360 430 720 510 T1440 470 L1440 680 L0 680 Z"
          fill={`url(#hero-arch-${themeId})`}
        />
        <path
          d="M0 580 Q420 500 860 575 T1440 540 L1440 680 L0 680 Z"
          fill="rgba(255,255,255,0.06)"
        />

        {/* Panoramic 3D Commemorative Showcase Emblem Cluster on Right Side of Hero */}
        <g transform="translate(880, 95)" opacity="0.92">
          {/* Outer 3D Halo Ring */}
          <circle
            cx="230"
            cy="230"
            r="195"
            fill="rgba(255,255,255,0.05)"
            stroke={art.secondaryStop}
            strokeWidth="2"
            strokeDasharray="10 8"
          />
          <circle
            cx="230"
            cy="230"
            r="150"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
          />
        </g>
      </svg>

      {/* 3D Volumetric Commemorative Trio in Hero Right Showcase (pointer-events: none) */}
      <div
        className="hidden lg:flex items-center justify-center absolute right-12 top-1/2 -translate-y-1/2 w-[380px] h-[380px] pointer-events-none select-none"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="w-48 h-48 thematic-float-path-a pointer-events-none select-none">
          {renderCommemorative3dFigureSvg(themeId, 0, `hero-main-${themeId}`)}
        </div>
        <div className="w-28 h-28 absolute -top-2 left-4 thematic-float-path-b pointer-events-none select-none">
          {renderCommemorative3dFigureSvg(themeId, 1, `hero-top-${themeId}`)}
        </div>
        <div className="w-32 h-32 absolute bottom-2 right-2 thematic-float-path-c pointer-events-none select-none">
          {renderCommemorative3dFigureSvg(themeId, 2, `hero-bot-${themeId}`)}
        </div>
      </div>
    </div>
  );
};
