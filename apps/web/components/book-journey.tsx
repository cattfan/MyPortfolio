"use client";

import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "./language-provider";
import mapAssets from "../public/portfolio/assets.json";
import { CHAPTER_STOPS, getCameraPose, getChapter } from "../lib/book-camera";
import { GeographicPlate } from "./geographic-plate";
import { MapLinework } from "./map-linework";
import styles from "./book-journey.module.css";

const subscribeHydration = () => () => {};
const isClient = () => true;
const isServer = () => false;
const staticQuery =
  "(prefers-reduced-motion: reduce), (max-height: 620px), (min-width: 641px) and (max-height: 700px)";
const getStaticMode = () => window.matchMedia(staticQuery).matches;
const subscribeStaticMode = (notify: () => void) => {
  const query = window.matchMedia(staticQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const stops = CHAPTER_STOPS;
const mapLayers = [...mapAssets.maps, ...mapAssets.detailMaps].sort(
  (a, b) => a.projection.scale - b.projection.scale,
);

export function BookJourney() {
  const {
    t,
    language,
    content: { journeyChapters, portfolio },
  } = useLanguage();
  const places =
    language === "vi"
      ? ["Việt Nam", "Phía Nam", "Cao nguyên", "Đà Lạt"]
      : ["Vietnam", "Southern Vietnam", "The highlands", "Da Lat"];
  const section = useRef<HTMLElement>(null);
  const enhanced = useSyncExternalStore(subscribeHydration, isClient, isServer);
  const staticMode = useSyncExternalStore(
    subscribeStaticMode,
    getStaticMode,
    isServer,
  );
  const [active, setActive] = useState(0);
  const visibleChapter = staticMode ? 0 : active;
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  });
  const bookProgress = scrollYProgress;
  const pinTop = useTransform(
    bookProgress,
    (p) => `${getCameraPose(p, mapAssets.maps).anchor.y * 100}%`,
  );
  const pinLeft = useTransform(
    bookProgress,
    (p) => `${getCameraPose(p, mapAssets.maps).anchor.x * 100}%`,
  );

  useMotionValueEvent(bookProgress, "change", (progress) => {
    const next = getChapter(progress);
    setActive((previous) => (previous === next ? previous : next));
  });

  function goTo(index: number) {
    const element = section.current;
    if (!element) return;
    const bounded = Math.max(0, Math.min(3, index));
    const start = element.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(0, element.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: start + (stops[bounded] ?? 0) * distance,
      behavior: "smooth",
    });
  }

  return (
    <section
      ref={section}
      className={styles.journey}
      data-enhanced={enhanced}
      data-static={staticMode}
      data-chapter={visibleChapter}
      aria-label={t(
        "Hành trình Việt Nam đến Đà Lạt",
        "A journey from Vietnam to Da Lat",
      )}
    >
      <noscript>
        <style>{`section[data-enhanced="false"]{height:auto!important}section[data-enhanced="false"]>div:first-of-type{position:relative!important}section[data-enhanced="false"] nav[aria-label="Các chặng hành trình"],section[data-enhanced="false"] button{display:none!important}section[data-enhanced="false"]>div:last-child{display:grid!important;grid-template-columns:1fr!important;max-width:800px;margin:auto;padding:30px;gap:30px}`}</style>
      </noscript>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {places[visibleChapter]}. {journeyChapters[visibleChapter]?.title}{" "}
        {journeyChapters[visibleChapter]?.description}
      </p>
      <div className={styles.scene} data-journey-frame>
        <div className={styles.intro}>
          <span className={styles.marginNote}>
            {t("Một chút về mình,", "A little about me,")}
            <br />
            {t("qua một chuyến đi.", "through a journey.")}
          </span>
          <div>
            <p className={styles.subtitle}>
              {t(
                "Lập trình, sáng tạo & những hành trình",
                "Code, creativity & journeys",
              )}
            </p>
            <h1>Đỗ Hiền Dinh</h1>
            <p className={styles.introDescription}>
              {t(
                "Software Engineer · Tò mò, học hỏi và giải quyết vấn đề.",
                "Software Engineer · Curious, learning and solving problems.",
              )}
            </p>
          </div>
        </div>

        <div className={styles.bookStage}>
          <div className={styles.book} data-book-frame>
            <div className={styles.cover} aria-hidden="true" />
            <div className={styles.pageEdges} aria-hidden="true" />
            <div className={styles.paper} data-book-paper>
              <div
                className={styles.mapWindow}
                role="img"
                aria-label={t(
                  `Bản đồ minh họa ${places[visibleChapter]}, trong quyển sách mở`,
                  `Illustrated map of ${places[visibleChapter]} inside an open book`,
                )}
              >
                {mapLayers.map((map, index) => (
                  <GeographicPlate
                    key={map.id}
                    map={map}
                    maps={mapAssets.maps}
                    layers={mapLayers}
                    index={index}
                    progress={bookProgress}
                  />
                ))}
                <MapLinework progress={bookProgress} staticMode={staticMode} />
              </div>
              <div className={styles.paperGrain} aria-hidden="true" />
              <div className={styles.gutter} aria-hidden="true" />
              <span className={styles.pageCaption}>
                {t("Những điều mình làm", "Notes from my journey")}
              </span>
              <div className={styles.compass} aria-hidden="true" data-compass>
                <span className={styles.compassNorth} data-direction="north">
                  {t("B", "N")}
                </span>
                <span className={styles.compassEast} data-direction="east">
                  {t("Đ", "E")}
                </span>
                <span className={styles.compassSouth} data-direction="south">
                  {t("N", "S")}
                </span>
                <span className={styles.compassWest} data-direction="west">
                  {t("T", "W")}
                </span>
                <i className={styles.compassRose}>
                  <i className={styles.compassNeedle} />
                </i>
              </div>
              <motion.div
                className={styles.destination}
                style={{ top: pinTop, left: pinLeft }}
                aria-hidden="true"
              >
                <span className={styles.pin} data-geographic-pin />
                <span className={styles.destinationLabel} data-map-label>
                  {t("Đà Lạt", "Da Lat")}
                  <small>
                    {t("11°56′ B · 108°26′ Đ", "11°56′ N · 108°26′ E")}
                  </small>
                </span>
              </motion.div>
              <div className={styles.annotation}>
                {journeyChapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className={styles.chapter}
                    data-current={visibleChapter === index}
                    aria-hidden={visibleChapter !== index}
                  >
                    <span className={styles.chapterNumber}>
                      0{index + 1} / {chapter.label}
                    </span>
                    <h2>{chapter.title}</h2>
                    <p>{chapter.description}</p>
                    <span
                      className={styles.annotationRule}
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
              <span className={styles.folio}>0{visibleChapter + 1}</span>
              <span className={styles.signature}>Dinh.</span>
            </div>
          </div>
        </div>

        <div className={styles.mobileAnnotation}>
          <span>
            0{visibleChapter + 1} / {places[visibleChapter]}
          </span>
          <h2>{journeyChapters[visibleChapter]?.title}</h2>
          <p>{journeyChapters[visibleChapter]?.description}</p>
        </div>

        <div className={styles.journeyRail}>
          <span className={styles.railLabel}>
            {portfolio.experienceYears}{" "}
            {t("năm kinh nghiệm lập trình", "years of engineering experience")}
          </span>
          <div className={styles.chapterPicker}>
            <span className={styles.chapterCount}>
              0{visibleChapter + 1}
              <span> / 04</span>
            </span>
            <div className={styles.chapterSelect}>
              <select
                aria-label={t("Nội dung cuốn sổ", "Book chapters")}
                value={visibleChapter}
                onChange={(event) => goTo(Number(event.target.value))}
              >
                {journeyChapters.map((chapter, index) => (
                  <option key={chapter.id} value={index}>
                    {chapter.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.arrows}>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label={t("Chặng trước", "Previous chapter")}
              title={t("Chặng trước", "Previous chapter")}
            >
              <ArrowLeft size={19} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === 3}
              aria-label={t("Chặng tiếp theo", "Next chapter")}
              title={t("Chặng tiếp theo", "Next chapter")}
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.staticChapters}>
        {journeyChapters.slice(1).map((chapter, index) => (
          <article key={chapter.id}>
            <span>
              0{index + 2} / {places[index + 1]}
            </span>
            <h2>{chapter.title}</h2>
            <p>{chapter.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
