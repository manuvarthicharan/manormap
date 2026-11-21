import React, { useState } from 'react';
import mapEstateLogo from '../../assets/logo.png';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  bare?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Height dimensions preserving aspect ratio of MapEstate logo (913x305, ~3:1)
  const sizeClasses = {
    xs: 'h-7 sm:h-8',
    sm: 'h-8 sm:h-9',
    md: 'h-9 sm:h-10',
    lg: 'h-11 sm:h-12',
    xl: 'h-14 sm:h-16'
  }[size] || 'h-9 sm:h-10';

  return (
    <div className={`inline-flex items-center select-none bg-transparent ${className}`}>
      {!hasError ? (
        <img
          src={mapEstateLogo}
          alt="MapEstate"
          onError={() => setHasError(true)}
          className={`w-auto object-contain transition-transform duration-200 group-hover:scale-102 ${sizeClasses}`}
        />
      ) : (
        <div className="h-8 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs tracking-tight">
          MapEstate
        </div>
      )}
    </div>
  );
};

export default Logo;
