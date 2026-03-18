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
          {/* Energy lines */}
          <path d="M-4 -30 L-6 -36 M1 -30 L1 -37 M6 -29 L8 -35" {...strokeProps} strokeWidth={2} />
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
        </g>
      );
  }
}

// Small inline dancing figure for composing the snake body
function SnakeBodyFigure({ variant }: { variant: number }) {
  // Compact Keith Haring figures designed to chain together as snake segments
  const fill = "white";
  switch (variant % 5) {
    case 0:
      // Arms-up figure
      return (
        <g>
          <circle cx="0" cy="-8" r="3.5" fill={fill} />
          <path d="M0 -4.5 L0 5" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -2 L-7 -9" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -2 L7 -9" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 5 L-5 13" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 5 L5 13" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 1:
      // Running figure
      return (
        <g>
          <circle cx="1" cy="-8" r="3.5" fill={fill} />
          <path d="M1 -4.5 L0 5" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0.5 -2 L-7 0" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0.5 -2 L7 -7" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 5 L-6 13" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 5 L7 11" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 2:
      // Wide stance figure
      return (
        <g>
          <circle cx="0" cy="-8" r="3.5" fill={fill} />
          <path d="M0 -4.5 L0 4" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -1 L-8 -5" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -1 L8 -5" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 4 L-7 13" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 4 L7 13" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 3:
      // Kicking figure
      return (
        <g>
          <circle cx="0" cy="-8" r="3.5" fill={fill} />
          <path d="M0 -4.5 L-1 5" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-0.5 -2 L-8 -8" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-0.5 -2 L6 -1" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-1 5 L-7 12" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-1 5 L8 9" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 4:
    default:
      // Jumping split figure
      return (
        <g>
          <circle cx="0" cy="-8" r="3.5" fill={fill} />
          <path d="M0 -4.5 L0 4" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -1 L-6 -8" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -1 L7 -6" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 4 L-8 10" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 4 L8 10" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
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
        preserveAspectRatio="xMidYMid slice"
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
  // Keith Haring-style snake border — the snake body is composed of
  // chained dancing figures, inspired by Haring's iconic style.
  // The snake winds around the entire border with figures forming its body.

  // Points along the snake path where figures are placed.
  // The snake winds: top → right → bottom → left, forming a continuous border.
  // Each figure is positioned and rotated to follow the snake's direction.
  const snakeFigures: Array<{
    x: number;
    y: number;
    rotate: number;
    variant: number;
    scale: number;
  }> = [];

  // --- TOP EDGE (left to right) ---
  const topY = [16, 10, 18, 8, 14, 10, 16, 8, 12, 16, 10];
  for (let i = 0; i < 11; i++) {
    snakeFigures.push({
      x: 30 + i * 34,
      y: topY[i],
      rotate: -90 + (i % 2 === 0 ? 5 : -5),
      variant: i % 5,
      scale: 0.7 + (i % 3) * 0.05,
    });
  }

  // --- RIGHT EDGE (top to bottom) ---
  const rightX = [386, 392, 384, 390, 386, 392, 384, 390, 386, 392, 384, 390, 386, 392, 384, 390, 386];
  for (let i = 0; i < 17; i++) {
    snakeFigures.push({
      x: rightX[i],
      y: 40 + i * 39,
      rotate: 0 + (i % 2 === 0 ? 8 : -8),
      variant: (i + 2) % 5,
      scale: 0.7 + (i % 3) * 0.05,
    });
  }

  // --- BOTTOM EDGE (right to left) ---
  const botY = [694, 700, 692, 698, 694, 700, 692, 698, 694, 700, 694];
  for (let i = 0; i < 11; i++) {
    snakeFigures.push({
      x: 370 - i * 34,
      y: botY[i],
      rotate: 90 + (i % 2 === 0 ? -5 : 5),
      variant: (i + 1) % 5,
      scale: 0.7 + (i % 3) * 0.05,
    });
  }

  // --- LEFT EDGE (bottom to top) ---
  const leftX = [14, 8, 16, 10, 14, 8, 16, 10, 14, 8, 16, 10, 14, 8, 16, 10, 14];
  for (let i = 0; i < 17; i++) {
    snakeFigures.push({
      x: leftX[i],
      y: 660 - i * 39,
      rotate: 180 + (i % 2 === 0 ? -8 : 8),
      variant: (i + 3) % 5,
      scale: 0.7 + (i % 3) * 0.05,
    });
  }

  // Hearts scattered along the border path
  const hearts = [
    { x: 130, y: 8 },
    { x: 280, y: 14 },
    { x: 390, y: 150 },
    { x: 386, y: 350 },
    { x: 392, y: 540 },
    { x: 280, y: 698 },
    { x: 130, y: 694 },
    { x: 10, y: 550 },
    { x: 14, y: 350 },
    { x: 8, y: 150 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 710"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes snakeFigBounce {
            0%, 100% { opacity: 0.18; }
            50% { opacity: 0.25; }
          }
          @keyframes heartPulse {
            0%, 100% { transform: scale(0.8); opacity: 0.2; }
            50% { transform: scale(1); opacity: 0.35; }
          }
          @keyframes snakeHeadBob {
            0%, 100% { transform: translate(46px, 10px) rotate(-30deg); }
            50% { transform: translate(46px, 10px) rotate(-25deg); }
          }
          .snake-fig { animation: snakeFigBounce 3s ease-in-out infinite; }
          .snake-heart { animation: heartPulse 3s ease-in-out infinite; }
          .snake-head { animation: snakeHeadBob 2.5s ease-in-out infinite; }
        `}</style>

        {/* Dancing figures forming the snake body */}
        {snakeFigures.map((f, i) => (
          <g
            key={`sf-${i}`}
            className="snake-fig"
            transform={`translate(${f.x}, ${f.y}) scale(${f.scale}) rotate(${f.rotate})`}
            style={{ animationDelay: `${(i * 0.15) % 3}s` }}
          >
            <SnakeBodyFigure variant={f.variant} />
          </g>
        ))}

        {/* Snake head at top-left — Keith Haring style creature */}
        <g className="snake-head" opacity="0.3">
          {/* Head — angular Haring-style */}
          <path
            d="M-12 -8 L12 -10 L14 4 L10 12 L-10 12 L-14 4 Z"
            fill="white"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Eye */}
          <circle cx="-3" cy="-1" r="3.5" fill="currentColor" opacity="0.6" />
          <circle cx="-2" cy="-2" r="1.5" fill="white" />
          {/* Open mouth */}
          <path d="M8 4 L18 2 L18 8 L8 10" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          {/* Crown/energy spikes from head */}
          <line x1="-6" y1="-10" x2="-8" y2="-18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="-10" x2="0" y2="-19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="6" y1="-10" x2="8" y2="-17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Hearts scattered along the snake body */}
        {hearts.map(({ x, y }, i) => (
          <g
            key={`heart-${i}`}
            className="snake-heart"
            style={{
              animationDelay: `${i * 0.4}s`,
              transformOrigin: `${x}px ${y}px`,
            }}
            transform={`translate(${x}, ${y}) scale(0.9)`}
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
