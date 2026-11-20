import { SportType } from '../types';

export function HeroFieldIllustration() {
  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-800">
      <svg
        viewBox="0 0 800 540"
        className="h-full w-full object-cover"
        aria-label="PlayGrid DGU Campus Sports Turf Grid"
      >
        <defs>
          <linearGradient id="turfGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="55%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
          </linearGradient>
          <pattern id="turfStripes" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect width="40" height="80" fill="#10b981" fillOpacity="0.06" />
          </pattern>
        </defs>

        <rect width="800" height="540" fill="url(#turfGrad)" />
        <rect width="800" height="540" fill="url(#turfStripes)" />

        {/* Distant Dehradun foothills silhouette */}
        <path
          d="M0 140 Q120 70 250 118 T510 92 T800 130 L800 0 L0 0 Z"
          fill="url(#ridgeGrad)"
        />
        <path
          d="M0 160 Q180 110 340 145 T680 120 L800 150 L800 0 L0 0 Z"
          fill="#0f172a"
          fillOpacity="0.45"
        />

        {/* Pitch & Turf Grid Architectural Lines */}
        <g stroke="#d1fae5" strokeOpacity="0.35" strokeWidth="2" fill="none">
          <rect x="64" y="185" width="672" height="305" rx="6" />
          <line x1="400" y1="185" x2="400" y2="490" />
          <circle cx="400" cy="338" r="58" />
          <circle cx="400" cy="338" r="3" fill="#d1fae5" fillOpacity="0.8" />
          <rect x="64" y="255" width="86" height="166" />
          <rect x="650" y="255" width="86" height="166" />
          {/* Cricket central strip */}
          <rect
            x="312"
            y="324"
            width="176"
            height="28"
            rx="2"
            fill="#fef3c7"
            fillOpacity="0.14"
            stroke="#fde68a"
            strokeOpacity="0.55"
          />
          <line x1="330" y1="324" x2="330" y2="352" stroke="#fde68a" strokeOpacity="0.7" />
          <line x1="470" y1="324" x2="470" y2="352" stroke="#fde68a" strokeOpacity="0.7" />
        </g>

        {/* Player formation markers */}
        <g>
          <circle cx="235" cy="278" r="9" fill="#34d399" />
          <circle cx="285" cy="396" r="9" fill="#34d399" />
          <circle cx="356" cy="260" r="9" fill="#34d399" />
          <circle cx="445" cy="404" r="9" fill="#f8fafc" />
          <circle cx="515" cy="285" r="9" fill="#f8fafc" />
          <circle cx="565" cy="360" r="9" fill="#f8fafc" />
          <circle cx="170" cy="338" r="9" fill="#fbbf24" />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-6">
        <p className="text-xs font-medium tracking-wide text-emerald-300">
          DBS Global University · Dehradun Campus &amp; Nearby Grounds (0–10 km)
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          Live pickup squads across Cricket, Football, Badminton, and Court Sports
        </p>
      </div>
    </div>
  );
}

export function SportCourtThumb({ sport }: { sport: SportType }) {
  const palette: Record<SportType, { bg: string; line: string; accent: string }> = {
    Cricket: { bg: '#064e3b', line: '#a7f3d0', accent: '#fbbf24' },
    Football: { bg: '#065f46', line: '#d1fae5', accent: '#34d399' },
    Badminton: { bg: '#1e3a5f', line: '#bae6fd', accent: '#38bdf8' },
    Basketball: { bg: '#334155', line: '#e2e8f0', accent: '#f97316' },
    Volleyball: { bg: '#451a03', line: '#fde68a', accent: '#f59e0b' },
    'Table Tennis': { bg: '#172554', line: '#cbd5e1', accent: '#22d3ee' },
  };
  const c = palette[sport];

  return (
    <svg
      viewBox="0 0 160 96"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect width="160" height="96" fill={c.bg} />
      <g stroke={c.line} strokeOpacity="0.45" strokeWidth="1.5" fill="none">
        <rect x="14" y="14" width="132" height="68" rx="3" />
        {sport === 'Cricket' && (
          <>
            <circle cx="80" cy="48" r="28" />
            <rect x="54" y="40" width="52" height="16" fill={c.accent} fillOpacity="0.22" />
          </>
        )}
        {sport === 'Football' && (
          <>
            <line x1="80" y1="14" x2="80" y2="82" />
            <circle cx="80" cy="48" r="16" />
            <rect x="14" y="30" width="20" height="36" />
            <rect x="126" y="30" width="20" height="36" />
          </>
        )}
        {sport === 'Badminton' && (
          <>
            <line x1="80" y1="14" x2="80" y2="82" strokeDasharray="3 3" />
            <line x1="34" y1="14" x2="34" y2="82" />
            <line x1="126" y1="14" x2="126" y2="82" />
            <line x1="14" y1="24" x2="146" y2="24" />
            <line x1="14" y1="72" x2="146" y2="72" />
          </>
        )}
        {sport === 'Basketball' && (
          <>
            <line x1="80" y1="14" x2="80" y2="82" />
            <circle cx="80" cy="48" r="14" />
            <path d="M 14 26 A 26 26 0 0 1 14 70" />
            <path d="M 146 26 A 26 26 0 0 0 146 70" />
          </>
        )}
        {sport === 'Volleyball' && (
          <>
            <line x1="80" y1="14" x2="80" y2="82" strokeWidth="2" />
            <line x1="56" y1="14" x2="56" y2="82" />
            <line x1="104" y1="14" x2="104" y2="82" />
          </>
        )}
        {sport === 'Table Tennis' && (
          <>
            <line x1="80" y1="14" x2="80" y2="82" strokeWidth="2" />
            <line x1="14" y1="48" x2="146" y2="48" strokeOpacity="0.25" />
          </>
        )}
      </g>
    </svg>
  );
}
