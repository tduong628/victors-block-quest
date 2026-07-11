// Regenerates public/icons/*.png from the vector master src/assets/icon-master.svg.
// Run manually whenever the icon master changes — never part of the build or CI.
// Usage: node scripts/generate-icons.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const SVG_PATH = path.resolve(process.cwd(), "src/assets/icon-master.svg");
const OUT_DIR = path.resolve(process.cwd(), "public/icons");

const TARGETS = [
  { size: 192, file: "icon-192.png" },
  { size: 512, file: "icon-512.png" },
  // The maskable variant reuses the same render: the icon master already bleeds
  // its cream background to the edges and keeps the cube within the ~80% safe
  // zone, so no separate maskable-only artwork is needed (see DESIGN_SPEC.md §8).
  { size: 512, file: "icon-maskable-512.png" },
];

const svg = await fs.readFile(SVG_PATH, "utf8");
await fs.mkdir(OUT_DIR, { recursive: true });

for (const { size, file } of TARGETS) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, file);
  await fs.writeFile(outPath, png);
  console.log(`wrote ${outPath} (${size}x${size})`);
}
