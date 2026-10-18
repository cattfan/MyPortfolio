import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoArea, geoContains } from "d3-geo";

// The browser only strokes and clips against the mainland, and only while the
// camera is zoomed out, so the published COD-AB boundary (1,158 polygons) is
// reduced to one simplified ring set. Tolerance is in degrees (~220 m).
const TOLERANCE = 0.002;
const DECIMALS = 4;
const DALAT = [108.438, 11.941];
const HANOI = [105.854, 21.029];

function distanceToSegment([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  // A closed ring starts and ends on the same point: fall back to point distance.
  if (length === 0) return Math.hypot(x - x1, y - y1);
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length;
}

// Iterative Douglas–Peucker; keeps the first and last vertex of each ring.
function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let index = -1;
    let max = tolerance;
    for (let i = start + 1; i < end; i++) {
      const distance = distanceToSegment(points[i], points[start], points[end]);
      if (distance > max) {
        max = distance;
        index = i;
      }
    }
    if (index !== -1) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const round = (value) => Number(value.toFixed(DECIMALS));

export function mainlandOutline(boundary, route) {
  const polygons =
    boundary.geometry.type === "MultiPolygon"
      ? boundary.geometry.coordinates
      : [boundary.geometry.coordinates];
  const area = (coordinates) => geoArea({ type: "Polygon", coordinates });
  const mainland = polygons.reduce((largest, polygon) =>
    area(polygon) > area(largest) ? polygon : largest,
  );
  const geometry = {
    type: "Polygon",
    coordinates: mainland.map((ring) =>
      simplify(ring, TOLERANCE).map(([x, y]) => [round(x), round(y)]),
    ),
  };
  if (!geoContains(geometry, DALAT) || !geoContains(geometry, HANOI))
    throw new Error("Simplified outline lost Da Lat or Hanoi");
  if (geoContains(geometry, [0, 0]))
    throw new Error("Simplified outline winding is inverted");
  // The dashed itinerary is clipped to this outline; it must stay fully inside.
  for (let index = 1; index < route.length; index++) {
    for (let step = 0; step <= 100; step++) {
      const point = route[index].map(
        (value, axis) =>
          (value * step) / 100 + route[index - 1][axis] * (1 - step / 100),
      );
      if (!geoContains(geometry, point))
        throw new Error(`Route leaves the simplified outline at ${point.join(",")}`);
    }
  }
  return {
    type: "Feature",
    properties: {
      name: "Việt Nam (mainland outline)",
      source: boundary.properties?.source,
      sourceUrl: boundary.properties?.sourceUrl,
      simplification: `Largest polygon of vietnam-boundary.geojson; Douglas-Peucker ${TOLERANCE} degrees; ${DECIMALS} decimals`,
    },
    geometry,
  };
}

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folder = path.join(app, "public/portfolio");
  const boundary = JSON.parse(
    await readFile(path.join(folder, "vietnam-boundary.geojson"), "utf8"),
  );
  const assets = JSON.parse(await readFile(path.join(folder, "assets.json"), "utf8"));
  const outline = mainlandOutline(boundary, assets.journeyRoute.coordinates);
  const text = JSON.stringify(outline) + "\n";
  await writeFile(path.join(folder, "vietnam-outline.geojson"), text);
  const vertices = outline.geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0);
  console.log(`OUTLINE_PASS: ${vertices} vertices; ${text.length} bytes; route inside`);
}
