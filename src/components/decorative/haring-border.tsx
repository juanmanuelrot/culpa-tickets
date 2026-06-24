export function HaringBorder() {
  // Keith Haring-style dancing figures as SVG border decoration
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {/* Top row */}
      <div className="absolute top-0 left-0 right-0 flex justify-around">
        {Array.from({ length: 8 }).map((_, i) => (
          <HaringFigure key={`top-${i}`} variant={i % 4} className="w-16 h-16 md:w-20 md:h-20" />
        ))}
      </div>
      {/* Bottom row */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around">
        {Array.from({ length: 8 }).map((_, i) => (
          <HaringFigure key={`bottom-${i}`} variant={(i + 2) % 4} className="w-16 h-16 md:w-20 md:h-20 rotate-180" />
        ))}
      </div>
      {/* Left column */}
      <div className="absolute top-20 bottom-20 left-0 flex flex-col justify-around">
        {Array.from({ length: 5 }).map((_, i) => (
          <HaringFigure key={`left-${i}`} variant={(i + 1) % 4} className="w-16 h-16 md:w-20 md:h-20 -rotate-90" />
        ))}
      </div>
      {/* Right column */}
      <div className="absolute top-20 bottom-20 right-0 flex flex-col justify-around">
        {Array.from({ length: 5 }).map((_, i) => (
          <HaringFigure key={`right-${i}`} variant={(i + 3) % 4} className="w-16 h-16 md:w-20 md:h-20 rotate-90" />
        ))}
      </div>
    </div>
  );
}

// Keith Haring's signature dancing figures: a solid round head and bold,
// uniform-width limbs with rounded ends. Four poses, all readable at any
// rotation so they work as a border or as a small standalone accent.
function HaringFigure({ variant, className = "" }: { variant: number; className?: string }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const figures = [
    // 0 — symmetric dance, arms and legs flung out
    <svg viewBox="0 0 100 100" className={className} key="f0">
      <circle cx="50" cy="16" r="9" fill="currentColor" />
      <path d="M50 26 V52 M50 33 L26 19 M50 33 L74 19 M50 52 L30 87 M50 52 L70 87" {...stroke} />
    </svg>,
    // 1 — asymmetric groove, one arm up one arm out
    <svg viewBox="0 0 100 100" className={className} key="f1">
      <circle cx="53" cy="16" r="9" fill="currentColor" />
      <path d="M52 26 L48 53 M51 32 L32 14 M51 35 L77 47 M48 53 L30 85 M48 53 L71 81" {...stroke} />
    </svg>,
    // 2 — radiant dancer: arms raised in a V with the classic radiating lines
    <svg viewBox="0 0 100 100" className={className} key="f2">
      <circle cx="50" cy="20" r="9" fill="currentColor" />
      <path d="M50 30 V56 M50 35 L33 18 M50 35 L67 18 M50 56 L33 87 M50 56 L67 87" {...stroke} />
      <path d="M41 9 L36 3 M50 6 V1 M59 9 L64 3" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>,
    // 3 — leaping figure mid-kick
    <svg viewBox="0 0 100 100" className={className} key="f3">
      <circle cx="46" cy="17" r="9" fill="currentColor" />
      <path d="M46 27 L55 51 M48 33 L26 27 M50 37 L72 23 M55 51 L80 60 M55 51 L47 87" {...stroke} />
    </svg>,
  ];

  return figures[variant] || figures[0];
}

export { HaringFigure };
