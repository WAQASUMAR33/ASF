import * as React from 'react';
import Image from 'next/image';

interface AsfLogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

export default function AsfLogo({ size = 52, showText = true, light = true }: AsfLogoProps) {
  const primaryColor = light ? '#ffffff' : '#1e5631';
  const subColor = light ? '#a7f3d0' : '#56615b';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <Image
        src="/asf_logo.png"
        alt="Airports Security Force"
        width={size}
        height={size}
        unoptimized
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
        priority
      />

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
            Procurement Branch Headquarters ASF • Govt of Pakistan
          </div>
        </div>
      )}
    </div>
  );
}
