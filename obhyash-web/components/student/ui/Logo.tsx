import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  colorMode?: 'light' | 'dark' | 'print';
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  colorMode = 'light',
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-16',
    xl: 'h-24',
  };

  const textColor =
    colorMode === 'print' ? 'black' : colorMode === 'dark' ? 'white' : 'black';
  const accentColor = colorMode === 'print' ? 'black' : '#9f1239'; // deep red (red-900)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document Base */}
        <path
          d="M 14 11 C 14 9.3 15.3 8 17 8 H 36 L 46 18 V 49 C 46 50.7 44.7 52 43 52 H 17 C 15.3 52 14 50.7 14 49 Z"
          fill={accentColor}
          fillOpacity="0.1"
        />
        <path
          d="M 14 11 C 14 9.3 15.3 8 17 8 H 36 L 46 18 V 49 C 46 50.7 44.7 52 43 52 H 17 C 15.3 52 14 50.7 14 49 Z"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Folded Corner Detail */}
        <path
          d="M 36 8 V 18 H 46"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Horizontal Ruled Lines */}
        <path
          d="M 20 24 H 40"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 20 31 H 40"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 20 38 H 40"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 20 45 H 32"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Stylus / Pen */}
        <g transform="translate(36, 28) rotate(-45)">
          {/* Drop shadow */}
          <path
            d="M -24 -1.5 L -21 -3 L -11 -4 L 20 -4 L 22 -4 C 23.5 -4, 24 -3, 24 -1.5 V 1.5 C 24 3, 23.5 4, 22 4 L 20 4 L -11 4 L -21 3 L -24 1.5 Z"
            fill="#000000"
            fillOpacity={colorMode === 'dark' ? 0.3 : 0.15}
            transform="translate(0, 4)"
          />

          {/* Pen Base Shapes */}
          <path
            d="M -8 -4 L 20 -4 L 20 4 L -8 4 Z"
            fill={colorMode === 'dark' ? '#f8fafc' : '#e5e7eb'}
          />
          <path
            d="M 20 -4 L 22 -4 C 23.5 -4, 24 -3, 24 -1.5 V 1.5 C 24 3, 23.5 4, 22 4 L 20 4 Z"
            fill="#9ca3af"
          />
          <path
            d="M -11 -4 L -8 -4 L -8 4 L -11 4 Z"
            fill={colorMode === 'dark' ? '#d1d5db' : '#9ca3af'}
          />
          <path
            d="M -21 -1.5 L -11 -4 L -11 4 L -21 1.5 Z"
            fill={colorMode === 'dark' ? '#4b5563' : '#374151'}
          />
          <path
            d="M -24 -0.5 L -21 -1.5 L -21 1.5 L -24 0.5 Z"
            fill="#9ca3af"
          />

          {/* 3D Shading Overlay */}
          <path
            d="M -24 0 L 24 0 V 1.5 C 24 3, 23.5 4, 22 4 L 20 4 L -11 4 L -21 1.5 L -24 0.5 Z"
            fill="#000000"
            fillOpacity="0.2"
          />

          {/* Highlight Overlay */}
          <path
            d="M -22 -1 L 22 -3 V -1 L -22 0 Z"
            fill="#ffffff"
            fillOpacity={colorMode === 'dark' ? 0.4 : 0.8}
          />

          {/* Circular reflection detail */}
          <ellipse
            cx="14"
            cy="-2"
            rx="2"
            ry="1"
            fill="#ffffff"
            fillOpacity={colorMode === 'dark' ? 0.4 : 0.8}
          />
        </g>

        {variant === 'full' && (
          <text
            x="65"
            y="42"
            fill={textColor}
            style={{
              fontFamily: 'var(--font-anek), serif',
              fontSize: '32px',
              fontWeight: '900',
            }}
          >
            অ<tspan fill={accentColor}>ভ্যা</tspan>স
          </text>
        )}
      </svg>
    </div>
  );
};

export default Logo;
