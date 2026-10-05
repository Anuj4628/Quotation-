import React from 'react';

interface WatermarkProps {
  themeId: string;
}

export const FestivalWatermark: React.FC<WatermarkProps> = ({ themeId }) => {
  switch (themeId) {
    case 'diwali':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <svg
            className="w-[520px] h-[520px] text-amber-500 opacity-[0.06]"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Outer Mandala Rays */}
            <circle cx="100" cy="100" r="90" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="75" />
            <circle cx="100" cy="100" r="60" strokeDasharray="2 2" />

            {/* Geometric Mandala Petals */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 100 100)`}>
                <path d="M100 25 C108 45 108 55 100 70 C92 55 92 45 100 25 Z" fill="currentColor" fillOpacity="0.3" />
                <circle cx="100" cy="18" r="2.5" fill="currentColor" />
              </g>
            ))}

            {/* Center Sacred Diya (Oil Lamp) */}
            <g transform="translate(0, 5)">
              {/* Diya Base */}
              <path
                d="M70 120 C70 145 130 145 130 120 C125 116 115 114 100 114 C85 114 75 116 70 120 Z"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <path d="M60 118 C80 125 120 125 140 118" strokeWidth="1.5" />
              {/* Radiant Flame */}
              <path
                d="M100 80 C106 95 112 105 100 114 C88 105 94 95 100 80 Z"
                fill="currentColor"
                fillOpacity="0.8"
              />
              <circle cx="100" cy="98" r="4" fill="currentColor" />
            </g>
          </svg>
        </div>
      );

    case 'ganesh':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <svg
            className="w-[500px] h-[500px] text-red-600 opacity-[0.055]"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Sacred Aura */}
            <circle cx="100" cy="100" r="88" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="72" />

            {/* Abstract Auspicious Ganesha Motif */}
            {/* Crown / Mukut */}
            <path d="M85 45 L100 25 L115 45 L100 40 Z" fill="currentColor" fillOpacity="0.4" />
            <line x1="100" y1="25" x2="100" y2="40" />

            {/* Head & Tilak */}
            <path d="M75 58 C85 50 115 50 125 58" strokeWidth="1.5" />
            <path d="M98 48 Q100 42 102 48 Q100 54 98 48 Z" fill="currentColor" />
            <line x1="93" y1="52" x2="107" y2="52" strokeWidth="1.5" />

            {/* Ears */}
            <path d="M75 58 C50 65 52 100 78 105" strokeWidth="1.5" />
            <path d="M125 58 C150 65 148 100 122 105" strokeWidth="1.5" />

            {/* Trunk with graceful curved modak sweep */}
            <path
              d="M90 68 C88 88 85 110 102 120 C114 126 122 118 118 108 C115 100 106 102 104 108"
              strokeWidth="2"
            />

            {/* Modak in trunk */}
            <circle cx="118" cy="108" r="4.5" fill="currentColor" fillOpacity="0.5" />

            {/* Sacred Om Symbol in subtle circular halo */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 100 100)`}>
                <circle cx="100" cy="22" r="2" fill="currentColor" />
              </g>
            ))}
          </svg>
        </div>
      );

    case 'navratri':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <svg
            className="w-[520px] h-[520px] text-fuchsia-600 opacity-[0.05]"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Auspicious Outer Rings */}
            <circle cx="100" cy="100" r="92" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="80" />

            {/* Sacred 8-Petal Lotus of Maa Durga */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 100 100)`}>
                <path
                  d="M100 30 C112 55 115 70 100 85 C85 70 88 55 100 30 Z"
                  fill="currentColor"
                  fillOpacity="0.3"
                />
              </g>
            ))}

            {/* Sacred Trishul & Auspicious Aura in Center */}
            <g transform="translate(0, -5)">
              <line x1="100" y1="70" x2="100" y2="135" strokeWidth="2" />
              {/* Center point */}
              <path d="M100 65 L96 78 L104 78 Z" fill="currentColor" />
              {/* Outer curved blades */}
              <path d="M96 82 C82 82 82 68 86 65" strokeWidth="1.5" />
              <path d="M104 82 C118 82 118 68 114 65" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="16" strokeDasharray="2 2" />
            </g>
          </svg>
        </div>
      );

    case 'janmashtami':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <svg
            className="w-[520px] h-[520px] text-teal-600 opacity-[0.055]"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Celestial Harmony Rings */}
            <circle cx="100" cy="100" r="90" strokeDasharray="4 2" />
            <circle cx="100" cy="100" r="76" />

            {/* Divine Peacock Feather (Mor Pankh) */}
            <g transform="translate(0, -10)">
              {/* Outer Feather Eye */}
              <ellipse cx="100" cy="75" rx="30" ry="38" strokeWidth="1.5" />
              <ellipse cx="100" cy="76" rx="22" ry="28" fill="currentColor" fillOpacity="0.2" />
              <ellipse cx="100" cy="78" rx="14" ry="18" fill="currentColor" fillOpacity="0.4" />
              <circle cx="100" cy="80" r="8" fill="currentColor" fillOpacity="0.6" />

              {/* Feather Quill Shaft */}
              <path d="M100 113 Q102 135 96 155" strokeWidth="1.8" />

              {/* Feather Strands / Filaments */}
              {[-30, -20, -10, 0, 10, 20, 30].map((deg) => (
                <path
                  key={deg}
                  d={`M100 75 Q${100 + deg * 1.5} ${40 + Math.abs(deg) * 0.4} ${100 + deg * 1.8} ${30 + Math.abs(deg) * 0.5}`}
                  strokeWidth="0.8"
                />
              ))}
            </g>

            {/* Divine Bansuri Flute crossing underneath */}
            <g transform="rotate(-30 100 125)">
              <rect x="50" y="122" width="100" height="6" rx="3" fill="currentColor" fillOpacity="0.3" strokeWidth="1.2" />
              {/* Finger holes */}
              <circle cx="80" cy="125" r="1.5" fill="currentColor" />
              <circle cx="90" cy="125" r="1.5" fill="currentColor" />
              <circle cx="100" cy="125" r="1.5" fill="currentColor" />
              <circle cx="110" cy="125" r="1.5" fill="currentColor" />
              <circle cx="120" cy="125" r="1.5" fill="currentColor" />
            </g>
          </svg>
        </div>
      );

    case 'ram_navami':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <svg
            className="w-[520px] h-[520px] text-orange-500 opacity-[0.055]"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Surya (Sun) Divine Rays */}
            <circle cx="100" cy="100" r="90" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="75" />

            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg) => (
              <line
                key={deg}
                x1="100"
                y1="15"
                x2="100"
                y2="25"
                transform={`rotate(${deg} 100 100)`}
                strokeWidth="1.5"
              />
            ))}

            {/* Sacred Bow (Kodanda) & Arrow */}
            <g transform="translate(0, 0)">
              {/* Majestic Arc of the Bow */}
              <path
                d="M60 140 C50 100 50 60 85 45 C95 40 105 40 115 45 C150 60 150 100 140 140"
                strokeWidth="2"
              />
              {/* Bow string */}
              <line x1="60" y1="140" x2="140" y2="140" strokeDasharray="2 2" />

              {/* Sacred Golden Arrow */}
              <line x1="100" y1="40" x2="100" y2="148" strokeWidth="2" />
              {/* Arrow Head */}
              <path d="M100 35 L94 48 L106 48 Z" fill="currentColor" fillOpacity="0.7" />
              {/* Arrow Fletching */}
              <path d="M96 142 L100 146 L104 142" strokeWidth="1.5" />
              <path d="M96 146 L100 150 L104 146" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      );

    case 'jagannath':
      return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
          <svg
            className="w-[520px] h-[520px] text-amber-600 opacity-[0.055]"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Sacred Divine Aura / Chakra */}
            <circle cx="100" cy="100" r="92" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="80" />

            {/* Sacred Radial Petals */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 100 100)`}>
                <path d="M100 22 C105 35 105 45 100 55 C95 45 95 35 100 22 Z" fill="currentColor" fillOpacity="0.25" />
              </g>
            ))}

            {/* Divine Jagannath Face & Iconic Round Eyes */}
            <g transform="translate(0, 5)">
              {/* Sacred Crown (Mukut) */}
              <path d="M80 50 L100 32 L120 50 L100 46 Z" fill="currentColor" fillOpacity="0.5" />
              <circle cx="100" cy="30" r="3" fill="currentColor" />

              {/* Sacred Tilak between eyes */}
              <path d="M96 60 Q100 52 104 60 L100 78 Z" fill="currentColor" fillOpacity="0.7" />
              <circle cx="100" cy="84" r="2.5" fill="currentColor" />

              {/* Left Sacred Eye (Large Concentric Circles) */}
              <circle cx="68" cy="88" r="20" strokeWidth="2" />
              <circle cx="68" cy="88" r="14" fill="currentColor" fillOpacity="0.2" />
              <circle cx="68" cy="88" r="8" fill="currentColor" fillOpacity="0.8" />
              <circle cx="66" cy="86" r="2.5" fill="#ffffff" />

              {/* Right Sacred Eye (Large Concentric Circles) */}
              <circle cx="132" cy="88" r="20" strokeWidth="2" />
              <circle cx="132" cy="88" r="14" fill="currentColor" fillOpacity="0.2" />
              <circle cx="132" cy="88" r="8" fill="currentColor" fillOpacity="0.8" />
              <circle cx="130" cy="86" r="2.5" fill="#ffffff" />

              {/* Sacred Divine Smile */}
              <path d="M72 124 Q100 144 128 124" strokeWidth="2.5" strokeLinecap="round" />
              {/* Red lips fill accent */}
              <path d="M76 125 Q100 142 124 125 Q100 134 76 125 Z" fill="currentColor" fillOpacity="0.4" />
            </g>
          </svg>
        </div>
      );

    default:
      return null;
  }
};
