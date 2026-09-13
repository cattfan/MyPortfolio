"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  getPlateTransform,
  getCameraPose,
  type MapPlate,
} from "../lib/book-camera";
import styles from "./book-journey.module.css";
import { useLanguage } from "./language-provider";

export function GeographicPlate({
  map,
  maps,
  layers,
  index,
  progress,
  requested,
  readyLayers,
  onReady,
}: {
  map: MapPlate;
  maps: readonly MapPlate[];
  layers: readonly MapPlate[];
  index: number;
  progress: MotionValue<number>;
  requested: boolean;
  readyLayers: readonly string[];
  onReady: (id: string, ready: boolean) => void;
}) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const readiness = useMotionValue(index === 0 ? 1 : 0);
  const fade = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => () => fade.current?.stop(), []);
  const scale = useTransform(
    progress,
    (p) => getPlateTransform(p, map, maps).scale,
  );
  const x = useTransform(
    progress,
    (p) => `${getPlateTransform(p, map, maps).x}%`,
  );
  const y = useTransform(
    progress,
    (p) => `${getPlateTransform(p, map, maps).y}%`,
  );
  const opacity = useTransform(() => {
    const p = progress.get();
    const loaded = readiness.get();
    const cameraScale = getCameraPose(p, maps).scale;
    const top = layers.reduce(
      (highest, layer, i) =>
        readyLayers.includes(layer.id) &&
        cameraScale / layer.projection.scale >= 0.65
          ? i
          : highest,
      0,
    );
    const lower = layers.reduce(
      (highest, layer, i) =>
        i < top && (i === 0 || readyLayers.includes(layer.id)) ? i : highest,
      0,
    );
    if (index === lower) return 1;
    if (index !== top || !readyLayers.includes(map.id)) return 0;
    if (index === 0) return 1;
    const ratio = cameraScale / map.projection.scale;
    return Math.min(1, Math.max(0, (ratio - 0.65) / 0.35)) * loaded;
  });
  async function loaded(element: HTMLImageElement) {
    const source = element.currentSrc;
    try {
      await element.decode();
      if (image.current !== element || element.currentSrc !== source) return;
      setFailed(false);
      onReady(map.id, true);
      fade.current?.stop();
      fade.current = animate(readiness, 1, {
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 0.18,
      });
    } catch {
      if (image.current === element && element.currentSrc === source) {
        onReady(map.id, false);
        setFailed(true);
      }
    }
  }
  return (
    <motion.div
      className={styles.artLayer}
      data-layer={map.id}
      data-ready={readyLayers.includes(map.id)}
      style={{ scale, x, y, opacity, transformOrigin: "0 0" }}
    >
      {failed && index === 0 ? (
        <div className={styles.mapFallback}>
          {t("Việt Nam · Đà Lạt", "Vietnam · Da Lat")}
        </div>
      ) : requested ? (
        <picture
          style={
            map.overscan
              ? {
                  inset: "auto",
                  left: `${(1 - map.overscan) * 50}%`,
                  top: `${(1 - map.overscan) * 50}%`,
                  width: `${map.overscan * 100}%`,
                  height: `${map.overscan * 100}%`,
                }
              : undefined
          }
        >
          <source media="(max-width: 640px)" srcSet={map.mobileSrc} />
          <Image
            ref={image}
            src={map.src}
            alt=""
            fill
            unoptimized
            priority={index === 0}
            loading={index === 0 ? undefined : "eager"}
            sizes="(max-width: 640px) 95vw, 1100px"
            onLoad={(event) => void loaded(event.currentTarget)}
            onError={() => {
              onReady(map.id, false);
              setFailed(true);
            }}
          />
        </picture>
      ) : null}
    </motion.div>
  );
}
