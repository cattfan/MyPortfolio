"use client";

import { Check, Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-provider";
import { useHydrated } from "./use-hydrated";
import styles from "../app/page.module.css";
import { copyText } from "../lib/copy-text";

export function SiteHeader() {
  const hydrated = useHydrated();
  const {
    language,
    requestedLanguage,
    setLanguage,
    t,
    content: { portfolio },
  } = useLanguage();
  const [copied, setCopied] = useState<"email" | "phone" | null>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const nav = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copySequence = useRef(0);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    // The compact menu is a native <details>; close it on outside clicks and Escape.
    // Listen from mount: input can arrive before the asynchronous toggle event.
    const close = (event: Event) => {
      const element = menu.current;
      if (!element?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        element.open = false;
        element.querySelector("summary")?.focus();
        return;
      }
      const header = element.closest("[data-site-header]");
      if (!header?.contains(event.target as Node)) element.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  async function copy(kind: "email" | "phone") {
    const sequence = ++copySequence.current;
    const value = kind === "email" ? portfolio.email : portfolio.phone;
    if (timer.current) clearTimeout(timer.current);
    try {
      await copyText(value);
      if (sequence !== copySequence.current) return;
      setCopied(kind);
      setMessage(`${t("Đã sao chép", "Copied")}: ${value}`);
    } catch {
      if (sequence !== copySequence.current) return;
      setCopied(null);
      setMessage(value);
    }
    timer.current = setTimeout(() => {
      setCopied(null);
      setMessage("");
    }, 3000);
  }

  return (
    <header className={styles.fixedHeader} data-site-header>
      <div className={styles.header}>
        <a
          href="#top"
          className={styles.wordmark}
          aria-label={t("Đỗ Hiền Dinh, trang chủ", "Đỗ Hiền Dinh, home")}
          data-language-static
        >
          <span className={styles.monogram}>dh.</span>
          <span>
            Đỗ Hiền Dinh<span className={styles.small}>{portfolio.title}</span>
          </span>
        </a>
        <nav
          ref={nav}
          id="site-navigation"
          className={styles.nav}
          aria-label={t("Điều hướng chính", "Main navigation")}
          onClick={(event) => {
            if (menu.current?.open && (event.target as Element).closest("a"))
              menu.current.open = false;
          }}
        >
          <a href="#du-an">{t("Dự án", "Projects")}</a>
          <a href="#tech-stack">{t("Công nghệ", "Tech stack")}</a>
          <a href="#kinh-nghiem">{t("Kinh nghiệm", "Experience")}</a>
          <a href="#lien-he" className={styles.contact}>
            {t("Liên hệ", "Contact")}
          </a>
        </nav>
        <div className={styles.headerTools}>
          {/* Phones keep the projects one tap away; the full nav is in the menu. */}
          <a href="#du-an" className={styles.projectsShortcut}>
            {t("Dự án", "Projects")}
          </a>
          <button
            type="button"
            className={styles.copyContact}
            onClick={() => copy("email")}
            aria-label={t(
              "Sao chép email từ thanh đầu trang",
              "Copy email from header",
            )}
            title={`${t("Sao chép email", "Copy email")}: ${portfolio.email}`}
            data-header-copy="email"
            disabled={!hydrated}
            data-language-static
          >
            {copied === "email" ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Mail size={17} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={styles.copyContact}
            onClick={() => copy("phone")}
            aria-label={t("Sao chép số điện thoại", "Copy phone number")}
            title={`${t("Sao chép số điện thoại", "Copy phone number")}: ${portfolio.phone}`}
            data-header-copy="phone"
            disabled={!hydrated}
            data-language-static
          >
            {copied === "phone" ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Phone size={17} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={styles.languageToggle}
            onClick={() =>
              setLanguage(requestedLanguage === "en" ? "vi" : "en")
            }
            aria-label={t("Switch to English", "Chuyển sang tiếng Việt")}
            lang={language === "vi" ? "en" : "vi"}
            disabled={!hydrated}
            data-language-toggle
            data-language-static
          >
            <span data-active={language === "vi"}>VI</span>
            <span aria-hidden="true">/</span>
            <span data-active={language === "en"}>EN</span>
          </button>
          <details
            ref={menu}
            className={styles.menu}
            onToggle={(event) => {
              const open = event.currentTarget.open;
              setMenuOpen(open);
              // The links precede the toggle in the DOM; move focus into the open menu.
              if (open)
                requestAnimationFrame(() =>
                  nav.current
                    ?.querySelector("a")
                    ?.focus({ preventScroll: true }),
                );
            }}
          >
            <summary
              aria-label={
                menuOpen
                  ? t("Đóng menu", "Close menu")
                  : t("Mở menu", "Open menu")
              }
              data-language-static
            >
              {menuOpen ? (
                <X size={18} aria-hidden="true" />
              ) : (
                <Menu size={18} aria-hidden="true" />
              )}
            </summary>
          </details>
        </div>
        <span
          className={styles.headerNotice}
          role="status"
          aria-live="polite"
          data-visible={Boolean(message)}
          data-language-static
        >
          {message}
        </span>
      </div>
    </header>
  );
}
