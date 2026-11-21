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

  // Height dimensions preserving aspect ratio of MapEstate logo (1024x372)
  const sizeClasses = {
    xs: 'h-6 sm:h-7',
    sm: 'h-7 sm:h-8',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14'
  }[size] || 'h-8 sm:h-9';

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
        <div className="h-7 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs tracking-tight">
          MapEstate
        </div>
      )}
    </div>
  );
};

export default Logo;
