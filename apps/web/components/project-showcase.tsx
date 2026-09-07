"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Maximize2, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "../content/portfolio";
import { useLanguage } from "./language-provider";
import styles from "./project-showcase.module.css";

type ModalKind = "gallery" | "details";
type SavedProperty = {
  element: HTMLElement;
  name: string;
  value: string;
  priority: string;
};

function rememberProperty(element: HTMLElement, name: string): SavedProperty {
  return {
    element,
    name,
    value: element.style.getPropertyValue(name),
    priority: element.style.getPropertyPriority(name),
  };
}

function restoreProperties(properties: SavedProperty[]) {
  for (const { element, name, value, priority } of properties) {
    if (value) element.style.setProperty(name, value, priority);
    else element.style.removeProperty(name);
  }
}

export function ProjectShowcase({
  project,
  children,
}: {
  project: Project;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const carousel = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const savedStyles = useRef<SavedProperty[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingFrames = useRef<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [modalIndex, setModalIndex] = useState(0);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [phase, setPhase] = useState<"closed" | "opening" | "open" | "closing">(
    "closed",
  );
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const count = project.screenshots.length;
  const autoplay =
    !reducedMotion && visible && pageVisible && !hovered && !focused && !modal;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(query.matches);
    const updateVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    updateMotion();
    updateVisibility();
    query.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 },
    );
    if (carousel.current) observer.observe(carousel.current);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!autoplay || count < 2) return;
    const timer = setTimeout(
      () => setSelected((index) => (index + 1) % count),
      5000,
    );
    return () => clearTimeout(timer);
  }, [autoplay, selected, count]);

  const releaseScroll = useCallback(() => {
    restoreProperties(savedStyles.current);
    savedStyles.current = [];
  }, []);

  useEffect(() => {
    const element = dialog.current;
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      openingFrames.current.forEach(cancelAnimationFrame);
      if (element?.open) element.close();
      releaseScroll();
    };
  }, [releaseScroll]);

  useEffect(() => {
    if (!modal || !dialog.current) return;
    const element = dialog.current;
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    savedStyles.current = [
      rememberProperty(body, "overflow"),
      rememberProperty(html, "scrollbar-gutter"),
    ];
    if (scrollbarWidth > 0 && CSS.supports("scrollbar-gutter", "stable")) {
      if (getComputedStyle(html).scrollbarGutter === "auto")
        html.style.scrollbarGutter = "stable";
    } else if (scrollbarWidth > 0) {
      savedStyles.current.push(rememberProperty(body, "padding-right"));
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbarWidth}px`;
    }
    body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(() => setPhase("open"));
      openingFrames.current.push(secondFrame);
    });
    openingFrames.current = [frame];
    return () => {
      openingFrames.current.forEach(cancelAnimationFrame);
      openingFrames.current = [];
    };
  }, [modal]);

  function open(kind: ModalKind, source: HTMLElement) {
    if (modal) return;
    opener.current = source;
    setModalIndex(selected);
    setAnnouncement("");
    setPhase("opening");
    setModal(kind);
  }

  function completeClose() {
    if (dialog.current?.open) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    releaseScroll();
    setPhase("closed");
    setModal(null);
    opener.current?.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.current?.open || phase === "closing") return;
    openingFrames.current.forEach(cancelAnimationFrame);
    openingFrames.current = [];
    setPhase("closing");
    const finish = () => {
      dialog.current?.close();
      completeClose();
    };
    if (reducedMotion) finish();
    else closeTimer.current = setTimeout(finish, 180);
  }

  function changeSlide(direction: number, inModal = false) {
    const nextIndex =
      ((inModal ? modalIndex : selected) + direction + count) % count;
    if (inModal) setModalIndex(nextIndex);
    else setSelected(nextIndex);
    setAnnouncement(project.screenshots[nextIndex]!.alt);
  }

  function imageTrack(index: number, expanded = false) {
    return (
      <div
        className={styles.track}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {project.screenshots.map((image, imageIndex) => (
          <div
            key={image.src}
            className={styles.slide}
            aria-hidden={imageIndex !== index}
          >
            <Image
              src={image.src}
              alt={imageIndex === index ? image.alt : ""}
              width={image.width}
              height={image.height}
              sizes={expanded ? "95vw" : "(max-width: 700px) 100vw, 550px"}
              loading={visible || expanded ? "eager" : "lazy"}
              unoptimized={expanded}
            />
          </div>
        ))}
      </div>
    );
  }

  function detailsContent() {
    return (
      <div className={styles.detailContent}>
        <p className={styles.role}>{project.role}</p>
        <h3>{t("Bài toán", "The problem")}</h3>
        <p>{project.challenge}</p>
        <h3>{t("Phần mình thực hiện", "My contribution")}</h3>
        <p>{project.contribution}</p>
        <h3>{t("Sản phẩm", "The result")}</h3>
        <p>{project.outcome}</p>
        <Image
          src={project.screenshots[1]!.src}
          alt={project.screenshots[1]!.alt}
          width={project.screenshots[1]!.width}
          height={project.screenshots[1]!.height}
          sizes="(max-width: 700px) 90vw, 850px"
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={carousel}
        className={styles.carousel}
        data-carousel={project.id}
        data-slide-index={selected}
        data-autoplay={autoplay ? "running" : "paused"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
      >
        <button
          type="button"
          className={styles.imageButton}
          aria-label={`${t("Xem ảnh", "View images")} ${project.name}`}
          title={`${t("Xem ảnh", "View images")} ${project.name}`}
          onClick={(event) => open("gallery", event.currentTarget)}
        >
          {imageTrack(selected)}
          <span className={styles.expand}>
            <Maximize2 size={16} aria-hidden="true" />
          </span>
        </button>
      </div>
      {children}
      <button
        type="button"
        className={styles.detailsTrigger}
        data-project-details-trigger={project.id}
        aria-label={`${t("Khám phá dự án", "Explore project")} ${project.name}`}
        onClick={(event) => open("details", event.currentTarget)}
      >
        <span>{t("Khám phá dự án", "Explore project")}</span>
        <Plus size={17} aria-hidden="true" />
      </button>
      <noscript>
        <style>{`[data-carousel="${project.id}"] [data-carousel-controls], [data-project-details-trigger="${project.id}"] { display: none !important; }`}</style>
        <details className={styles.fallback}>
          <summary>{t("Khám phá dự án", "Explore project")}</summary>
          {detailsContent()}
        </details>
      </noscript>
      <dialog
        ref={dialog}
        className={`${styles.dialog} ${modal === "details" ? styles.detailsDialog : ""}`}
        data-phase={phase}
        data-modal-kind={modal ?? undefined}
        aria-label={`${modal === "details" ? t("Chi tiết dự án", "Project details") : t("Ảnh dự án", "Project images")} ${project.name}`}
        onClose={completeClose}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (modal !== "gallery") return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            changeSlide(event.key === "ArrowRight" ? 1 : -1, true);
          }
        }}
      >
        <div className={styles.dialogPanel}>
          <div className={styles.dialogHeader}>
            <strong>{project.name}</strong>
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              aria-label={
                modal === "details"
                  ? t("Đóng chi tiết", "Close details")
                  : t("Đóng ảnh", "Close images")
              }
              title={
                modal === "details"
                  ? t("Đóng chi tiết", "Close details")
                  : t("Đóng ảnh", "Close images")
              }
              autoFocus
            >
              <X size={21} aria-hidden="true" />
            </button>
          </div>
          {modal === "details" ? (
            detailsContent()
          ) : modal === "gallery" ? (
            <>
              <div
                className={styles.galleryViewport}
                data-modal-slide-index={modalIndex}
              >
                {imageTrack(modalIndex, true)}
              </div>
              <div className={styles.galleryControls}>
                <button
                  type="button"
                  onClick={() => changeSlide(-1, true)}
                  aria-label={t("Ảnh trước", "Previous image")}
                  title={t("Ảnh trước", "Previous image")}
                >
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => changeSlide(1, true)}
                  aria-label={t("Ảnh tiếp theo", "Next image")}
                  title={t("Ảnh tiếp theo", "Next image")}
                >
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : null}
          <span
            className={styles.visuallyHidden}
            aria-live="polite"
            aria-atomic="true"
          >
            {modal ? announcement : ""}
          </span>
        </div>
      </dialog>
      <span
        className={styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {modal ? "" : announcement}
      </span>
    </>
  );
}
