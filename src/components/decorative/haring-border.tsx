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

function HaringFigure({ variant, className = "" }: { variant: number; className?: string }) {
  const figures = [
    // Dancing figure 1
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} key="f1">
      <path d="M50 15 C55 15 58 12 58 8 C58 4 55 1 50 1 C45 1 42 4 42 8 C42 12 45 15 50 15Z M35 25 L30 45 L15 40 L12 48 L32 55 L35 70 L20 90 L28 95 L45 72 L55 72 L72 95 L80 90 L65 70 L68 55 L88 48 L85 40 L70 45 L65 25Z" />
      <line x1="30" y1="18" x2="25" y2="10" stroke="currentColor" strokeWidth="3" />
      <line x1="70" y1="18" x2="75" y2="10" stroke="currentColor" strokeWidth="3" />
    </svg>,
    // Dancing figure 2
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} key="f2">
      <path d="M45 15 C50 15 53 12 53 8 C53 4 50 1 45 1 C40 1 37 4 37 8 C37 12 40 15 45 15Z M30 22 L25 42 L10 50 L15 57 L35 48 L38 65 L25 88 L33 93 L48 68 L55 68 L62 93 L70 88 L58 65 L60 48 L75 40 L70 33 L55 38 L50 22Z" />
    </svg>,
    // Running figure
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} key="f3">
      <path d="M55 12 C59 12 62 9 62 5.5 C62 2 59 -0.5 55 -0.5 C51 -0.5 48 2 48 5.5 C48 9 51 12 55 12Z M40 20 L35 40 L15 35 L12 43 L38 50 L35 65 L15 85 L22 92 L45 70 L60 75 L75 92 L82 85 L65 68 L62 50 L85 55 L88 47 L60 38 L55 20Z" />
    </svg>,
    // Radiating figure
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} key="f4">
      <path d="M50 18 C55 18 58 15 58 11 C58 7 55 4 50 4 C45 4 42 7 42 11 C42 15 45 18 50 18Z M38 26 L33 46 L18 42 L15 50 L35 56 L32 72 L18 90 L26 95 L42 75 L58 75 L74 95 L82 90 L68 72 L65 56 L85 50 L82 42 L67 46 L62 26Z" />
      <line x1="35" y1="8" x2="28" y2="0" stroke="currentColor" strokeWidth="2.5" />
      <line x1="50" y1="3" x2="50" y2="-5" stroke="currentColor" strokeWidth="2.5" />
      <line x1="65" y1="8" x2="72" y2="0" stroke="currentColor" strokeWidth="2.5" />
    </svg>,
  ];

  return figures[variant] || figures[0];
}

export { HaringFigure };
