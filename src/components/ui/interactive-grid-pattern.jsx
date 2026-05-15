import { memo, useCallback, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Lightweight grid background: one tiled SVG pattern + one hover cell (not thousands of rects).
 */
function InteractiveGridPatternInner({
  width = 40,
  height = 40,
  squares = [36, 22],
  className,
  squaresClassName,
  interactive = true,
  ...props
}) {
  const patternId = useId().replace(/:/g, "");
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const [hover, setHover] = useState(null);

  const [horizontal, vertical] = squares;
  const viewW = width * horizontal;
  const viewH = height * vertical;

  const scheduleHover = useCallback(
    (clientX, clientY) => {
      if (!interactive) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const svg = svgRef.current;
        if (!svg) return;

        // Map screen coords → SVG space (includes parent skew, scale, etc.)
        const ctm = svg.getScreenCTM();
        if (!ctm) return;

        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        const loc = point.matrixTransform(ctm.inverse());

        const col = Math.floor(loc.x / width);
        const row = Math.floor(loc.y / height);

        if (col < 0 || col >= horizontal || row < 0 || row >= vertical) {
          setHover(null);
          return;
        }

        setHover((prev) =>
          prev?.col === col && prev?.row === row ? prev : { col, row }
        );
      });
    },
    [interactive, width, height, horizontal, vertical]
  );

  const onPointerMove = useCallback(
    (e) => scheduleHover(e.clientX, e.clientY),
    [scheduleHover]
  );

  const onPointerLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHover(null);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="none"
      className={cn(
        "absolute inset-0 h-full w-full border-0 touch-none",
        interactive && "pointer-events-auto",
        className
      )}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse">
          <path
            d={`M ${width} 0 L 0 0 0 ${height}`}
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className={cn("stroke-gray-400/25", squaresClassName)}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      {hover && (
        <rect
          x={hover.col * width}
          y={hover.row * height}
          width={width}
          height={height}
          className="fill-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pointer-events-none"
        />
      )}
    </svg>
  );
}

export const InteractiveGridPattern = memo(InteractiveGridPatternInner);
