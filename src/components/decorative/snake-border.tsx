export function SnakeBorder() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Left snake - flowing down the left side */}
      <svg
        className="absolute left-0 top-0 h-full w-16 md:w-24"
        viewBox="0 0 80 800"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 0 C60 40, 70 60, 55 100 C40 140, 15 160, 20 200 C25 240, 65 260, 60 300 C55 340, 15 360, 20 400 C25 440, 65 460, 60 500 C55 540, 15 560, 20 600 C25 640, 65 660, 60 700 C55 740, 25 760, 40 800"
          stroke="white"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.15"
        />
        {/* Snake pattern lines */}
        <path
          d="M40 0 C60 40, 70 60, 55 100 C40 140, 15 160, 20 200 C25 240, 65 260, 60 300 C55 340, 15 360, 20 400 C25 440, 65 460, 60 500 C55 540, 15 560, 20 600 C25 640, 65 660, 60 700 C55 740, 25 760, 40 800"
          stroke="white"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.08"
        />
        {/* Inner pattern squiggles */}
        {[80, 200, 320, 440, 560, 680].map((y) => (
          <g key={y} opacity="0.12">
            <path
              d={`M${30 + (y % 40)} ${y} q8 10 0 20 q-8 10 0 20`}
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M${40 + (y % 30)} ${y + 5} q6 8 0 16 q-6 8 0 16`}
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        ))}
        {/* Small hearts along the snake */}
        {[150, 350, 550, 750].map((y) => (
          <g key={`h-${y}`} opacity="0.15" transform={`translate(${25 + (y % 30)}, ${y})`}>
            <path
              d="M0 3 C0 0, -4 -2, -4 1 C-4 3, 0 6, 0 8 C0 6, 4 3, 4 1 C4 -2, 0 0, 0 3Z"
              fill="white"
            />
          </g>
        ))}
      </svg>

      {/* Right snake - flowing down the right side */}
      <svg
        className="absolute right-0 top-0 h-full w-16 md:w-24"
        viewBox="0 0 80 800"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 0 C20 40, 10 60, 25 100 C40 140, 65 160, 60 200 C55 240, 15 260, 20 300 C25 340, 65 360, 60 400 C55 440, 15 460, 20 500 C25 540, 65 560, 60 600 C55 640, 15 660, 20 700 C25 740, 55 760, 40 800"
          stroke="white"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.15"
        />
        <path
          d="M40 0 C20 40, 10 60, 25 100 C40 140, 65 160, 60 200 C55 240, 15 260, 20 300 C25 340, 65 360, 60 400 C55 440, 15 460, 20 500 C25 540, 65 560, 60 600 C55 640, 15 660, 20 700 C25 740, 55 760, 40 800"
          stroke="white"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.08"
        />
        {[80, 200, 320, 440, 560, 680].map((y) => (
          <g key={y} opacity="0.12">
            <path
              d={`M${35 + (y % 30)} ${y} q8 10 0 20 q-8 10 0 20`}
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
          </g>
        ))}
        {[250, 450, 650].map((y) => (
          <g key={`h-${y}`} opacity="0.15" transform={`translate(${45 + (y % 20)}, ${y})`}>
            <path
              d="M0 3 C0 0, -4 -2, -4 1 C-4 3, 0 6, 0 8 C0 6, 4 3, 4 1 C4 -2, 0 0, 0 3Z"
              fill="white"
            />
          </g>
        ))}
      </svg>

      {/* Top snake - flowing across the top */}
      <svg
        className="absolute top-0 left-0 w-full h-16 md:h-24"
        viewBox="0 0 800 80"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 40 C40 60, 60 70, 100 55 C140 40, 160 15, 200 20 C240 25, 260 65, 300 60 C340 55, 360 15, 400 20 C440 25, 460 65, 500 60 C540 55, 560 15, 600 20 C640 25, 660 65, 700 60 C740 55, 760 25, 800 40"
          stroke="white"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.15"
        />
        <path
          d="M0 40 C40 60, 60 70, 100 55 C140 40, 160 15, 200 20 C240 25, 260 65, 300 60 C340 55, 360 15, 400 20 C440 25, 460 65, 500 60 C540 55, 560 15, 600 20 C640 25, 660 65, 700 60 C740 55, 760 25, 800 40"
          stroke="white"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.08"
        />
        {/* Snake head at top-left with tongue */}
        <g opacity="0.2" transform="translate(15, 25)">
          <ellipse cx="0" cy="0" rx="12" ry="8" fill="white" />
          <circle cx="-4" cy="-2" r="2.5" fill="currentColor" opacity="0.6" />
          <path d="M-12 0 L-20 -5 M-12 0 L-20 5" stroke="white" strokeWidth="2" />
        </g>
      </svg>

      {/* Bottom snake - flowing across the bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full h-16 md:h-24"
        viewBox="0 0 800 80"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 40 C40 20, 60 10, 100 25 C140 40, 160 65, 200 60 C240 55, 260 15, 300 20 C340 25, 360 65, 400 60 C440 55, 460 15, 500 20 C540 25, 560 65, 600 60 C640 55, 660 15, 700 20 C740 25, 760 55, 800 40"
          stroke="white"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.15"
        />
        <path
          d="M0 40 C40 20, 60 10, 100 25 C140 40, 160 65, 200 60 C240 55, 260 15, 300 20 C340 25, 360 65, 400 60 C440 55, 460 15, 500 20 C540 25, 560 65, 600 60 C640 55, 660 15, 700 20 C740 25, 760 55, 800 40"
          stroke="white"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.08"
        />
        {/* Hearts near the bottom */}
        {[200, 400, 600].map((x) => (
          <g key={`bh-${x}`} opacity="0.15" transform={`translate(${x}, ${30 + (x % 20)})`}>
            <path
              d="M0 3 C0 0, -5 -3, -5 1 C-5 4, 0 7, 0 10 C0 7, 5 4, 5 1 C5 -3, 0 0, 0 3Z"
              fill="white"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SnakeBorderFrame() {
  // A more prominent, continuous snake border that frames content like the flyer
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 700"
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
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.18"
        />
        {/* Inner line of the snake body */}
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
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.1"
          strokeDasharray="4 8"
        />

        {/* Snake head at top - facing left */}
        <g opacity="0.25" transform="translate(190, 2)">
          <ellipse cx="0" cy="5" rx="15" ry="10" fill="white" />
          <circle cx="-5" cy="2" r="3" fill="currentColor" opacity="0.5" />
          {/* Forked tongue */}
          <path className="snake-tongue" d="M-15 5 L-24 1 M-15 5 L-24 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
          {/* Crown/spikes */}
          <line x1="-2" y1="-5" x2="-4" y2="-12" stroke="white" strokeWidth="2" />
          <line x1="4" y1="-5" x2="4" y2="-13" stroke="white" strokeWidth="2" />
          <line x1="10" y1="-3" x2="12" y2="-10" stroke="white" strokeWidth="2" />
        </g>

        {/* Decorative pattern inside the snake body - zigzag lines */}
        {/* Right side patterns */}
        {[100, 180, 260, 340, 420, 500, 580].map((y) => (
          <g key={`rp-${y}`} opacity="0.1">
            <path
              d={`M383 ${y} l3 8 l-3 8 l3 8 l-3 8`}
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        ))}
        {/* Left side patterns */}
        {[100, 180, 260, 340, 420, 500, 580].map((y) => (
          <g key={`lp-${y}`} opacity="0.1">
            <path
              d={`M17 ${y} l-3 8 l3 8 l-3 8 l3 8`}
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        ))}

        {/* Hearts scattered along the snake body */}
        {[
          { x: 390, y: 160 },
          { x: 8, y: 300 },
          { x: 392, y: 450 },
          { x: 12, y: 550 },
          { x: 140, y: 692 },
          { x: 300, y: 688 },
          { x: 80, y: 12 },
          { x: 320, y: 10 },
        ].map(({ x, y }, i) => (
          <g key={`heart-${i}`} className="snake-heart" style={{ animationDelay: `${i * 0.4}s`, transformOrigin: `${x}px ${y}px` }} transform={`translate(${x}, ${y}) scale(0.8)`}>
            <path
              d="M0 3 C0 0, -5 -3, -5 1 C-5 4, 0 7, 0 10 C0 7, 5 4, 5 1 C5 -3, 0 0, 0 3Z"
              fill="white"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
