import React from 'react';
import { EcuadorFestiveThemeId } from '../types/erp';

interface ThematicCornerIllustrationProps {
  themeId: EcuadorFestiveThemeId;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThematicCornerIllustration: React.FC<ThematicCornerIllustrationProps> = ({
  themeId,
  position = 'top-right',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-16 h-16',
    lg: 'w-22 h-22',
  }[size];

  const posClasses = {
    'top-right': 'absolute -top-2 -right-2 z-0 pointer-events-none select-none',
    'top-left': 'absolute -top-2 -left-2 z-0 pointer-events-none select-none',
    'bottom-right': 'absolute -bottom-2 -right-2 z-0 pointer-events-none select-none',
    'bottom-left': 'absolute -bottom-2 -left-2 z-0 pointer-events-none select-none',
    inline: 'relative z-0 inline-flex items-center justify-center shrink-0 pointer-events-none select-none',
  }[position];

  const renderThemeSvg = () => {
    switch (themeId) {
      case 'halloween':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <radialGradient id="hw-pumpkin" cx="38%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#FFB74D" />
                <stop offset="45%" stopColor="#FF6D00" />
                <stop offset="85%" stopColor="#BF360C" />
                <stop offset="100%" stopColor="#4A148C" />
              </radialGradient>
              <linearGradient id="hw-hat" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7E22CE" />
                <stop offset="55%" stopColor="#3B0764" />
                <stop offset="100%" stopColor="#0F051D" />
              </linearGradient>
              <radialGradient id="hw-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF59D" />
                <stop offset="60%" stopColor="#FFD600" />
                <stop offset="100%" stopColor="#FF6D00" />
              </radialGradient>
            </defs>
            {/* Murciélago flotante superior */}
            <path
              d="M15 24 C22 16, 28 20, 32 24 C36 20, 42 16, 49 24 C43 24, 38 28, 32 30 C26 28, 21 24, 15 24 Z"
              fill="#1E0B36"
              stroke="#A855F7"
              strokeWidth="1.2"
            />
            {/* Calabaza 3D Volumétrica */}
            <ellipse cx="52" cy="62" rx="30" ry="24" fill="url(#hw-pumpkin)" />
            <ellipse cx="52" cy="62" rx="20" ry="24" fill="url(#hw-pumpkin)" stroke="#E65100" strokeWidth="1.2" />
            <ellipse cx="52" cy="62" rx="10" ry="24" fill="url(#hw-pumpkin)" stroke="#FFB74D" strokeWidth="0.8" />
            {/* Reflejo especular 3D */}
            <ellipse cx="38" cy="52" rx="6" ry="10" fill="rgba(255,255,255,0.35)" transform="rotate(-18 38 52)" />
            {/* Ojos y sonrisa luminosos */}
            <polygon points="39,58 46,50 48,60" fill="url(#hw-glow)" />
            <polygon points="65,58 58,50 56,60" fill="url(#hw-glow)" />
            <polygon points="52,58 49,64 55,64" fill="url(#hw-glow)" />
            <path
              d="M37 68 L43 73 L48 69 L52 74 L56 69 L61 73 L67 68 L63 77 L52 79 L41 77 Z"
              fill="url(#hw-glow)"
            />
            {/* Sombrero de Bruja 3D */}
            <ellipse cx="52" cy="40" rx="28" ry="6" fill="url(#hw-hat)" stroke="#C084FC" strokeWidth="1.2" />
            <path d="M35 39 L50 10 L70 16 L66 39 Z" fill="url(#hw-hat)" stroke="#C084FC" strokeWidth="1.2" />
            <rect x="40" y="34" width="22" height="4" rx="2" fill="#FF6D00" />
            <rect x="48" y="33" width="6" height="6" rx="1" fill="#FFD600" />
          </svg>
        );

      case 'black_friday':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="bf-obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="45%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="bf-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="35%" stopColor="#FDE047" />
                <stop offset="70%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#A16207" />
              </linearGradient>
              <linearGradient id="bf-crimson" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="50%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
            </defs>
            {/* Destello Estrella Dorada */}
            <polygon
              points="50,6 59,26 80,16 68,36 90,46 68,56 80,76 59,66 50,88 41,66 20,76 32,56 10,46 32,36 20,16 41,26"
              fill="url(#bf-gold)"
              opacity="0.32"
            />
            {/* Etiqueta VIP 3D en Relieve */}
            <g transform="rotate(-12 52 52)">
              <rect
                x="24"
                y="22"
                width="54"
                height="62"
                rx="10"
                fill="url(#bf-obsidian)"
                stroke="url(#bf-gold)"
                strokeWidth="3"
              />
              {/* Franja Carmesí Cyber */}
              <rect x="26" y="42" width="50" height="18" fill="url(#bf-crimson)" />
              {/* Aro Dorado Superior */}
              <circle cx="51" cy="31" r="4.5" fill="#0F172A" stroke="url(#bf-gold)" strokeWidth="2.5" />
              {/* Símbolo % OFF 3D */}
              <text
                x="51"
                y="55"
                textAnchor="middle"
                fill="#FFD700"
                fontSize="13"
                fontWeight="900"
                fontFamily="Poppins, sans-serif"
              >
                BLACK
              </text>
              <text
                x="51"
                y="74"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="14"
                fontWeight="900"
                fontFamily="JetBrains Mono, monospace"
              >
                % VIP
              </text>
            </g>
            {/* Rayo Dorado 3D */}
            <polygon
              points="76,14 63,36 73,36 60,58 84,32 73,32"
              fill="url(#bf-gold)"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
          </svg>
        );

      case 'quito':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="uio-trompo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F39C12" />
                <stop offset="45%" stopColor="#C0392B" />
                <stop offset="100%" stopColor="#154360" />
              </linearGradient>
              <radialGradient id="uio-gold" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="55%" stopColor="#FFD100" />
                <stop offset="100%" stopColor="#B7950B" />
              </radialGradient>
            </defs>
            {/* Trompo Quiteño 3D */}
            <path
              d="M50 16 C72 16, 78 38, 72 54 C66 68, 54 78, 50 86 C46 78, 34 68, 28 54 C22 38, 28 16, 50 16 Z"
              fill="url(#uio-trompo)"
              stroke="#FFD100"
              strokeWidth="2"
            />
            {/* Franjas Azules y Rojas de Quito */}
            <path d="M27 38 Q50 46 73 38" stroke="#FFD100" strokeWidth="3.5" fill="none" />
            <path d="M28 48 Q50 56 72 48" stroke="#154360" strokeWidth="4.5" fill="none" />
            <circle cx="50" cy="14" r="5" fill="url(#uio-gold)" />
            <polygon points="48,85 52,85 50,94" fill="#E2E8F0" />
            {/* Reflejo 3D */}
            <ellipse cx="39" cy="32" rx="5" ry="9" fill="rgba(255,255,255,0.4)" transform="rotate(-20 39 32)" />
          </svg>
        );

