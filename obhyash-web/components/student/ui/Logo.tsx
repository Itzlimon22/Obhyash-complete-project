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
  const accentColor = colorMode === 'print' ? 'black' : '#9f1239'; // deep red (rose-900)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Abstract "O" Icon / Pen Nib Symbol */}
        <path
          d="M30 10C18.9543 10 10 18.9543 10 30C10 41.0457 18.9543 50 30 50C41.0457 50 50 41.0457 50 30C50 18.9543 41.0457 10 30 10Z"
          fill="white"
          stroke={accentColor}
          strokeWidth="4"
        />
        <path
          d="M30 20C24.4772 20 20 24.4772 20 30C20 35.5228 24.4772 40 30 40C35.5228 40 40 35.5228 40 30C40 24.4772 35.5228 20 30 20Z"
          fill={accentColor}
        />
        {/* Nib shape overlay */}
        <path d="M30 40L25 55L30 52L35 55L30 40Z" fill={accentColor} />

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
