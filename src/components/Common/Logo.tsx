import React, { useState } from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  bare?: boolean; // if true, don't add the light capsule wrapper
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  bare = false
}) => {
  const [hasError, setHasError] = useState(false);

  // Height dimensions preserving 3:1 aspect ratio of logo.png
  const sizeClasses = {
    xs: 'h-5 sm:h-6 max-w-[80px]',
    sm: 'h-7 sm:h-8 max-w-[125px]',
    md: 'h-9 sm:h-10 max-w-[160px]',
    lg: 'h-12 sm:h-14 max-w-[220px]',
    xl: 'h-16 sm:h-18 max-w-[280px]'
  }[size] || 'h-9 sm:h-10 max-w-[160px]';

  // Safeguard: Never let the logo background be dark so the dark emblem/text never gets mixed
  const capsuleClasses = bare
    ? ''
    : 'bg-white px-2 py-0.5 rounded-xl border border-slate-200/80 shadow-2xs';

  return (
    <div className={`inline-flex items-center select-none ${capsuleClasses} ${className}`}>
      {!hasError ? (
        <img
          src="/logo.png"
          alt="ManorMap Logo"
          onError={() => setHasError(true)}
          className={`w-auto object-contain transition-transform duration-200 group-hover:scale-102 filter drop-shadow-2xs ${sizeClasses}`}
        />
      ) : (
        <div className="h-7 px-2.5 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs tracking-tight">
          ManorMap
        </div>
      )}
    </div>
  );
};

export default Logo;
