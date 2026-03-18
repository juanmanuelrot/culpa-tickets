// Keith Haring-style dancing figure component for border decoration
function DancingFigure({ pose }: { pose: number }) {
  const strokeProps = {
    stroke: "white",
    strokeWidth: 4.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  switch (pose) {
    case 0:
      // Arms up, jumping
      return (
        <g>
          <circle cx="0" cy="-22" r="7" fill="white" />
          <path d="M0 -15 L0 8" {...strokeProps} />
          <path d="M0 -8 L-16 -24" {...strokeProps} />
          <path d="M0 -8 L16 -24" {...strokeProps} />
          <path d="M0 8 L-13 26 L-19 24" {...strokeProps} />
          <path d="M0 8 L13 26 L19 24" {...strokeProps} />
          {/* Motion lines */}
          <path d="M-21 -20 L-25 -18 M-22 -15 L-26 -13 M-21 -10 L-25 -8" {...strokeProps} strokeWidth={2} />
          <path d="M21 -20 L25 -18 M22 -15 L26 -13 M21 -10 L25 -8" {...strokeProps} strokeWidth={2} />
        </g>
      );
    case 1:
      // Running
      return (
        <g>
          <circle cx="2" cy="-22" r="7" fill="white" />
          <path d="M2 -15 L0 8" {...strokeProps} />
          <path d="M1 -8 L-16 -2" {...strokeProps} />
          <path d="M1 -8 L16 -20" {...strokeProps} />
          <path d="M0 8 L-14 24 L-10 28" {...strokeProps} />
          <path d="M0 8 L16 22 L22 18" {...strokeProps} />
          {/* Motion lines */}
          <path d="M-18 2 L-23 4 M-18 7 L-23 9 M-17 12 L-22 14" {...strokeProps} strokeWidth={2} />
        </g>
      );
    case 2:
      // Dancing sideways
      return (
        <g>
          <circle cx="0" cy="-22" r="7" fill="white" />
          <path d="M0 -15 L-2 8" {...strokeProps} />
          <path d="M-1 -8 L15 -20" {...strokeProps} />
          <path d="M-1 -8 L17 -4" {...strokeProps} />
          <path d="M-2 8 L-16 24 L-12 28" {...strokeProps} />
          <path d="M-2 8 L10 26 L16 24" {...strokeProps} />
          {/* Energy lines from head */}
          <path d="M-4 -30 L-6 -36 M1 -30 L1 -37 M6 -29 L8 -35" {...strokeProps} strokeWidth={2} />
        </g>
      );
    case 3:
    default:
      // Crawling / all fours
      return (
        <g>
          <circle cx="18" cy="-10" r="6" fill="white" />
          <path d="M12 -8 L-10 -4" {...strokeProps} />
          <path d="M-10 -4 L-20 -16 L-24 -12" {...strokeProps} />
          <path d="M-10 -4 L-18 8 L-14 12" {...strokeProps} />
          <path d="M8 -6 L14 8 L20 10" {...strokeProps} />
          <path d="M4 -5 L-2 10 L2 14" {...strokeProps} />
          {/* Motion lines behind */}
          <path d="M-24 -18 L-28 -20 M-26 -13 L-30 -13 M-24 -8 L-28 -6" {...strokeProps} strokeWidth={2} />
        </g>
      );
  }
}

export function SnakeBorder() {
  // Keith Haring-style border with dancing figures along edges
  const figures = [
    // Left edge figures (going down)
    { x: 42, y: 80, pose: 0, scale: 0.55, rotate: 0 },
    { x: 38, y: 210, pose: 1, scale: 0.5, rotate: 10 },
    { x: 45, y: 340, pose: 2, scale: 0.55, rotate: -5 },
    { x: 40, y: 470, pose: 3, scale: 0.5, rotate: 0 },
    { x: 42, y: 600, pose: 0, scale: 0.5, rotate: 8 },
    { x: 38, y: 720, pose: 1, scale: 0.55, rotate: -8 },
    // Right edge figures (going down)
    { x: 358, y: 120, pose: 2, scale: 0.55, rotate: 180 },
    { x: 362, y: 250, pose: 0, scale: 0.5, rotate: 175 },
    { x: 355, y: 380, pose: 1, scale: 0.55, rotate: 185 },
    { x: 360, y: 510, pose: 3, scale: 0.5, rotate: 180 },
    { x: 358, y: 640, pose: 2, scale: 0.5, rotate: 170 },
    { x: 362, y: 760, pose: 0, scale: 0.55, rotate: 185 },
    // Top edge figures
    { x: 120, y: 42, pose: 1, scale: 0.5, rotate: -90 },
    { x: 200, y: 38, pose: 3, scale: 0.55, rotate: -85 },
    { x: 280, y: 42, pose: 0, scale: 0.5, rotate: -95 },
    // Bottom edge figures
    { x: 100, y: 758, pose: 2, scale: 0.5, rotate: 90 },
    { x: 200, y: 762, pose: 0, scale: 0.55, rotate: 85 },
    { x: 300, y: 758, pose: 1, scale: 0.5, rotate: 95 },
  ];

  const hearts = [
    { x: 42, y: 150, scale: 1.2 },
    { x: 358, y: 190, scale: 1 },
    { x: 40, y: 530, scale: 1.1 },
    { x: 360, y: 450, scale: 1 },
    { x: 160, y: 40, scale: 0.9 },
    { x: 240, y: 760, scale: 1.1 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes figBounce {
            0%, 100% { transform: var(--fig-base) translateY(0); }
            50% { transform: var(--fig-base) translateY(-3px); }
          }
          @keyframes heartBeat {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.35; }
          }
          .kh-figure { animation: figBounce 2s ease-in-out infinite; }
          .kh-heart { animation: heartBeat 3s ease-in-out infinite; }
        `}</style>

        {figures.map((f, i) => (
          <g
            key={`fig-${i}`}
            className="kh-figure"
            opacity="0.18"
            style={{
              ["--fig-base" as string]: `translate(${f.x}px, ${f.y}px) scale(${f.scale}) rotate(${f.rotate}deg)`,
              transform: `translate(${f.x}px, ${f.y}px) scale(${f.scale}) rotate(${f.rotate}deg)`,
              animationDelay: `${(i * 0.3) % 2}s`,
            }}
          >
            <DancingFigure pose={f.pose} />
          </g>
        ))}

        {hearts.map(({ x, y, scale }, i) => (
          <g
            key={`h-${i}`}
            className="kh-heart"
            opacity="0.2"
            transform={`translate(${x}, ${y}) scale(${scale})`}
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            <path
              d="M0 3 C0 0, -6 -4, -6 1 C-6 5, 0 9, 0 12 C0 9, 6 5, 6 1 C6 -4, 0 0, 0 3Z"
              fill="white"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SnakeBorderFrame() {
  // Keith Haring-style snake border — bold, thick body with dramatic undulations,
  // internal patterns, motion lines, hearts, and animated tongue
  const snakePath = `
    M 70 22
    C 110 8, 160 35, 210 18
    C 260 2, 310 32, 352 20
    C 378 12, 392 35, 388 65
    C 380 100, 342 140, 355 185
    C 368 230, 398 265, 385 310
    C 372 355, 335 395, 350 440
    C 365 485, 400 520, 386 565
    C 372 605, 345 640, 360 665
    C 375 688, 358 700, 330 692
    C 295 680, 260 705, 220 692
    C 180 678, 145 705, 108 692
    C 75 682, 48 698, 30 680
    C 12 660, 20 635, 26 605
    C 32 575, 4 540, 16 500
    C 28 460, 58 425, 44 385
    C 30 345, -2 310, 14 270
    C 28 230, 60 195, 46 155
    C 32 115, 10 80, 22 50
    C 32 28, 48 18, 70 22
    Z
  `;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 710"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes snakeDash {
            to { stroke-dashoffset: -48; }
          }
          @keyframes heartPulse {
            0%, 100% { transform: scale(0.8); opacity: 0.2; }
            50% { transform: scale(1); opacity: 0.35; }
          }
          @keyframes tongueLick {
            0%, 70%, 100% { opacity: 1; transform: scaleX(1); }
            80% { opacity: 1; transform: scaleX(0.6); }
            90% { opacity: 1; transform: scaleX(1.1); }
          }
          @keyframes snakeShimmer {
            0%, 100% { opacity: 0.18; }
            50% { opacity: 0.22; }
          }
          .snake-dash { animation: snakeDash 2s linear infinite; }
          .snake-heart { animation: heartPulse 3s ease-in-out infinite; }
          .snake-tongue { animation: tongueLick 2.5s ease-in-out infinite; transform-origin: -15px 5px; }
          .snake-body { animation: snakeShimmer 4s ease-in-out infinite; }
        `}</style>
        {/* Continuous snake path around the border */}
        {/* Starting from top-center, going clockwise */}
        <path
          className="snake-body"
          d={`
            M200 8
            C240 12, 260 20, 280 14
            C300 8, 320 18, 340 12
            C360 6, 375 16, 385 30
            C395 44, 390 64, 386 84
            C382 104, 392 124, 388 144
            C384 164, 392 184, 388 204
            C384 224, 392 244, 388 264
            C384 284, 392 304, 388 324
            C384 344, 392 364, 388 384
            C384 404, 392 424, 388 444
            C384 464, 392 484, 388 504
            C384 524, 392 544, 388 564
            C384 584, 392 604, 388 624
            C384 644, 392 660, 380 674
            C368 688, 348 692, 328 688
            C308 684, 288 694, 268 690
            C248 686, 228 694, 208 690
            C188 686, 168 694, 148 690
            C128 686, 108 692, 88 680
            C72 668, 62 652, 16 624
            C10 604, 8 584, 12 564
            C16 544, 8 524, 12 504
            C16 484, 8 464, 12 444
            C16 424, 8 404, 12 384
            C16 364, 8 344, 12 324
            C16 304, 8 284, 12 264
            C16 244, 8 224, 12 204
            C16 184, 8 164, 12 144
            C16 124, 8 104, 12 84
            C16 64, 8 44, 22 30
            C36 16, 56 8, 80 14
            C100 20, 120 10, 140 14
            C160 18, 180 12, 200 8
            Z
          `}
          stroke="white"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.07"
        />
        {/* Flowing dashed inner line */}
        <path
          d={`
            M200 8
            C240 12, 260 20, 280 14
            C300 8, 320 18, 340 12
            C360 6, 375 16, 385 30
            C395 44, 390 64, 386 84
            C382 104, 392 124, 388 144
            C384 164, 392 184, 388 204
            C384 224, 392 244, 388 264
            C384 284, 392 304, 388 324
            C384 344, 392 364, 388 384
            C384 404, 392 424, 388 444
            C384 464, 392 484, 388 504
            C384 524, 392 544, 388 564
            C384 584, 392 604, 388 624
            C384 644, 392 660, 380 674
            C368 688, 348 692, 328 688
            C308 684, 288 694, 268 690
            C248 686, 228 694, 208 690
            C188 686, 168 694, 148 690
            C128 686, 108 692, 88 680
            C72 668, 62 652, 16 624
            C10 604, 8 584, 12 564
            C16 544, 8 524, 12 504
            C16 484, 8 464, 12 444
            C16 424, 8 404, 12 384
            C16 364, 8 344, 12 324
            C16 304, 8 284, 12 264
            C16 244, 8 224, 12 204
            C16 184, 8 164, 12 144
            C16 124, 8 104, 12 84
            C16 64, 8 44, 22 30
            C36 16, 56 8, 80 14
            C100 20, 120 10, 140 14
            C160 18, 180 12, 200 8
            Z
          `}
          className="snake-dash"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.1"
          strokeDasharray="8 14"
        />

        {/* Snake head at top-left — Keith Haring style with open mouth */}
        <g opacity="0.3">
          {/* Head shape */}
          <ellipse cx="54" cy="14" rx="20" ry="14" fill="white" />
          {/* Eye */}
          <circle cx="46" cy="9" r="4" fill="currentColor" opacity="0.5" />
          <circle cx="47" cy="8" r="1.5" fill="white" />
          {/* Forked tongue */}
          <path className="snake-tongue" d="M-15 5 L-24 1 M-15 5 L-24 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
          {/* Crown/spikes */}
          <line x1="-2" y1="-5" x2="-4" y2="-12" stroke="white" strokeWidth="2" />
          <line x1="4" y1="-5" x2="4" y2="-13" stroke="white" strokeWidth="2" />
          <line x1="10" y1="-3" x2="12" y2="-10" stroke="white" strokeWidth="2" />
        </g>

        {/* Motion / energy lines — Keith Haring signature parallel marks */}
        {/* Near head */}
        <g opacity="0.22">
          <path d="M90 10 Q96 5 102 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M93 3 Q99 -2 105 3" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M96 -4 Q102 -9 108 -4" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
        {/* Right side motion lines */}
        {[180, 310, 440, 570].map((y) => (
          <g key={`mr-${y}`} opacity="0.16">
            <path d={`M398 ${y} L406 ${y - 4}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M400 ${y - 8} L408 ${y - 12}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M399 ${y - 16} L407 ${y - 20}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ))}
        {/* Left side motion lines */}
        {[210, 350, 490].map((y) => (
          <g key={`ml-${y}`} opacity="0.16">
            <path d={`M-2 ${y} L-10 ${y - 4}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M-4 ${y - 8} L-12 ${y - 12}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M-3 ${y - 16} L-11 ${y - 20}`} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ))}

        {/* Zigzag patterns inside snake body — right side */}
        {[110, 200, 290, 380, 470, 560, 640].map((y) => (
          <g key={`zr-${y}`} opacity="0.12">
            <path
              d={`M380 ${y} l5 12 l-5 12 l5 12 l-5 12`}
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* Zigzag patterns inside snake body — left side */}
        {[110, 200, 290, 380, 470, 560, 640].map((y) => (
          <g key={`zl-${y}`} opacity="0.12">
            <path
              d={`M20 ${y} l-5 12 l5 12 l-5 12 l5 12`}
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* Crosshatch inside top/bottom */}
        {[90, 170, 250, 330].map((x) => (
          <g key={`zt-${x}`} opacity="0.1">
            <path
              d={`M${x} 12 l10 -4 l10 4 l10 -4 l10 4`}
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
        {[90, 170, 250, 330].map((x) => (
          <g key={`zb-${x}`} opacity="0.1">
            <path
              d={`M${x} 694 l10 4 l10 -4 l10 4 l10 -4`}
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Hearts scattered along the snake body */}
        {[
          { x: 392, y: 185 },
          { x: 8, y: 270 },
          { x: 395, y: 435 },
          { x: 10, y: 500 },
          { x: 120, y: 698 },
          { x: 290, y: 695 },
          { x: 100, y: 12 },
          { x: 300, y: 10 },
        ].map(({ x, y }, i) => (
          <g key={`heart-${i}`} className="snake-heart" style={{ animationDelay: `${i * 0.4}s`, transformOrigin: `${x}px ${y}px` }} transform={`translate(${x}, ${y}) scale(0.8)`}>
            <path
              d="M0 3 C0 0, -6 -4, -6 1 C-6 5, 0 9, 0 12 C0 9, 6 5, 6 1 C6 -4, 0 0, 0 3Z"
              fill="white"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
