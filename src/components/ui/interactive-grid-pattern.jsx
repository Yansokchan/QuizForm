import { memo, useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const HOVER_MQ = "(hover: hover) and (pointer: fine)";

/**
 * Lightweight grid background: one tiled SVG pattern + one hover cell (not thousands of rects).
 * Hover is disabled on touch/coarse pointers so the grid does not block page scroll.
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
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(HOVER_MQ);
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const isInteractive = interactive && canHover;

  const [horizontal, vertical] = squares;
  const viewW = width * horizontal;
  const viewH = height * vertical;

  const scheduleHover = useCallback(
    (clientX, clientY) => {
      if (!isInteractive) return;

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
    [isInteractive, width, height, horizontal, vertical]
  );

  const onPointerMove = useCallback(
    (e) => scheduleHover(e.clientX, e.clientY),
    [scheduleHover]
  );

  const onPointerLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHover(null);
  }, []);

  useEffect(() => {
    if (!isInteractive) setHover(null);
  }, [isInteractive]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="none"
      className={cn(
        "absolute inset-0 h-full w-full border-0",
        isInteractive ? "touch-none pointer-events-auto" : "pointer-events-none",
        className
      )}
      onPointerMove={isInteractive ? onPointerMove : undefined}
      onPointerLeave={isInteractive ? onPointerLeave : undefined}
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
      {isInteractive && hover && (
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
