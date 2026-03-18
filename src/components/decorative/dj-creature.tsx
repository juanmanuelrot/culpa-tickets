export function DjCreature({ className = "" }: { className?: string }) {
  // Keith Haring-style DJ dinosaur/creature inspired by the flyer
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* DJ Table / Turntables */}
      <rect x="40" y="120" width="120" height="12" rx="2" stroke="white" strokeWidth="3" fill="none" />
      <rect x="40" y="132" width="120" height="30" rx="2" stroke="white" strokeWidth="3" fill="none" />
      {/* Table legs */}
      <line x1="55" y1="162" x2="55" y2="178" stroke="white" strokeWidth="3" />
      <line x1="145" y1="162" x2="145" y2="178" stroke="white" strokeWidth="3" />

      {/* Left turntable */}
      <circle cx="75" cy="145" r="14" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="75" cy="145" r="4" fill="white" opacity="0.6" />
      {/* Tonearm */}
      <line x1="63" y1="133" x2="71" y2="141" stroke="white" strokeWidth="2" />
      <line x1="58" y1="130" x2="63" y2="133" stroke="white" strokeWidth="2" />

      {/* Right turntable */}
      <circle cx="125" cy="145" r="14" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="125" cy="145" r="4" fill="white" opacity="0.6" />
      {/* Tonearm */}
      <line x1="137" y1="133" x2="129" y2="141" stroke="white" strokeWidth="2" />
      <line x1="142" y1="130" x2="137" y2="133" stroke="white" strokeWidth="2" />

      {/* Mixer in middle */}
      <rect x="92" y="136" width="16" height="20" rx="1" stroke="white" strokeWidth="2" fill="none" />
      <line x1="96" y1="140" x2="96" y2="148" stroke="white" strokeWidth="1.5" />
      <line x1="100" y1="138" x2="100" y2="150" stroke="white" strokeWidth="1.5" />
      <line x1="104" y1="141" x2="104" y2="147" stroke="white" strokeWidth="1.5" />

      {/* Creature body */}
      <path
        d="M85 120 C85 95, 80 85, 85 70 C88 60, 95 55, 100 55 C105 55, 112 60, 115 70 C120 85, 115 95, 115 120"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />

      {/* Left arm reaching to turntable */}
      <path
        d="M87 90 C78 95, 68 100, 60 110 C56 115, 58 118, 62 118"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left hand/claw */}
      <circle cx="62" cy="116" r="4" stroke="white" strokeWidth="2" fill="none" />

      {/* Right arm - thumbs up! */}
      <path
        d="M113 90 C122 88, 130 82, 138 78"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Thumbs up hand */}
      <path
        d="M136 78 C136 72, 140 68, 142 64"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M134 78 L142 80 L142 76"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Head */}
      <path
        d="M82 60 C82 42, 90 32, 100 30 C110 32, 118 42, 118 60"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />
      {/* Snout/jaw (dinosaur-like) */}
      <path
        d="M82 52 C75 50, 68 48, 65 45 C63 42, 65 38, 70 37 C75 36, 82 40, 85 44"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Jaw teeth zigzag */}
      <path
        d="M72 45 L75 42 L78 45 L81 42 L84 45"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Eye */}
      <circle cx="92" cy="44" r="5" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="93" cy="43" r="2" fill="white" />

      {/* Spikes on head */}
      <line x1="90" y1="32" x2="88" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="97" y1="30" x2="97" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="104" y1="31" x2="106" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="111" y1="34" x2="115" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

      {/* Radiating lines (energy!) */}
      <line x1="85" y1="18" x2="80" y2="8" stroke="white" strokeWidth="2" opacity="0.6" />
      <line x1="97" y1="15" x2="97" y2="4" stroke="white" strokeWidth="2" opacity="0.6" />
      <line x1="109" y1="17" x2="114" y2="6" stroke="white" strokeWidth="2" opacity="0.6" />
      <line x1="119" y1="22" x2="126" y2="12" stroke="white" strokeWidth="2" opacity="0.6" />

      {/* Sound waves from left turntable */}
      <path d="M48 108 C44 105, 44 100, 48 97" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M43 112 C37 107, 37 97, 43 92" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M38 116 C30 109, 30 94, 38 87" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* Vinyl record flying */}
      <g transform="translate(30, 75) rotate(-15)">
        <circle cx="0" cy="0" r="12" stroke="white" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="0" cy="0" r="4" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
        <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.5" />
      </g>
    </svg>
  );
}

export function SmallCreature({ className = "" }: { className?: string }) {
  // Smaller Keith Haring-style dancing figure
  return (
    <svg
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head */}
      <circle cx="30" cy="12" r="10" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="28" cy="10" r="2" fill="white" />
      {/* Body */}
      <path
        d="M30 22 L30 50"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Arms up */}
      <path
        d="M30 32 L15 20 M30 32 L45 20"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Legs */}
      <path
        d="M30 50 L18 72 M30 50 L42 72"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Energy lines */}
      <line x1="12" y1="15" x2="6" y2="10" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="48" y1="15" x2="54" y2="10" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="30" y1="2" x2="30" y2="-4" stroke="white" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}
