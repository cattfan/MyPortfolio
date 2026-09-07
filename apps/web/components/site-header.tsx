"use client";

import { Check, Mail, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-provider";
import styles from "../app/page.module.css";
import { copyText } from "../lib/copy-text";

export function SiteHeader() {
  const {
    language,
    requestedLanguage,
    setLanguage,
    t,
    content: { portfolio },
  } = useLanguage();
  const [copied, setCopied] = useState<"email" | "phone" | null>(null);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copySequence = useRef(0);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

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
          className={styles.nav}
          aria-label={t("Điều hướng chính", "Main navigation")}
        >
          <a href="#du-an">{t("Dự án", "Projects")}</a>
          <a href="#kinh-nghiem">{t("Kinh nghiệm", "Experience")}</a>
          <a href="#lien-he" className={styles.contact}>
            {t("Liên hệ", "Contact")}
          </a>
        </nav>
        <div className={styles.headerTools}>
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
            data-language-toggle
            data-language-static
          >
            <span data-active={language === "vi"}>VI</span>
            <span aria-hidden="true">/</span>
            <span data-active={language === "en"}>EN</span>
          </button>
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
