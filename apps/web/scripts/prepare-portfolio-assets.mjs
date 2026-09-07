import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoArea, geoBounds, geoContains, geoMercator, geoPath } from "d3-geo";
import sharp from "sharp";
import { renderTerrain, terrainSource } from "./terrain-relief.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/portfolio");
const fonts = path.join(root, "app/fonts");
const mapsOnly = process.argv.includes("--maps-only");
const W = 2048;
const H = 1160;
const OVERSCAN = 2;
const MAP_BOUNDS = [[-W / 2, -H / 2], [W * 1.5, H * 1.5]];
const DALAT = [108.438, 11.941];
const JOURNEY = [
  [105.854,21.029],[105.974,20.258],
  [105.76,19.81],[105.55,19.4],[105.5,18.95],[105.68,18.68],
  [105.9,18.35],[106.12,18.13],[106.2,17.9],[106.3,17.64],
  [106.59,17.46],[106.65,17.3],[106.91,16.97],[107.1,16.81],
  [107.3,16.65],[107.56,16.47],[107.7,16.31],[107.85,16.21],
  [108,16.08],[108.17,16.05],[108.2,15.92],[108.43,15.58],
  [108.7,15.13],[108.92,14.64],[108.99,14.25],[109.05,13.84],
  [109.1,13.52],[109.12,13.13],[109.05,12.71],[109.13,12.38],
  [109.14,12.22],[108.97,12.22],[108.84,12.16],[108.67,12.09],
  [108.55,12.04],DALAT,
];
const osmQuery = '[out:json][timeout:45];(way[natural=water](11.9,108.39,12.03,108.51);rel(2390139);way[highway](11.927,108.42,11.97,108.48);way[leisure](11.927,108.42,11.97,108.48);way[landuse=forest](11.927,108.42,11.97,108.48);way[building](11.938,108.43,11.953,108.46);way[highway~"^(trunk|primary|secondary)$"](11.6,108,12.3,108.9);node(id:1152317883,4426128791,5661470624););out geom;';
const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`;
const sourceBase = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const sources = {
  countries: `${sourceBase}/ne_10m_admin_0_countries.geojson`,
  vietnam: "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbHumanitarian/VNM/ADM0/geoBoundaries-VNM-ADM0_simplified.geojson",
  rivers: `${sourceBase}/ne_10m_rivers_lake_centerlines.geojson`,
  lakes: `${sourceBase}/ne_10m_lakes.geojson`,
  paper: "https://threeui.com/landing-pages/meng-to-sketchbook/marina-bay-sands.png",
  font: "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf",
  italic: "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader-Italic%5Bopsz,wght%5D.ttf",
  fontLicense: "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/OFL.txt",
};

await mkdir(output, { recursive: true });
await mkdir(fonts, { recursive: true });

async function cachedDownload(url, name) {
  const filename = path.join(tmpdir(), name);
  try {
    await access(filename);
  } catch {
    const response = await fetch(url, { headers: { "User-Agent": "DalatPortfolio/1.0 (local static geographic illustration preparation)" } });
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    await writeFile(filename, Buffer.from(await response.arrayBuffer()));
  }
  return readFile(filename);
}

const countryBytes = await cachedDownload(sources.countries, "portfolio-countries.geojson");
const world = JSON.parse(countryBytes);
const boundaryBytes = await cachedDownload(sources.vietnam, "portfolio-vnm-cod_simplified.geojson");
const vietnam = JSON.parse(boundaryBytes).features[0];
if (vietnam.properties.shapeGroup !== "VNM" || vietnam.geometry.type !== "MultiPolygon") throw new Error("Vietnam COD-AB boundary missing");
// RFC 7946 winding is opposite d3's spherical convention for small polygons.
for (const polygon of vietnam.geometry.coordinates) {
  for (const [index, ring] of polygon.entries()) {
    const area = geoArea({ type: "Polygon", coordinates: [ring] });
    if ((index === 0 && area > 2 * Math.PI) || (index > 0 && area < 2 * Math.PI)) ring.reverse();
  }
}
const mainland = { type: "Polygon", coordinates: vietnam.geometry.coordinates.reduce((largest, polygon) => polygon[0].length > largest[0].length ? polygon : largest) };
if (!geoContains(mainland, DALAT) || geoContains(vietnam, [0, 0])) throw new Error("Vietnam boundary winding validation failed");
const boundaryOutput = { ...vietnam, properties: { name: "Việt Nam", source: "Government of Viet Nam / OCHA COD-AB, geoBoundaries humanitarian mirror", sourceUrl: sources.vietnam } };
await writeFile(path.join(output, "vietnam-boundary.geojson"), JSON.stringify(boundaryOutput) + "\n");
let routeSamples = 0;
for (let index = 1; index < JOURNEY.length; index++) {
  for (let step = 0; step <= 100; step++) {
    const point = JOURNEY[index].map((value, axis) => value * step / 100 + JOURNEY[index - 1][axis] * (1 - step / 100));
    if (!geoContains(mainland, point)) throw new Error(`Journey leaves Vietnam mainland at ${point.join(",")}`);
    routeSamples++;
  }
}
const osmFilename = path.join(output, "dalat-osm.json");
let osmBytes;
try {
  osmBytes = await readFile(osmFilename);
} catch {
  const raw = JSON.parse(await cachedDownload(osmUrl, "portfolio-dalat-osm-20260907.json"));
  if (!raw.elements?.length || raw.remark) throw new Error(`OpenStreetMap extraction failed: ${raw.remark ?? "empty response"}`);
  const dataset = {
    source: "OpenStreetMap contributors", license: "ODbL-1.0", url: osmUrl,
    timestamp: raw.osm3s.timestamp_osm_base,
    elements: raw.elements.map(({ type, id, tags, geometry, members, lon, lat }) => ({
      type, id, tags, geometry, lon, lat,
      ...(members ? { members: members.filter(member => member.geometry).map(({ role, geometry }) => ({ role, geometry })) } : {}),
    })),
  };
  osmBytes = Buffer.from(JSON.stringify(dataset));
  await writeFile(osmFilename, osmBytes);
}
const osm = JSON.parse(osmBytes);
if (!osm.elements.find(feature => feature.type === "relation" && feature.id === 2390139)) throw new Error("Actual Xuan Huong shoreline missing");
const neighbors = world.features.filter((f) => ["CHN", "LAO", "KHM", "THA"].includes(f.properties.ADM0_A3));
const hydrography = {};
for (const kind of ["rivers", "lakes"]) {
  const bytes = await cachedDownload(sources[kind], `portfolio-${kind}.geojson`);
  const features = JSON.parse(bytes).features.filter((feature) => {
    const [[west, south], [east, north]] = geoBounds(feature);
    return east >= 102 && west <= 110 && north >= 8 && south <= 24;
  });
  hydrography[kind] = { features, sha256: createHash("sha256").update(bytes).digest("hex") };
}
const plate = await cachedDownload(sources.paper, "portfolio-reference-book.png");
const paper = await sharp(plate).extract({ left: 160, top: 300, width: 250, height: 175 }).removeAlpha().modulate({ saturation: 0.14, brightness: 1.025 }).webp({ quality: 95 }).toBuffer();
if (!mapsOnly) await writeFile(path.join(output, "paper-texture.webp"), paper);

function assertVietnameseCoverage(font) {
  let cmap;
  for (let index = 0; index < font.readUInt16BE(4); index++) {
    const position = 12 + index * 16;
    if (font.toString("ascii", position, position + 4) === "cmap") cmap = font.readUInt32BE(position + 8);
  }
  if (!cmap) throw new Error("Font character map missing");
  const coverage = new Set();
  for (let index = 0; index < font.readUInt16BE(cmap + 2); index++) {
    const start = cmap + font.readUInt32BE(cmap + 8 + index * 8);
    if (font.readUInt16BE(start) !== 4) continue;
    const count = font.readUInt16BE(start + 6) / 2;
    for (let segment = 0; segment < count; segment++) {
      const end = font.readUInt16BE(start + 14 + segment * 2);
      const begin = font.readUInt16BE(start + 16 + count * 2 + segment * 2);
      for (let code = begin; code <= end; code++) coverage.add(code);
    }
  }
  const needed = [0x102,0x103,0x110,0x111,0x1a0,0x1a1,0x1af,0x1b0,...Array.from({length:90},(_,index)=>0x1ea0+index)];
  if (!needed.every(code=>coverage.has(code))) throw new Error("Font Vietnamese range incomplete");
}

for (const [url, name] of mapsOnly ? [] : [[sources.font, "Newsreader-Regular.ttf"], [sources.italic, "Newsreader-Italic.ttf"], [sources.fontLicense, "Newsreader-OFL.txt"]]) {
  const data = await cachedDownload(url, name);
  if (name.endsWith(".ttf")) assertVietnameseCoverage(data);
  await writeFile(path.join(fonts, name), data);
}

for (const side of mapsOnly ? [] : ["left", "right"]) {
  const url = `https://threeui.com/landing-pages/meng-to-sketchbook/botany-${side}.png`;
  const data = await cachedDownload(url, `portfolio-botany-${side}.png`);
  await sharp(data).webp({ quality: 92 }).toFile(path.join(output, `botany-${side}.webp`));
}

