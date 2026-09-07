"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
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
}: {
  map: MapPlate;
  maps: readonly MapPlate[];
  layers: readonly MapPlate[];
  index: number;
  progress: MotionValue<number>;
}) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
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
  const opacity = useTransform(progress, (p) => {
    const cameraScale = getCameraPose(p, maps).scale;
    if (layers[index + 1] && cameraScale >= layers[index + 1]!.projection.scale)
      return 0;
    if (index === 0) return 1;
    const ratio = cameraScale / map.projection.scale;
    return Math.min(1, Math.max(0, (ratio - 0.65) / 0.35));
  });
  return (
    <motion.div
      className={styles.artLayer}
      data-layer={map.id}
      style={{ scale, x, y, opacity, transformOrigin: "0 0" }}
    >
      {failed ? (
        <div className={styles.mapFallback}>
          {t("Việt Nam · Đà Lạt", "Vietnam · Da Lat")}
        </div>
      ) : (
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
            src={map.src}
            alt=""
            fill
            unoptimized
            priority={index === 0}
            loading={index === 0 ? undefined : "eager"}
            sizes="(max-width: 640px) 95vw, 1100px"
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </motion.div>
  );
}
