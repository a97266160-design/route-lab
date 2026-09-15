import type { Dataset, Point, Route, RouteTransition } from "@/domain/types";
import { cn } from "@/lib/utils";
import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";

export type CanvasOptions = {
  showIds: boolean;
  showRoute: boolean;
  showArrows: boolean;
  showClusters: boolean;
  showLongEdges: boolean;
  showSequence: boolean;
};

export const defaultCanvasOptions: CanvasOptions = {
  showIds: false,
  showRoute: true,
  showArrows: true,
  showClusters: false,
  showLongEdges: true,
  showSequence: false,
};

const VIEW = 100;

function useProjection(points: Point[]) {
  return useMemo(() => {
    if (points.length === 0) return { project: (p: Point) => p.coordinate };
    const xs = points.map((p) => p.coordinate.x);
    const ys = points.map((p) => p.coordinate.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = Math.max(maxX - minX, maxY - minY) || 1;
    const pad = 6;
    const scale = (VIEW - pad * 2) / span;
    return {
      project: (p: Point) => ({
        x: pad + (p.coordinate.x - minX) * scale,
        y: pad + (p.coordinate.y - minY) * scale,
      }),
    };
  }, [points]);
}

export function RouteCanvas({
  dataset,
  route,
  options,
  longTransitions = [],
  highlightedTransition,
  selectedPointId,
  onSelectPoint,
  className,
  compact = false,
}: {
  dataset: Dataset;
  route?: Route | null;
  options: CanvasOptions;
  longTransitions?: RouteTransition[];
  highlightedTransition?: { fromId: string; toId: string } | null;
  selectedPointId?: string | null;
  onSelectPoint?: (id: string | null) => void;
  className?: string;
  compact?: boolean;
}) {
  const points = dataset.points;
  const { project } = useProjection(points);
  const byId = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);
  const positionById = useMemo(
    () => new Map(points.map((p) => [p.id, project(p)])),
    [points, project],
  );
  const routePosition = useMemo(() => {
    const map = new Map<string, number>();
    route?.pointIds.forEach((id, index) => map.set(id, index + 1));
    return map;
  }, [route]);

  const longEdgeKeys = useMemo(
    () => new Set(longTransitions.map((t) => `${t.fromId}->${t.toId}`)),
    [longTransitions],
  );

  const clusters = useMemo(() => {
    const list = [...new Set(points.map((p) => p.cluster).filter(Boolean))] as string[];
    return new Map(list.map((cluster, index) => [cluster, index]));
  }, [points]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<Point | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setZoom((current) => Math.min(8, Math.max(0.6, current * (event.deltaY < 0 ? 1.15 : 0.87))));
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const dx = (event.clientX - drag.current.x) / 6;
    const dy = (event.clientY - drag.current.y) / 6;
    drag.current = { x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: current.x + dx, y: current.y + dy }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const size = VIEW / zoom;
  const origin = (VIEW - size) / 2 - pan.x;
  const originY = (VIEW - size) / 2 - pan.y;
  const dot = compact ? 0.7 : 0.62;

  const segments = useMemo(() => {
    if (!route || !options.showRoute) return [];
    const result: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      long: boolean;
      highlighted: boolean;
    }> = [];
    for (let i = 0; i + 1 < route.pointIds.length; i += 1) {
      const fromId = route.pointIds[i];
      const toId = route.pointIds[i + 1];
      const a = positionById.get(fromId);
      const b = positionById.get(toId);
      if (!a || !b) continue;
      result.push({
        key: `${fromId}->${toId}-${i}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        long: options.showLongEdges && longEdgeKeys.has(`${fromId}->${toId}`),
        highlighted:
          highlightedTransition?.fromId === fromId && highlightedTransition?.toId === toId,
      });
    }
    return result;
  }, [route, options.showRoute, options.showLongEdges, positionById, longEdgeKeys, highlightedTransition]);

  const arrowEvery = Math.max(1, Math.round(segments.length / 42));

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border grid-surface", className)}>
      <svg
        viewBox={`${origin} ${originY} ${size} ${size}`}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setHover(null);
        }}
        role="img"
        aria-label="Route visualization"
      >
        <defs>
          <marker id="rol-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-signal)" />
          </marker>
        </defs>

        {options.showClusters
          ? [...clusters.keys()].map((cluster) => {
              const members = points.filter((p) => p.cluster === cluster).map(project);
              if (members.length < 3) return null;
              const cx = members.reduce((s, m) => s + m.x, 0) / members.length;
              const cy = members.reduce((s, m) => s + m.y, 0) / members.length;
              const r =
                Math.max(...members.map((m) => Math.hypot(m.x - cx, m.y - cy))) + 1.2;
              return (
                <circle
                  key={cluster}
                  cx={cx}
                  cy={cy}
                  r={r}
                  className="fill-primary/5 stroke-primary/25"
                  strokeWidth={0.15}
                  strokeDasharray="1 1"
                />
              );
            })
          : null}

        {segments.map((segment, index) => (
          <line
            key={segment.key}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke={
              segment.highlighted
                ? "var(--color-experimental)"
                : segment.long
                  ? "var(--color-weakness)"
                  : "var(--color-signal)"
            }
            strokeWidth={segment.highlighted ? 0.6 : segment.long ? 0.45 : 0.22}
            strokeOpacity={segment.long || segment.highlighted ? 0.95 : 0.55}
            markerEnd={
              options.showArrows && index % arrowEvery === 0 ? "url(#rol-arrow)" : undefined
            }
          />
        ))}

        {points.map((point) => {
          const position = positionById.get(point.id)!;
          const isDepot = point.id === dataset.depotId;
          const isSelected = point.id === selectedPointId;
          const sequence = routePosition.get(point.id);
          const isStart = sequence === 1;
          const isEnd = sequence === route?.pointIds.length;
          return (
            <g key={point.id}>
              {isDepot ? (
                <rect
                  x={position.x - 1.1}
                  y={position.y - 1.1}
                  width={2.2}
                  height={2.2}
                  transform={`rotate(45 ${position.x} ${position.y})`}
                  fill="var(--color-depot)"
                  stroke="var(--color-background)"
                  strokeWidth={0.2}
                />
              ) : (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={isSelected ? dot * 2 : dot}
                  fill={
                    isSelected
                      ? "var(--color-experimental)"
                      : isEnd
                        ? "var(--color-improved)"
                        : isStart
                          ? "var(--color-depot)"
                          : "var(--color-foreground)"
                  }
                  fillOpacity={isSelected ? 1 : 0.82}
                />
              )}
              <circle
                cx={position.x}
                cy={position.y}
                r={2}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setHover(point)}
                onClick={() => onSelectPoint?.(point.id === selectedPointId ? null : point.id)}
              />
              {options.showIds ? (
                <text
                  x={position.x + 1.4}
                  y={position.y - 1}
                  fontSize={1.5}
                  fill="var(--color-muted-foreground)"
                  className="num"
                >
                  {point.id}
                </text>
              ) : null}
              {options.showSequence && sequence ? (
                <text
                  x={position.x + 1.2}
                  y={position.y + 2}
                  fontSize={1.5}
                  fill="var(--color-signal)"
                  className="num"
                >
                  {sequence}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-2 top-2 flex gap-1.5">
        <span className="rounded-sm border border-border bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {points.length} pts
        </span>
        <span className="rounded-sm border border-border bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          zoom {zoom.toFixed(1)}×
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }}
        className="absolute right-2 top-2 rounded-sm border border-border bg-background/85 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
      >
        Reset view
      </button>

      {hover ? (
        <div className="pointer-events-none absolute bottom-2 left-2 max-w-[19rem] rounded-md border border-border bg-popover/95 px-2.5 py-2 text-xs shadow-panel">
          <div className="num text-[11px] text-signal">{hover.id}</div>
          <div className="font-medium text-popover-foreground">{hover.address}</div>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
            {hover.tags.length ? (
              hover.tags.map((tag) => (
                <span key={tag} className="rounded-sm border border-border px-1 font-mono">
                  {tag}
                </span>
              ))
            ) : (
              <span className="font-mono">no tags</span>
            )}
          </div>
          <div className="num mt-1 text-[10px] text-muted-foreground">
            original #{hover.originalIndex}
            {routePosition.get(hover.id) ? ` · route #${routePosition.get(hover.id)}` : ""}
          </div>
        </div>
      ) : null}

      {byId.size === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Dataset is empty.
        </div>
      ) : null}
    </div>
  );
}