const paperTiles = [];
for (let y = 0; y < H; y += 175) {
  for (let x = 0; x < W; x += 250) {
    const width = Math.min(250, W - x);
    const height = Math.min(175, H - y);
    paperTiles.push({ input: await sharp(paper).extract({ left: 0, top: 0, width, height }).toBuffer(), left: x, top: y });
  }
}
const pagePaper = await sharp({ create: { width: W, height: H, channels: 3, background: "#fafaf6" } }).composite(paperTiles).png().toBuffer();
if (!mapsOnly) await sharp(pagePaper).webp({ quality: 86 }).toFile(path.join(output, "book-paper.webp"));

function mapBackground(color) {
  return `<rect x="${MAP_BOUNDS[0][0]}" y="${MAP_BOUNDS[0][1]}" width="${W * OVERSCAN}" height="${H * OVERSCAN}" fill="${color}"/>`;
}

function geographicBase(projection) {
  const draw = geoPath(projection);
  let artwork = mapBackground("#daeaf0");
  artwork += `<g stroke="#a2a699" stroke-width=".4" stroke-linejoin="round">`;
  for (const feature of neighbors) artwork += `<path d="${draw(feature)}" fill="#ecece1" stroke-opacity=".48"/>`;
  // The interactive canvas redraws the national outline at a fixed screen width.
  artwork += `<path d="${draw(vietnam)}" fill="#cadbb6" stroke="#7e9e8b" stroke-width=".3"/></g>`;
  return artwork;
}

