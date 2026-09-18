import React from 'react';

interface NanuCloudLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'horizontal';
  isDarkTheme?: boolean;
  height?: number | string;
  customLogoUrl?: string;
}

export const NanuCloudLogo: React.FC<NanuCloudLogoProps> = ({
  className = 'h-9',
  variant = 'full',
  isDarkTheme = true,
  customLogoUrl
}) => {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="Logo NanuCloud"
        className={`object-contain select-none ${className}`}
        onError={(e) => { (e.target as any).style.display = 'none'; }}
      />
    );
  }
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Green Cloud Body with Left Arrow Swoosh */}
        <path
          d="M 38 118 C 20 118 8 102 8 82 C 8 62 22 46 42 46 C 48 46 54 48 60 51 C 68 34 86 22 106 22 C 132 22 152 40 156 68 C 162 68 168 72 172 78"
          stroke="#00A859"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M 45 110 L 36 126 L 56 122 Z" fill="#00A859" />

        {/* Pixel Cubes */}
        <rect x="135" y="48" width="10" height="10" rx="1.5" fill={isDarkTheme ? '#E2E8F0' : '#18181B'} />
        <rect x="155" y="32" width="11" height="11" rx="1.5" fill={isDarkTheme ? '#E2E8F0' : '#18181B'} />
        <rect x="168" y="62" width="10" height="10" rx="1.5" fill={isDarkTheme ? '#E2E8F0' : '#18181B'} />

        <rect x="168" y="12" width="10" height="10" rx="1.5" fill="#00A859" />
        <rect x="180" y="28" width="16" height="16" rx="2" fill="#00A859" />
        <rect x="150" y="60" width="12" height="12" rx="1.5" fill="#00A859" />
        <rect x="135" y="85" width="13" height="13" rx="1.5" fill="#00A859" />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Emblem matching the uploaded visual */}
      <svg
        viewBox="0 0 540 290"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto max-h-11 shrink-0"
      >
        {/* Green Cloud Perimeter */}
        <path
          d="M 125 240 C 65 240 22 195 22 142 C 22 88 66 45 125 45 C 142 45 158 50 172 58 C 196 22 242 0 294 0 C 362 0 418 45 430 110 C 448 110 464 118 476 132"
          stroke="#00A859"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        {/* Return Arrow tip at bottom left */}
        <path d="M 148 220 L 122 260 L 172 250 Z" fill="#00A859" />

        {/* Digital Pixel Cubes (Dispersing Top-Right) */}
        {/* Dark/White Cubes */}
        <rect x="425" y="90" width="26" height="26" rx="3" fill={isDarkTheme ? '#F8FAFC' : '#18181B'} />
        <rect x="480" y="58" width="28" height="28" rx="3" fill={isDarkTheme ? '#F8FAFC' : '#18181B'} />
        <rect x="515" y="125" width="25" height="25" rx="3" fill={isDarkTheme ? '#F8FAFC' : '#18181B'} />

        {/* Green Accent Cubes */}
        <rect x="515" y="15" width="25" height="25" rx="3" fill="#00A859" />
        <rect x="545" y="48" width="40" height="40" rx="4" fill="#00A859" />
        <rect x="468" y="120" width="28" height="28" rx="3" fill="#00A859" />
        <rect x="428" y="175" width="30" height="30" rx="3" fill="#00A859" />

        {/* "Nanu" Wordmark */}
        <text
          x="100"
          y="180"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="102"
          fill={isDarkTheme ? '#F8FAFC' : '#18181B'}
          letterSpacing="-3"
        >
          Nanu
        </text>

        {/* "CLOUD" Wordmark */}
        <text
          x="185"
          y="262"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="92"
          fill="#00A859"
          letterSpacing="-1"
        >
          CLOUD
        </text>
      </svg>
    </div>
  );
};
