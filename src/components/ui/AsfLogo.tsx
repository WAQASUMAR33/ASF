import * as React from 'react';

interface AsfLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

export default function AsfLogo({ size = 52, showText = true, light = true }: AsfLogoProps) {
  const primaryColor = light ? '#ffffff' : '#1e5631';
  const goldColor = light ? '#f39c12' : '#d4af37';
  const subColor = light ? '#a7f3d0' : '#56615b';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Ring */}
        <circle cx="50" cy="50" r="46" stroke={goldColor} strokeWidth="3" fill={light ? "rgba(30, 86, 49, 0.4)" : "rgba(30, 86, 49, 0.05)"} />
        <circle cx="50" cy="50" r="41" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Wings Emblem Left & Right */}
        <path
          d="M 16 48 C 24 38, 38 36, 45 42 C 38 46, 26 50, 16 48 Z"
          fill={goldColor}
        />
        <path
          d="M 84 48 C 76 38, 62 36, 55 42 C 62 46, 74 50, 84 48 Z"
          fill={goldColor}
        />

        {/* Center Security Shield */}
        <path
          d="M 50 20 L 72 30 V 55 C 72 70, 50 82, 50 82 C 50 82, 28 70, 28 55 V 30 L 50 20 Z"
          fill="#1e5631"
          stroke={goldColor}
          strokeWidth="2.5"
        />

        {/* Crescent & Star / Security Key Inside Shield */}
        <circle cx="50" cy="46" r="10" fill={goldColor} />
        <circle cx="53" cy="44" r="9" fill="#1e5631" />
        
        {/* Five Pointed Star */}
        <polygon
          points="56,38 57.5,42 61.5,42 58.2,44.5 59.5,48.5 56,46 52.5,48.5 53.8,44.5 50.5,42 54.5,42"
          fill={goldColor}
        />

        {/* Bottom Sword / Protection Ribbon */}
        <path
          d="M 38 65 H 62 L 50 74 Z"
          fill={goldColor}
        />
      </svg>

      {showText && (
        <div>
          <div
            style={{
              fontWeight: 900,
              fontSize: '1.2rem',
              letterSpacing: '0.5px',
              color: primaryColor,
              lineHeight: 1.1,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            AIRPORTS SECURITY FORCE
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: subColor,
              letterSpacing: '0.5px',
              fontFamily: 'Inter, sans-serif',
              marginTop: '2px',
            }}
          >
            Logistics & Inventory Division • Govt of Pakistan
          </div>
        </div>
      )}
    </div>
  );
}