function geographicMap(projection, regional) {
  const draw = geoPath(projection);
  let artwork = '<g fill="none" stroke="#6ca1ad" stroke-linecap="round" stroke-linejoin="round">';
  for (const river of hydrography.rivers.features) {
    if (!regional && Number(river.properties.scalerank) > 6) continue;
    artwork += `<path d="${draw(river) ?? ""}" stroke-width="${regional ? 1.4 : 1}" opacity="${regional ? .72 : .62}"/>`;
  }
  artwork += '</g><g fill="#9dc7ce" stroke="#6f9aa8" stroke-width=".8">';
  for (const lake of hydrography.lakes.features) artwork += `<path d="${draw(lake) ?? ""}"/>`;
  artwork += '</g>';
  return artwork;
}

// OSM nodes and way geometry are projected directly; decorative symbols never relocate landmarks.
function osmPath(element, projection) {
  const parts = element.type === "relation"
    ? element.members.map(member => member.geometry)
    : [element.geometry];
  return parts.filter(Boolean).map(points => points.map((point, index) => {
    const [x, y] = projection([point.lon, point.lat]);
    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join("")).join("");
}

function localMap(projection, detailed, background = true) {
  let art = background ? mapBackground("#dce7cd") : "";
  const features = osm.elements;
  const water = features.filter(feature => feature.tags?.natural === "water");
  const parks = features.filter(feature => feature.tags?.landuse === "forest" || ["park", "garden", "golf_course"].includes(feature.tags?.leisure));
  art += '<g fill="#a5c6a2" fill-opacity=".68" stroke="#80a582" stroke-width="1.2" fill-rule="evenodd">';
  for (const park of parks) art += `<path d="${osmPath(park, projection)}Z"/>`;
  art += "</g>";
  if (detailed) {
    art += '<g fill="#ddc3a5" stroke="#ad9880" stroke-width=".7" fill-rule="evenodd">';
    for (const feature of features.filter(feature => feature.tags?.building)) {
      art += `<path d="${osmPath(feature, projection)}Z"/>`;
    }
    art += "</g>";
  }
  const priorities = { motorway: 8, trunk: 7, primary: 6, secondary: 5, tertiary: 4, residential: 3, unclassified: 3, living_street: 2, service: 2, pedestrian: 1, footway: 1, path: 1, steps: 1 };
  const roads = features.filter(feature => feature.geometry && feature.tags?.highway in priorities)
    .sort((a, b) => priorities[a.tags.highway] - priorities[b.tags.highway]);
  for (const road of roads) {
    const importance = priorities[road.tags.highway];
    if (!detailed && importance < 5) continue;
    const d = osmPath(road, projection);
    const width = detailed ? Math.min(5.8, .7 + importance * .7) : 1.2 + importance * .17;
    art += `<path d="${d}" fill="none" stroke="#a5b59c" stroke-width="${width + 1.4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fffaf0" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  art += '<g fill="#91c2ce" stroke="#598c9a" stroke-width="1.5" fill-rule="evenodd">';
  for (const lake of water) art += `<path d="${osmPath(lake, projection)}Z"/>`;
  art += "</g>";
  return art;
}

const maps = [
  {name:"vietnam",center:[108,16.3],scale:3850,translate:[1300,550],kind:"national"},
  {name:"region",center:[108,12.6],scale:13500,translate:[1310,500],kind:"regional"},
  {name:"highlands",center:DALAT,scale:120000,translate:[1310,673],kind:"highlands"},
  {name:"dalat",center:DALAT,scale:1200000,translate:[1310,740],kind:"city"},
];
const detailMaps = [
  {name:"region-detail",center:DALAT,scale:40000,translate:[1310,620],kind:"regional",detail:true},
  {name:"city-detail",center:DALAT,scale:380000,translate:[1310,710],kind:"city",detail:true},
];
const labels = [
  ["Hà Nội",105.854,21.029,"national"],
  ["Đà Nẵng",108.203,16.052,"national"],
  ["TP. Hồ Chí Minh",106.7,10.776,"national"],
  ["Lào",104.75,16.9,"national"],
  ["Campuchia",104.8,12.1,"national"],
  ["Biển Đông",113,14.4,"national"],
  ["QĐ. Hoàng Sa",112.2,16.5,"national"],
  ["QĐ. Trường Sa",113.4,10.6,"national"],
  ["Phú Quốc",103.990825,10.27502,"national"],
  ["Pleiku",108.22,13.98,"regional"],
  ["Buôn Ma Thuột",108.05,12.67,"regional"],
  ["Nha Trang",109.195,12.24,"regional"],
  ["Phan Thiết",108.1,10.93,"regional"],
  ["Bảo Lộc",107.8,11.55,"regional"],
  ["Phan Rang",108.99,11.58,"regional"],
  ["Lâm Đồng",107.75,11.8,"regional"],
  ["Lạc Dương",108.4190669,12.0086648,"highlands"],
  ["Hồ Tuyền Lâm",108.4197,11.8905,"highlands"],
  ["Hồ Đan Kia",108.386,12.017,"highlands"],
  ["Langbiang",108.4405826,12.0472573,"highlands"],
  ["Hồ Xuân Hương",108.4443,11.9456,"city"],
  ["Vườn hoa Đà Lạt",108.449438,11.9518581,"city"],
].map(([name,longitude,latitude,kind]) => ({name,longitude,latitude,kind}));
for (const [id,name] of [[1152317883,"Chợ Đà Lạt"],[5661470624,"Ga Đà Lạt"],[4426128791,"Quảng trường Lâm Viên"]]) {
  const node = osm.elements.find(feature => feature.type === "node" && feature.id === id);
  if (!node) throw new Error(`OSM landmark missing: ${id}`);
  labels.push({name,longitude:node.lon,latitude:node.lat,kind:"city"});
}
const metadata=[];
const detailMetadata=[];
const terrainMetadata=[];
const terrainCacheDirectory=path.join(tmpdir(),"myblog-terrain-tiles-20260907");
for(const map of [...maps, ...detailMaps]) {
  const projection=geoMercator().center(map.center).scale(map.scale).translate(map.translate).clipExtent(MAP_BOUNDS);
  const maskSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W * OVERSCAN}" height="${H * OVERSCAN}" viewBox="${MAP_BOUNDS[0][0]} ${MAP_BOUNDS[0][1]} ${W * OVERSCAN} ${H * OVERSCAN}">${mapBackground("#000")}<path d="${geoPath(projection)(vietnam)}" fill="#fff"/></svg>`;
  const landMask=await sharp(Buffer.from(maskSvg)).removeAlpha().greyscale().raw().toBuffer();
  const terrain=await renderTerrain({map,projection,width:W * OVERSCAN,height:H * OVERSCAN,bounds:MAP_BOUNDS,cacheDirectory:terrainCacheDirectory,landMask});
  terrainMetadata.push(terrain.metadata);
  const isLocal = ["city","highlands"].includes(map.kind);
  const base = isLocal ? mapBackground("#dce7cd") : geographicBase(projection);
  let art=isLocal?localMap(projection,map.kind==="city",false):geographicMap(projection,map.kind==="regional");
  if (map.kind === "regional") art += localMap(projection,false,false);
  // Overscan keeps each incoming detail plate beyond the visible page during its crossfade.
  const svg=(content)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * OVERSCAN}" height="${H * OVERSCAN}" viewBox="${MAP_BOUNDS[0][0]} ${MAP_BOUNDS[0][1]} ${W * OVERSCAN} ${H * OVERSCAN}">${content}</svg>`);
  const rendered=await sharp(svg(base)).composite([{input:terrain.buffer},{input:svg(art)}]).flatten({background:"#daeaf0"}).png().toBuffer();
  await writeFile(path.join(output,`map-${map.name}.webp`),await sharp(rendered).webp({quality:88,effort:6}).toBuffer());
  await writeFile(path.join(output,`map-${map.name}-mobile.webp`),await sharp(rendered).resize(W,H).webp({quality:86,effort:6}).toBuffer());
  const anchor=projection(DALAT).map((n,i)=>Number((n/(i?H:W)).toFixed(6)));
  (map.detail ? detailMetadata : metadata).push({id:map.name,src:`/portfolio/map-${map.name}.webp?v=atlas-20260907`,mobileSrc:`/portfolio/map-${map.name}-mobile.webp?v=atlas-20260907`,width:W,height:H,overscan:OVERSCAN,anchor:{x:anchor[0],y:anchor[1]},projection:{type:"geoMercator",center:map.center,scale:map.scale,translate:map.translate},kind:map.kind});
  console.log(`ASSET map-${map.name}.webp ${W * OVERSCAN}x${H * OVERSCAN} logical=${W}x${H} anchor=${JSON.stringify(anchor)}`);
}

const terrainTiles=[...new Map(terrainMetadata.flatMap(plate=>plate.tiles).map(tile=>[tile.url,tile])).values()];
await writeFile(path.join(output,"terrain-sources.json"),JSON.stringify({
  ...terrainSource,accessedAt:new Date().toISOString(),cacheDirectory:terrainCacheDirectory,
  tiles:terrainTiles,plates:terrainMetadata,
},null,2)+"\n");
await writeFile(path.join(output,"assets.json"),JSON.stringify({
  generatedBy:"apps/web/scripts/prepare-portfolio-assets.mjs",
  geographicAnchor:{name:"Da Lat",longitude:DALAT[0],latitude:DALAT[1]},
  orientation:"North-up Mercator in every level; all anchor pixels and camera transforms derive from the same longitude/latitude.",
  maps:metadata,
  detailMaps:detailMetadata,
  labels,
  terrain:{revision:1,source:terrainSource.name,url:terrainSource.url,encoding:terrainSource.format,tiles:terrainTiles.length,manifest:"/portfolio/terrain-sources.json",style:"Actual elevation hypsometric tint and northwest hillshade, clipped to the existing Vietnam land geometry.",light:{azimuth:315,altitude:45},plates:terrainMetadata.map(({id,zoom,elevationRangeMeters,landPixels,tiles})=>({id,zoom,elevationRangeMeters,landPixels,tileCount:tiles.length}))},
  boundarySource:{src:"/portfolio/vietnam-boundary.geojson",url:sources.vietnam,dataset:"Government of Viet Nam / OCHA COD-AB 2020; geoBoundaries humanitarian mirror",license:"CC BY 3.0 IGO",sourceVertices:19959,polygons:vietnam.geometry.coordinates.length,bounds:geoBounds(vietnam),strokeWidth:1,color:"#7d8e78",winding:"d3-geo spherical polygon convention",validation:{dalatInside:geoContains(mainland,DALAT),originOutside:!geoContains(vietnam,[0,0])}},
  journeyRoute:{color:"#b65049",style:"red dashed",strokeWidth:1.3,dashArray:[4,4],rasterized:false,coordinates:JOURNEY,geometry:"Illustrated mainland itinerary; not a turn-by-turn road route. Rendered at constant screen-pixel thickness; fades before street-level detail.",validation:{dataset:"Government of Viet Nam / OCHA COD-AB 2020 mainland polygon",samples:routeSamples,insideVietnam:true}},
  sources:[
    {...terrainSource,localSource:"/portfolio/terrain-sources.json"},
    {name:"Government of Viet Nam / OCHA COD-AB",url:sources.vietnam,catalogUrl:"https://data.humdata.org/dataset/cod-ab-vnm",mirrorMetadata:"https://www.geoboundaries.org/api/current/gbHumanitarian/VNM/ADM0/",license:"Creative Commons Attribution 3.0 IGO",licenseUrl:"https://creativecommons.org/licenses/by/3.0/igo/",year:2020,sha256:createHash("sha256").update(boundaryBytes).digest("hex"),localSource:"/portfolio/vietnam-boundary.geojson",usage:"Published simplified land polygons, coastlines and actual island shapes; only ring winding changed for d3. No fabricated islands or maritime boundary lines."},
    {name:"Natural Earth 1:10m countries",url:sources.countries,license:"Public domain",sha256:createHash("sha256").update(countryBytes).digest("hex"),usage:"Muted surrounding land context, separate from the more detailed Vietnam COD-AB geometry."},
    {name:"Natural Earth 1:10m rivers",url:sources.rivers,license:"Public domain",sha256:hydrography.rivers.sha256,usage:"Country and regional river geometry."},
    {name:"Natural Earth 1:10m lakes",url:sources.lakes,license:"Public domain",sha256:hydrography.lakes.sha256,usage:"Country and regional lake geometry."},
    {name:"OpenStreetMap contributors",url:osmUrl,license:"Open Database License 1.0",licenseUrl:"https://www.openstreetmap.org/copyright",localSource:"/portfolio/dalat-osm.json",sha256:createHash("sha256").update(osmBytes).digest("hex"),timestamp:osm.timestamp,features:osm.elements.length,usage:"Directly projected Da Lat and nearby road, water, park and building geometry. Xuan Huong shoreline uses relation/2390139. Landmark label coordinates come from OSM nodes. No runtime tile or geocoding requests."},
    {name:"Verified OSM landmark anchors",usage:"Market node/1152317883; station node/5661470624; Lam Vien Square node/4426128791; flower garden way/473547263; Lac Duong node/12925900845; Lang Biang node/2688028631.",url:"https://www.openstreetmap.org/relation/2390139"},
    {name:"ThreeUI Sketchbook",url:sources.paper,usage:"Small blank-paper crop only. Original illustration is not included.",sha256:createHash("sha256").update(plate).digest("hex")},
    {name:"ThreeUI botanical accents",url:"https://threeui.com/landing-pages/meng-to-sketchbook.html",usage:"Botany-left and botany-right raster accents copied and converted to WebP from provided ThreeUI reference assets."},
    {name:"Newsreader",url:"https://github.com/google/fonts/tree/main/ofl/newsreader",license:"SIL Open Font License 1.1",usage:"Self-hosted variable font for portfolio sections below the book."},
    {name:"Source Serif 4",url:"https://github.com/google/fonts/tree/main/ofl/sourceserif4",license:"SIL Open Font License 1.1",usage:"Self-hosted variable normal and italic font for the book and identity; Vietnamese character coverage verified. License beside fonts."},
  ],
  treatment:"Locally rasterized north-up shaded-relief atlas with two-times overscan and intermediate detail rasters. Real Mapzen Terrarium elevation drives height-band color and hillshade in the same Mercator projection. Vietnam coastlines and islands use published COD-AB land polygons; neighboring geography is muted. No procedural island marks or invented terrain. National outline, red dashed itinerary and geographic labels are separate constant-size overlays, never magnified bitmap strokes or text. Paper texture and page fade remain fixed outside the raster artwork. Regional and city shoreline, roads, parks and building footprints derive from OpenStreetMap. The itinerary is illustrative; geographic labels are not maritime boundaries.",
  runtime:"All media is local; no map service, tile API or external font request.",
},null,2)+"\n");
console.log(`PASS: ${routeSamples} mainland route samples; ${osm.elements.length} sourced OSM features; ${(maps.length + detailMaps.length) * 2} north-up map assets generated; ${vietnam.geometry.coordinates.length} sourced land polygons; no raster route.`);
