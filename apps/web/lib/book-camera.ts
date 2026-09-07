export interface MapPlate {
  id: string;
  src: string;
  mobileSrc: string;
  width: number;
  height: number;
  anchor: { x: number; y: number };
  projection: { scale: number };
  overscan?: number;
}

export const DETAIL_TRANSITIONS = [
  [0.27, 0.32],
  [0.6, 0.65],
  [0.9, 0.95],
] as const;
export const CHAPTER_STOPS = [0, 0.34, 0.67, 0.97] as const;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function getCameraPose(progress: number, maps: readonly MapPlate[]) {
  const p = clamp(progress);
  const times = [...CHAPTER_STOPS, 1];
  const values = [
    ...maps.map((map) => Math.log(map.projection.scale)),
    Math.log(maps[3]!.projection.scale * 1.06),
  ];
  const segment = Math.min(
    3,
    times.findIndex((time, index) => index > 0 && p <= time) - 1,
  );
  const i = Math.max(0, segment);
  const duration = times[i + 1]! - times[i]!;
  const t = clamp((p - times[i]!) / duration);
  const slope = (index: number) => {
    const secant = (i: number) =>
      (values[i + 1]! - values[i]!) / (times[i + 1]! - times[i]!);
    if (index === 0) return secant(0);
    if (index === values.length - 1) return secant(index - 1);
    const before = secant(index - 1),
      after = secant(index);
    return (2 * before * after) / (before + after);
  };
  // Interpolate in logarithmic scale with matching velocities at each detail level.
  const logScale =
    (2 * t ** 3 - 3 * t * t + 1) * values[i]! +
    (t ** 3 - 2 * t * t + t) * duration * slope(i) +
    (-2 * t ** 3 + 3 * t * t) * values[i + 1]! +
    (t ** 3 - t * t) * duration * slope(i + 1);
  const scale = Math.exp(logScale);
  const amount = clamp(p / 0.34);
  const settle = amount * amount * (3 - 2 * amount);
  const first = maps[0]!.anchor;
  return {
    scale,
    anchor: {
      x: first.x + (0.64 - first.x) * settle,
      y: first.y + (0.58 - first.y) * settle,
    },
  };
}

export function getPlateTransform(
  progress: number,
  map: MapPlate,
  maps: readonly MapPlate[],
) {
  const camera = getCameraPose(progress, maps);
  const scale = camera.scale / map.projection.scale;
  return {
    scale,
    x: (camera.anchor.x - map.anchor.x * scale) * 100,
    y: (camera.anchor.y - map.anchor.y * scale) * 100,
  };
}

export function getChapter(progress: number) {
  return DETAIL_TRANSITIONS.reduce(
    (chapter, [start, end], index) =>
      progress >= (start + end) / 2 ? index + 1 : chapter,
    0,
  );
}
