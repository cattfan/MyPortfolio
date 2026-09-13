"use client";

import {
  geoArea,
  geoMercator,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { useEffect, useRef } from "react";
import { cancelFrame, frame, type MotionValue } from "motion/react";
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
    let scheduled = false;
    let disposed = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let mobile = false;
    let compassBox = { x: 0, y: 0, width: 0, height: 0 };
    let destinationSize = { width: 80, height: 29 };
    let mainlandPath: Path2D | undefined;
    const baseScale = mapAssets.maps[0]!.projection.scale;
    const origin: [number, number] = [
      mapAssets.geographicAnchor.longitude,
      mapAssets.geographicAnchor.latitude,
    ];
    // Retain geographic paths in one Mercator coordinate space. Only the camera
    // matrix changes during a zoom; never stream thousands of rings per frame.
    const baseProjection = geoMercator()
      .center(origin)
      .scale(baseScale)
      .translate([0, 0]);
    const projection = geoMercator().center(origin);
    const routePath = new Path2D();
    mapAssets.journeyRoute.coordinates.forEach((point, index) => {
      const [x, y] = baseProjection(point as [number, number])!;
      if (index === 0) routePath.moveTo(x, y);
      else routePath.lineTo(x, y);
    });
    const controller = new AbortController();
    const draw = () => {
      scheduled = false;
      if (disposed || !width || !height) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const p = staticMode ? 0 : progress.get();
      const camera = getCameraPose(p, mapAssets.maps);
      projection
        .scale((camera.scale * width) / 2048)
        .translate([camera.anchor.x * width, camera.anchor.y * height]);
      const fadeAmount = Math.max(0, Math.min(1, (0.58 - p) / 0.15));
      const fade = fadeAmount * fadeAmount * (3 - 2 * fadeAmount);
      const lineWidth = width < 500 ? 1 : 1.25;
      if (fade > 0) {
        const zoom = projection.scale() / baseScale;
        context.save();
        context.translate(camera.anchor.x * width, camera.anchor.y * height);
        context.scale(zoom, zoom);
        context.lineCap = "round";
        context.lineJoin = "round";
        if (mainlandPath) {
          context.lineWidth = 2.6 / zoom;
          context.strokeStyle = `rgba(250, 249, 234, ${0.7 * fade})`;
          context.stroke(mainlandPath);
          context.lineWidth = 0.85 / zoom;
          context.strokeStyle = `rgba(58, 91, 77, ${0.75 * fade})`;
          context.stroke(mainlandPath);
          // The itinerary is validated against mainland land geometry at build
          // time. Islands remain in the atlas; they are not needed for this clip.
          context.clip(mainlandPath);
        }
        context.lineWidth = (lineWidth + 2) / zoom;
        context.strokeStyle = `rgba(255, 250, 234, ${fade * 0.8})`;
        context.stroke(routePath);
        context.lineWidth = lineWidth / zoom;
        context.setLineDash([4 / zoom, 4 / zoom]);
        context.strokeStyle = `rgba(170, 62, 52, ${fade * 0.95})`;
        context.stroke(routePath);
        context.restore();
      }
      const fontSize = width < 500 ? 8 : 11;
      context.font = `${fontSize}px Arial, sans-serif`;
      context.lineJoin = "round";
      context.setLineDash([]);
      const bounds: { x: number; y: number; width: number; height: number }[] =
        [];
      const pinX = camera.anchor.x * width,
        pinY = camera.anchor.y * height;
      const earlyChapter = getChapter(p) < 2;
      bounds.push({
        x:
          pinX +
          (earlyChapter
            ? mobile
              ? 15
              : 30
            : -(mobile ? 10 : 14) - destinationSize.width) -
          5,
        y: pinY + (earlyChapter ? (mobile ? -25 : -34) : mobile ? 8 : 9) - 5,
        width: destinationSize.width + 10,
        height: destinationSize.height + 10,
      });
      const pinRadius = mobile ? 11 : 15;
      bounds.push({
        x: pinX - pinRadius,
        y: pinY - pinRadius,
        width: pinRadius * 2,
        height: pinRadius * 2,
      });
      bounds.push(compassBox);
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
      const labelBoxes: {
        name: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];
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
        const defaultX =
            isIsland && width < 500
              ? Math.max(point[0] - 27, width * 0.4 + 3)
              : point[0] + 7,
          defaultY = point[1] + (isIsland ? 5 : belowAnchor ? 4 : -7);
        const textWidth = context.measureText(labelText).width;
        const candidates = [
          [defaultX, defaultY],
          [point[0] - textWidth - 7, defaultY],
          [defaultX, point[1] + fontSize + 10],
          [point[0] - textWidth - 7, point[1] + fontSize + 10],
          [point[0] - textWidth / 2, point[1] - 18],
          [point[0] - textWidth / 2, point[1] + fontSize + 10],
          [point[0] - textWidth / 2, point[1] + fontSize + 18],
        ];
        const placement = candidates
          .map(([x, y]) => ({
            x: x!,
            y: y!,
            box: {
              x: x! - 3,
              y: y! - fontSize - 3,
              width: textWidth + 6,
              height: fontSize + 7,
            },
          }))
          .find(
            ({ box }) =>
              box.x >= width * (isIsland ? 0.4 : 0.43) &&
              box.x + box.width <= width - 15 &&
              box.y >= (width < 500 ? 12 : 30) &&
              box.y + box.height <=
                height - (width < 500 || isIsland ? 12 : 28) &&
              !bounds.some(
                (b) =>
                  box.x < b.x + b.width &&
                  box.x + box.width > b.x &&
                  box.y < b.y + b.height &&
                  box.y + box.height > b.y,
              ),
          );
        if (!placement) continue;
        const { x, y, box } = placement;
        bounds.push(box);
        labelBoxes.push({ name: labelText, ...box });
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
      element.dataset.labelBoxes = JSON.stringify(labelBoxes);
      element.dataset.routeWidth = String(lineWidth);
      element.dataset.cameraScale = String(camera.scale);
      element.dataset.rendered = "true";
    };
    const schedule = () => {
      if (disposed || scheduled) return;
      scheduled = true;
      // Share Motion's render phase with GeographicPlate transforms. A separate
      // requestAnimationFrame would leave linework one frame behind the artwork.
      frame.render(draw, false, true);
    };
    const measure = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      mobile = window.matchMedia("(max-width: 640px)").matches;
      const paper = element.closest("[data-book-paper]");
      const compass = paper?.querySelector<HTMLElement>("[data-compass]");
      const destination = paper?.querySelector<HTMLElement>("[data-map-label]");
      if (compass)
        compassBox = {
          x: compass.offsetLeft - 6,
          y: compass.offsetTop - 6,
          width: compass.offsetWidth + 12,
          height: compass.offsetHeight + 12,
        };
      if (destination)
        destinationSize = {
          width: destination.offsetWidth,
          height: destination.offsetHeight,
        };
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (element.width !== pixelWidth || element.height !== pixelHeight) {
        element.width = pixelWidth;
        element.height = pixelHeight;
      }
      schedule();
    };
    const unsubscribe = progress.on("change", schedule);
    const observer = new ResizeObserver(() => frame.read(measure));
    observer.observe(element);
    const paper = element.closest("[data-book-paper]");
    paper
      ?.querySelectorAll("[data-map-label], [data-compass]")
      .forEach((node) => observer.observe(node));
    fetch("/portfolio/vietnam-boundary.geojson", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((data) => {
        if (!disposed) {
          const geometry = data?.geometry as
            | Extract<
                GeoPermissibleObjects,
                { type: "MultiPolygon" | "Polygon" }
              >
            | undefined;
          let mainland: GeoPermissibleObjects | undefined;
          if (geometry?.type === "MultiPolygon") {
            let largestArea = 0;
            for (const coordinates of geometry.coordinates) {
              const polygon = { type: "Polygon" as const, coordinates };
              const area = geoArea(polygon);
              if (area > largestArea) {
                mainland = polygon;
                largestArea = area;
              }
            }
          } else {
            mainland = geometry;
          }
          if (mainland) {
            const outline = geoPath(baseProjection).digits(6)(mainland);
            if (outline) mainlandPath = new Path2D(outline);
          }
          schedule();
        }
      })
      .catch(() => {});
    frame.read(measure);
    return () => {
      disposed = true;
      unsubscribe();
      observer.disconnect();
      controller.abort();
      cancelFrame(draw);
      cancelFrame(measure);
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
