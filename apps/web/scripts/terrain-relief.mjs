import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TILE_URL = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium";
const EARTH = 6378137;
const palette = [[0,[215,229,194]],[80,[198,219,181]],[300,[162,197,163]],[700,[116,170,143]],[1200,[85,145,126]],[1800,[113,149,128]],[2500,[163,177,146]],[3400,[219,213,180]]];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const tileX = (longitude, n) => (longitude + 180) / 360 * n;
const tileY = (latitude, n) => (1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * n;

function tint(elevation) {
  const value = Math.max(0, elevation);
  for (let i = 1; i < palette.length; i++) {
    if (value <= palette[i][0]) {
      const a = palette[i - 1], b = palette[i];
      const t = (value - a[0]) / (b[0] - a[0]);
      return a[1].map((color, channel) => color + (b[1][channel] - color) * t);
    }
  }
  return palette.at(-1)[1];
}

export async function renderTerrain({ map, projection, width, height, bounds, cacheDirectory, landMask }) {
  const zoom = Math.min(13, Math.max(7, Math.round(Math.log2(2 * Math.PI * map.scale / 256))));
  const n = 2 ** zoom;
  const northwest = projection.invert(bounds[0]);
  const southeast = projection.invert(bounds[1]);
  // Only Vietnam is relief-tinted; existing sourced neighboring land stays muted.
  const west = Math.max(101.8, northwest[0]);
  const east = Math.min(110, southeast[0]);
  const north = Math.min(23.6, northwest[1]);
  const south = Math.max(8.1, southeast[1]);
  const minX = Math.floor(tileX(west, n)) - 1;
  const maxX = Math.floor(tileX(east, n)) + 1;
  const minY = Math.floor(tileY(north, n)) - 1;
  const maxY = Math.floor(tileY(south, n)) + 1;
  const sourceWidth = (maxX - minX + 1) * 256;
  const sourceHeight = (maxY - minY + 1) * 256;
  const elevations = new Float32Array(sourceWidth * sourceHeight);
  const tiles = [];
  const queue = [];
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) queue.push({ x, y });
  await mkdir(cacheDirectory, { recursive: true });
  let index = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (index < queue.length) {
      const { x, y } = queue[index++];
      const filename = `${zoom}-${x}-${y}.png`;
      const url = `${TILE_URL}/${zoom}/${x}/${y}.png`;
      let bytes;
      try { bytes = await readFile(path.join(cacheDirectory, filename)); }
      catch {
        const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
        if (!response.ok) throw new Error(`DEM tile ${response.status}: ${url}`);
        bytes = Buffer.from(await response.arrayBuffer());
        await writeFile(path.join(cacheDirectory, filename), bytes);
      }
      const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      if (info.width !== 256 || info.height !== 256) throw new Error(`Unexpected DEM tile size: ${filename}`);
      for (let row = 0; row < 256; row++) for (let column = 0; column < 256; column++) {
        const pixel = (row * 256 + column) * info.channels;
        elevations[((y - minY) * 256 + row) * sourceWidth + (x - minX) * 256 + column] = data[pixel] * 256 + data[pixel + 1] + data[pixel + 2] / 256 - 32768;
      }
      tiles.push({ z: zoom, x, y, url, cache: filename, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
  }));
  console.log(`DEM ${map.name}: ${tiles.length} Terrarium tiles at z${zoom}`);
  const sample = (x, y) => {
    x = clamp(x, 0, sourceWidth - 2); y = clamp(y, 0, sourceHeight - 2);
    const ix = Math.floor(x), iy = Math.floor(y), dx = x - ix, dy = y - iy;
    const p = iy * sourceWidth + ix;
    return (elevations[p] * (1 - dx) + elevations[p + 1] * dx) * (1 - dy) + (elevations[p + sourceWidth] * (1 - dx) + elevations[p + sourceWidth + 1] * dx) * dy;
  };
  const output = Buffer.alloc(width * height * 4);
  const startX = tileX(northwest[0], n) * 256 - minX * 256 - .5;
  const startY = tileY(northwest[1], n) * 256 - minY * 256 - .5;
  const step = n * 256 / (2 * Math.PI * map.scale);
  const heightMeters = 2 * Math.PI * EARTH / (n * 256);
  const exaggeration = map.kind === "national" ? 4.5 : map.kind === "regional" ? 2.8 : map.kind === "highlands" ? 1.6 : .75;
  let minElevation = Infinity, maxElevation = -Infinity, landPixels = 0;
  for (let y = 0; y < height; y++) {
    const sy = startY + (y + .5) * step;
    const latitude = projection.invert([0, bounds[0][1] + y])[1];
    const meters = heightMeters * Math.cos(latitude * Math.PI / 180);
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      const alpha = landMask[pixel];
      if (!alpha) continue;
      const sx = startX + (x + .5) * step;
      if (sx < 1 || sy < 1 || sx >= sourceWidth - 2 || sy >= sourceHeight - 2) continue;
      const elevation = sample(sx, sy);
      const dx = (sample(sx + 1, sy) - sample(sx - 1, sy)) / (2 * meters) * exaggeration;
      const dy = (sample(sx, sy + 1) - sample(sx, sy - 1)) / (2 * meters) * exaggeration;
      const normal = Math.sqrt(dx * dx + dy * dy + 1);
      // Northwest light with a gentle fill retains readable shadows on steep terrain.
      const diffuse = clamp((dx * .5 + dy * .5 + .7071) / normal, 0, 1);
      const shade = clamp(1 + (diffuse - .7071) * 1.15, .55, 1.28);
      const rgb = tint(elevation);
      const local = map.kind === "city";
      for (let channel = 0; channel < 3; channel++) {
        const c = local ? rgb[channel] * .28 + [224,234,212][channel] * .72 : rgb[channel];
        output[pixel * 4 + channel] = clamp(c * (local ? 1 + (shade - 1) * .65 : shade), 0, 255);
      }
      output[pixel * 4 + 3] = alpha;
      minElevation = Math.min(minElevation, elevation);
      maxElevation = Math.max(maxElevation, elevation);
      landPixels++;
    }
  }
  return {
    buffer: await sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer(),
    metadata: { id: map.name, zoom, tiles: tiles.sort((a,b) => a.y - b.y || a.x - b.x), elevationRangeMeters: [Math.round(minElevation), Math.round(maxElevation)], landPixels, verticalExaggeration: exaggeration, palette: palette.map(([meters,rgb]) => ({ meters, rgb })) },
  };
}

export const terrainSource = {
  name: "Mapzen Terrain Tiles / USGS SRTM, GMTED2010 and NOAA ETOPO1",
  url: "https://registry.opendata.aws/terrain-tiles/",
  tileUrl: `${TILE_URL}/{z}/{x}/{y}.png`,
  format: "Terrarium RGB: (red * 256 + green + blue / 256) - 32768 meters; EPSG:3857",
  formatUrl: "https://github.com/tilezen/joerd/blob/master/docs/formats.md",
  attributionUrl: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
  license: "Open elevation data; SRTM/GMTED2010 courtesy of USGS, global ETOPO1 courtesy of NOAA. Provider-specific terms in attribution URL.",
  usage: "Actual elevation tiles reprojected to exactly the existing d3 Mercator pixels. Elevation tint and northwest hillshade are clipped to the sourced Vietnam polygon. Offline preparation only; no runtime tile requests.",
};