      case 'guayaquil':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="gye-star" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="gye-ocean" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#009FE3" />
                <stop offset="100%" stopColor="#0B2861" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="52" r="34" fill="url(#gye-ocean)" stroke="#FFFFFF" strokeWidth="2.5" />
            {/* Estrella de Octubre 3D */}
            <polygon
              points="50,18 58,38 80,38 62,51 69,72 50,59 31,72 38,51 20,38 42,38"
              fill="url(#gye-star)"
              stroke="#0B2861"
              strokeWidth="1.5"
            />
            <ellipse cx="36" cy="32" rx="7" ry="4" fill="rgba(255,255,255,0.45)" transform="rotate(-30 36 32)" />
          </svg>
        );

      case 'carnaval':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="car-mask" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4081" />
                <stop offset="50%" stopColor="#8E24AA" />
                <stop offset="100%" stopColor="#00BCD4" />
              </linearGradient>
            </defs>
            {/* Plumas Festivas */}
            <path d="M32 34 C22 12, 38 8, 46 28" fill="#FFD100" />
            <path d="M50 30 C50 6, 64 8, 56 30" fill="#00E5FF" />
            <path d="M68 34 C78 12, 62 8, 54 28" fill="#FF4081" />
            {/* Antifaz 3D de Carnaval */}
            <path
              d="M16 46 C26 32, 44 36, 50 44 C56 36, 74 32, 84 46 C86 62, 68 70, 56 60 L50 66 L44 60 C32 70, 14 62, 16 46 Z"
              fill="url(#car-mask)"
              stroke="#FFD100"
              strokeWidth="2.5"
            />
            <ellipse cx="35" cy="50" rx="8" ry="5" fill="#1E1B4B" stroke="#FFD100" strokeWidth="1.5" />
            <ellipse cx="65" cy="50" rx="8" ry="5" fill="#1E1B4B" stroke="#FFD100" strokeWidth="1.5" />
          </svg>
        );

      case 'difuntos':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <radialGradient id="dif-bread" cx="38%" cy="30%" r="68%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="55%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </radialGradient>
            </defs>
            {/* Guagua de Pan Tradicional 3D */}
            <circle cx="50" cy="30" r="14" fill="url(#dif-bread)" stroke="#F59E0B" strokeWidth="1.5" />
            <path
              d="M32 48 C32 40, 68 40, 68 48 L72 74 C72 82, 28 82, 28 74 Z"
              fill="url(#dif-bread)"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            {/* Decoración de Glaseado Colada Morada */}
            <path d="M34 56 Q50 64 66 56" stroke="#EC4899" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M32 66 Q50 74 68 66" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="45" cy="28" r="2" fill="#4A148C" />
            <circle cx="55" cy="28" r="2" fill="#4A148C" />
            <path d="M46 34 Q50 38 54 34" stroke="#E11D48" strokeWidth="2" fill="none" />
          </svg>
        );

      case 'cuenca':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <radialGradient id="cue-dome" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="55%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </radialGradient>
            </defs>
            {/* Cúpulas Celestes de la Catedral de Cuenca 3D */}
            <path d="M22 68 C22 40, 46 40, 46 68 Z" fill="url(#cue-dome)" stroke="#F1C40F" strokeWidth="2" />
            <path d="M54 68 C54 40, 78 40, 78 68 Z" fill="url(#cue-dome)" stroke="#F1C40F" strokeWidth="2" />
            <path d="M35 68 C35 26, 65 26, 65 68 Z" fill="url(#cue-dome)" stroke="#F1C40F" strokeWidth="2.5" />
            <rect x="18" y="68" width="64" height="12" rx="4" fill="#C0392B" stroke="#F1C40F" strokeWidth="2" />
            <circle cx="50" cy="24" r="4" fill="#F1C40F" />
          </svg>
        );

      case 'navidad':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="nav-tree" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="55%" stopColor="#059669" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>
            </defs>
            <rect x="44" y="74" width="12" height="14" rx="2" fill="#78350F" />
            <polygon points="50,18 22,50 78,50" fill="url(#nav-tree)" stroke="#A7F3D0" strokeWidth="1.2" />
            <polygon points="50,34 18,66 82,66" fill="url(#nav-tree)" stroke="#A7F3D0" strokeWidth="1.2" />
            <polygon points="50,48 14,78 86,78" fill="url(#nav-tree)" stroke="#F4D03F" strokeWidth="1.5" />
            {/* Estrella Navideña */}
            <polygon
              points="50,6 54,15 64,15 56,21 59,30 50,24 41,30 44,21 36,15 46,15"
              fill="#FFD700"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            {/* Esferas 3D */}
            <circle cx="40" cy="48" r="4.5" fill="#EF4444" />
            <circle cx="60" cy="56" r="4.5" fill="#F59E0B" />
            <circle cx="36" cy="68" r="4.5" fill="#38BDF8" />
            <circle cx="64" cy="70" r="4.5" fill="#EF4444" />
          </svg>
        );

      case 'patrias':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            {/* Escarapela Tricolor Ecuatoriana 3D */}
            <circle cx="50" cy="50" r="34" fill="#F1C40F" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="23" fill="#0056B3" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="12" fill="#C0392B" stroke="#FFD700" strokeWidth="1.5" />
            <ellipse cx="38" cy="34" rx="8" ry="4" fill="rgba(255,255,255,0.45)" transform="rotate(-25 38 34)" />
          </svg>
        );

      case 'corporativo':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="corp-bucket" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="55%" stopColor="#0B2861" />
                <stop offset="100%" stopColor="#061838" />
              </linearGradient>
              <linearGradient id="corp-paint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF59D" />
                <stop offset="50%" stopColor="#FFD100" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            {/* Cubeta 3D Industrial Latina & Gota Dorada */}
            <path
              d="M26 36 L74 36 L68 80 C68 85, 32 85, 32 80 Z"
              fill="url(#corp-bucket)"
              stroke="#FFD100"
              strokeWidth="2.2"
            />
            <ellipse cx="50" cy="36" rx="24" ry="7" fill="url(#corp-paint)" stroke="#FFFFFF" strokeWidth="1.5" />
            {/* Derrame de Pintura 3D */}
            <path
              d="M36 39 L36 56 C36 60, 42 60, 42 56 L42 42 L52 42 L52 64 C52 68, 59 68, 59 64 L59 40 Z"
              fill="url(#corp-paint)"
            />
            {/* Franja Roja Corporativa */}
            <path d="M30 66 Q50 74 70 66" stroke="#E3000F" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${posClasses} ${sizeClasses} thematic-svg-animated pointer-events-none select-none ${className}`}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      data-testid={`thematic-corner-svg-${themeId}`}
      aria-hidden="true"
    >
      {renderThemeSvg()}
    </div>
  );
};
