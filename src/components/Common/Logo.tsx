import React, { useState } from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  // Generous height dimensions preserving 3:1 aspect ratio of logo.png (2172 x 724)
  const sizeClasses = {
    xs: 'h-6 sm:h-7 max-w-[85px]',
    sm: 'h-9 sm:h-10 max-w-[150px]',
    md: 'h-11 sm:h-14 max-w-[210px]',
    lg: 'h-16 sm:h-20 max-w-[280px]',
    xl: 'h-20 sm:h-24 max-w-[340px]'
  }[size] || 'h-11 sm:h-14 max-w-[210px]';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {!hasError ? (
        <img
          src="/logo.png"
          alt="Logo"
          onError={() => setHasError(true)}
          className={`w-auto object-contain transition-transform duration-200 group-hover:scale-105 filter drop-shadow-xs ${sizeClasses}`}
        />
      ) : (
        <div className="h-10 px-3.5 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">
          Radar
        </div>
      )}
    </div>
  );
};

export default Logo;
