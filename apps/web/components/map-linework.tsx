"use client";

import {
  geoArea,
  geoMercator,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import mapAssets from "../public/portfolio/assets.json";
import { getCameraPose, getChapter } from "../lib/book-camera";
import styles from "./book-journey.module.css";
import { useLanguage } from "./language-provider";
import { mapNames } from "../content/translations";

export function MapLinework({
  progress,
  staticMode,
}: {
  progress: MotionValue<number>;
  staticMode: boolean;
}) {
  const { language } = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext("2d");
    if (!context) return;
    let frame = 0;
    let disposed = false;
    let boundary: GeoPermissibleObjects | undefined;
    let mainland: GeoPermissibleObjects | undefined;
    const controller = new AbortController();
    const draw = () => {
      frame = 0;
      const width = element.clientWidth,
        height = element.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        element.width !== Math.round(width * dpr) ||
        element.height !== Math.round(height * dpr)
      ) {
        element.width = Math.round(width * dpr);
        element.height = Math.round(height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const p = staticMode ? 0 : progress.get();
      const camera = getCameraPose(p, mapAssets.maps);
      const projection = geoMercator()
        .center([
          mapAssets.geographicAnchor.longitude,
          mapAssets.geographicAnchor.latitude,
        ])
        .scale((camera.scale * width) / 2048)
        .translate([camera.anchor.x * width, camera.anchor.y * height]);
      const path = geoPath(projection, context);
      const fade = Math.max(0, Math.min(1, (0.58 - p) / 0.15));
      context.save();
      context.beginPath();
      context.rect(0, 0, width, height);
      context.clip();
      if (boundary && fade > 0) {
        context.beginPath();
        path(mainland ?? boundary);
        context.lineWidth = 2.6;
        context.strokeStyle = `rgba(250, 249, 234, ${0.7 * fade})`;
        context.stroke();
        context.lineWidth = 0.85;
        context.strokeStyle = `rgba(58, 91, 77, ${0.75 * fade})`;
        context.stroke();
        context.beginPath();
        path(boundary);
        context.clip();
      }
      context.beginPath();
      mapAssets.journeyRoute.coordinates.forEach((point, index) => {
        const projected = projection(point as [number, number]);
        if (!projected) return;
        if (index === 0) context.moveTo(projected[0], projected[1]);
        else context.lineTo(projected[0], projected[1]);
      });
      const lineWidth = width < 500 ? 1 : 1.25;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = lineWidth + 2;
      context.strokeStyle = `rgba(255, 250, 234, ${fade * 0.8})`;
      context.stroke();
      context.lineWidth = lineWidth;
      context.setLineDash([4, 4]);
      context.strokeStyle = `rgba(170, 62, 52, ${fade * 0.95})`;
      context.stroke();
      context.restore();
      const fontSize = width < 500 ? 8 : 11;
      context.font = `${fontSize}px Arial, sans-serif`;
      context.lineJoin = "round";
      context.setLineDash([]);
      const bounds: { x: number; y: number; width: number; height: number }[] =
        [];
      const pinX = camera.anchor.x * width,
        pinY = camera.anchor.y * height;
      bounds.push({
        x: pinX + (getChapter(p) < 2 ? (width < 500 ? 12 : 28) : -95),
        y: pinY + (getChapter(p) < 2 ? -37 : 6),
        width: width < 500 ? 55 : 80,
        height: 29,
      });
      bounds.push({
        x: width * 0.75,
        y: height * 0.925 - (width < 500 ? 13 : 19),
        width: width * 0.19,
        height: width < 500 ? 18 : 24,
      });
      const labels =
        (
          mapAssets as typeof mapAssets & {
            labels?: {
              name: string;
              longitude: number;
              latitude: number;
              kind: string;
            }[];
          }
        ).labels ?? [];
      const drawnLabels: string[] = [];
      for (const label of labels) {
        const labelText =
          language === "en" ? (mapNames[label.name] ?? label.name) : label.name;
        const alpha =
          label.kind === "national"
            ? Math.max(0, Math.min(1, (0.34 - p) / 0.12))
            : label.kind === "regional"
              ? Math.max(0, Math.min(1, (p - 0.18) / 0.1, (0.64 - p) / 0.1))
              : label.kind === "highlands"
                ? Math.max(0, Math.min(1, (p - 0.48) / 0.12, (0.86 - p) / 0.12))
                : Math.max(0, Math.min(1, (p - 0.78) / 0.14));
        if (alpha <= 0) continue;
        const point = projection([label.longitude, label.latitude]);
        if (!point) continue;
        const isWater =
          label.name === "Biển Đông" || label.name.startsWith("Hồ ");
        const isCountry = ["Lào", "Campuchia", "Lâm Đồng"].includes(label.name);
        const isIsland = label.name === "Phú Quốc";
        const isCity =
          !isCountry && !isWater && !isIsland && !label.name.startsWith("QĐ.");
        context.font = isWater
          ? `italic ${fontSize + 1}px Georgia, serif`
          : `${fontSize}px Arial, sans-serif`;
        const belowAnchor = width < 500 && label.name === "TP. Hồ Chí Minh";
        const x =
            isIsland && width < 500
              ? Math.max(point[0] - 27, width * 0.4 + 3)
              : point[0] + 7,
          y = point[1] + (isIsland ? 5 : belowAnchor ? 4 : -7);
        const box = {
          x: x - 2,
          y: y - fontSize - 2,
          width: context.measureText(labelText).width + 4,
          height: fontSize + 6,
        };
        if (
          box.x < width * (isIsland ? 0.4 : 0.43) ||
          box.x + box.width > width - 15 ||
          box.y < (width < 500 ? 12 : 30) ||
          box.y + box.height > height - (width < 500 || isIsland ? 12 : 28)
        )
          continue;
        if (
          bounds.some(
            (b) =>
              box.x < b.x + b.width &&
              box.x + box.width > b.x &&
              box.y < b.y + b.height &&
              box.y + box.height > b.y,
          )
        )
          continue;
        bounds.push(box);
        context.globalAlpha = alpha;
        context.fillStyle = isWater
          ? "#416f78"
          : isCountry
            ? "#727a66"
            : "#354e42";
        if (isCity) {
          context.beginPath();
          context.arc(
            point[0],
            point[1],
            label.name === "Hà Nội" ? 2.4 : 1.8,
            0,
            Math.PI * 2,
          );
          context.fillStyle = label.name === "Hà Nội" ? "#aa3e34" : "#354e42";
          context.fill();
          context.lineWidth = 1.3;
          context.strokeStyle = "#fffbed";
          context.stroke();
        }
        context.lineWidth = 3;
        context.strokeStyle = "rgba(250, 248, 231, 0.9)";
        context.strokeText(labelText, x, y);
        context.fillText(labelText, x, y);
        drawnLabels.push(labelText);
      }
      context.globalAlpha = 1;
      // Mercator scale varies with latitude; keep the ruler physically meaningful while zooming.
      const rulerY = height * 0.925;
      const rulerLatitude =
        projection.invert?.([width * 0.88, rulerY])?.[1] ??
        mapAssets.geographicAnchor.latitude;
      const metersPerPixel =
        (6371008.8 * Math.cos((rulerLatitude * Math.PI) / 180)) /
        projection.scale();
      const targetDistance = metersPerPixel * (width < 500 ? 38 : 66);
      const magnitude = 10 ** Math.floor(Math.log10(targetDistance));
      const distance =
        [1, 2, 5, 10]
          .map((step) => step * magnitude)
          .find((step) => step >= targetDistance) ?? magnitude * 10;
      const rulerWidth = distance / metersPerPixel;
      const rulerX = width * 0.92 - rulerWidth;
      const rulerText =
        distance >= 1000 ? `${distance / 1000} km` : `${distance} m`;
      context.font = `${width < 500 ? 7 : 9}px Arial, sans-serif`;
      context.textAlign = "center";
      context.lineWidth = 3;
      context.strokeStyle = "#f8f5e9";
      context.strokeText(rulerText, rulerX + rulerWidth / 2, rulerY - 7);
      context.fillStyle = "#496154";
      context.fillText(rulerText, rulerX + rulerWidth / 2, rulerY - 7);
      context.beginPath();
      context.moveTo(rulerX, rulerY - 3);
      context.lineTo(rulerX, rulerY);
      context.lineTo(rulerX + rulerWidth, rulerY);
      context.lineTo(rulerX + rulerWidth, rulerY - 3);
      context.lineWidth = 2.6;
      context.strokeStyle = "#f8f5e9";
      context.stroke();
      context.lineWidth = 0.8;
      context.strokeStyle = "#496154";
      context.stroke();
      context.textAlign = "start";
      element.dataset.scaleMeters = String(distance);
      element.dataset.scalePixels = String(rulerWidth);
      element.dataset.metersPerPixel = String(metersPerPixel);
      element.dataset.atlas = "true";
      element.dataset.labelSize = String(fontSize);
      element.dataset.labels = JSON.stringify(drawnLabels);
      element.dataset.routeWidth = String(lineWidth);
      element.dataset.rendered = "true";
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(draw);
    };
    const unsubscribe = progress.on("change", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    fetch("/portfolio/vietnam-boundary.geojson", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data) => {
        if (!disposed) {
          boundary = data;
          const geometry = data?.geometry as
            | Extract<
                GeoPermissibleObjects,
                { type: "MultiPolygon" | "Polygon" }
              >
            | undefined;
          if (geometry?.type === "MultiPolygon") {
            mainland = geometry.coordinates
              .map((coordinates) => ({ type: "Polygon" as const, coordinates }))
              .sort((a, b) => geoArea(b) - geoArea(a))[0];
          }
          schedule();
        }
      })
      .catch(() => {});
    schedule();
    return () => {
      disposed = true;
      unsubscribe();
      observer.disconnect();
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, [progress, staticMode, language]);
  return (
    <canvas
      ref={canvas}
      className={styles.mapLinework}
      aria-hidden="true"
      data-map-linework
    />
  );
}
