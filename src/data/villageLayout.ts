// Isometric Village Path node coordinates (DESIGN_SPEC.md §4) — a positioned serpentine
// layout, not a uniform grid. Values are percentages of the map container so the trail
// reflows at every breakpoint without recomputing pixel math.

export interface NodePosition {
  itemId: string;
  x: number; // % from left
  y: number; // % from top
}

// Letters ride the upper serpentine, numbers the lower run (DESIGN_SPEC.md §4).
export const NODE_LAYOUT: NodePosition[] = [
  { itemId: "letter-A", x: 13, y: 20 },
  { itemId: "letter-B", x: 25, y: 15 },
  { itemId: "letter-C", x: 37, y: 22 },
  { itemId: "letter-D", x: 47, y: 34 },
  { itemId: "letter-E", x: 59, y: 29 },
  { itemId: "number-0", x: 34, y: 58 },
  { itemId: "number-1", x: 46, y: 65 },
  { itemId: "number-2", x: 58, y: 58 },
  { itemId: "number-3", x: 70, y: 65 },
  { itemId: "number-4", x: 82, y: 58 },
];

// The order the trail is drawn through — a home cabin at the trailhead, then every node
// in visiting order, matching LessonItem order (letters A-E, then numbers 0-4).
export const TRAIL_ORDER = [
  "home",
  "letter-A",
  "letter-B",
  "letter-C",
  "letter-D",
  "letter-E",
  "number-0",
  "number-1",
  "number-2",
  "number-3",
  "number-4",
];

export const HOME_POSITION: NodePosition = { itemId: "home", x: 5, y: 8 };

export interface ZoneGateway {
  id: string;
  label: string;
  x: number;
  y: number;
}

// Decorative locked-zone signposts at the margins — set dressing that promises a bigger
// world, not real navigation targets yet (DESIGN_SPEC.md §4).
export const ZONE_GATEWAYS: ZoneGateway[] = [
  { id: "alphabet-forest", label: "Alphabet Forest", x: 93, y: 8 },
  { id: "number-mine", label: "Number Mine", x: 4, y: 44 },
  { id: "creative-studio", label: "Creative Studio", x: 5, y: 84 },
  { id: "dance-stage", label: "Dance Stage", x: 93, y: 60 },
  { id: "skyline-swing", label: "Skyline Swing", x: 93, y: 84 },
];

export function getNodePosition(itemId: string): NodePosition {
  const pos = NODE_LAYOUT.find((n) => n.itemId === itemId);
  if (!pos) throw new Error(`No village layout position for item "${itemId}"`);
  return pos;
}

const POSITION_BY_ID = new Map<string, NodePosition>([
  [HOME_POSITION.itemId, HOME_POSITION],
  ...NODE_LAYOUT.map((n): [string, NodePosition] => [n.itemId, n]),
]);

// Straight-segment polyline through the trail order, expressed as an SVG path `d` string
// in a 0-100 viewBox (matches the % coordinates 1:1 so no unit conversion is needed).
export function buildTrailPath(): string {
  const points = TRAIL_ORDER.map((id) => POSITION_BY_ID.get(id)).filter(
    (p): p is NodePosition => Boolean(p)
  );
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return [`M ${first.x} ${first.y}`, ...rest.map((p) => `L ${p.x} ${p.y}`)].join(" ");
}
