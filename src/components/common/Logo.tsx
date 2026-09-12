import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { BRAND } from '@/src/lib/constants';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  inverted?: boolean;
  variant?: 'crest' | 'banner' | 'auto';
}

/**
 * Institutional Crest Logo Component
 * Displays the authentic Crest of FUTMINNA and FEDPOFFA standing side by side.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
  inverted = false,
  variant = 'crest',
}) => {
  const [imageError, setImageError] = useState(false);

  // Height mappings matching responsive touch targets & typography baseline
  const sizeClasses = {
    xs: 'h-7 sm:h-8',
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-13',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
    '2xl': 'h-28 sm:h-32',
  };

  const logoSrc = BRAND.LOGO_PATH;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative inline-flex items-center ${inverted ? 'bg-white/95 px-2.5 py-1.5 rounded-xl shadow-xs' : ''}`}>
        {!imageError ? (
          <img
            src={logoSrc}
            alt="FUTMINNA & FEDPOFFA Institutional Crests"
            className={`${sizeClasses[size]} w-auto object-contain max-w-full drop-shadow-xs transition-opacity duration-200`}
            loading="eager"
            referrerPolicy="no-referrer"
            onError={() => {
              // Fallback to default asset if custom svg path fails
              setImageError(true);
            }}
          />
        ) : (
          <img
            src={BRAND.LOGO_PATH}
            alt="FEDPOFFA In Affiliation With FUT MINNA"
            className={`${sizeClasses[size]} w-auto object-contain max-w-full drop-shadow-xs`}
            loading="eager"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {showSubtitle && (
        <div className={`hidden sm:flex flex-col pl-2.5 border-l ${inverted ? 'border-purple-300/40 text-white' : 'border-slate-300 text-slate-800'}`}>
          <span className="text-xs font-extrabold tracking-tight uppercase">
            E-Clearance Portal
          </span>
          <span className={`text-[10px] font-semibold ${inverted ? 'text-purple-200' : 'text-slate-500'}`}>
            FUTMINNA / FEDPOFFA Degree
          </span>
        </div>
      )}
    </div>
  );
};
