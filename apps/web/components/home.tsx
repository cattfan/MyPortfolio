"use client";

import { ArrowDownRight } from "lucide-react";
import { BookJourney } from "./book-journey";
import { PortfolioSections, SiteFooter } from "./portfolio-sections";
import { LanguageProvider, useLanguage } from "./language-provider";
import { SiteHeader } from "./site-header";
import styles from "../app/page.module.css";
import type { Language } from "../content/translations";

export function Home({ language = "vi" }: { language?: Language }) {
  return (
    <LanguageProvider initialLanguage={language}>
      <HomeContent />
    </LanguageProvider>
  );
}

function HomeContent() {
  const { t } = useLanguage();
  return (
    <>
      <a className="skip-link" href="#du-an">
        {t("Đến dự án", "Skip to projects")}
      </a>
      <SiteHeader />
      <main id="top">
        <BookJourney />
        <div className={styles.bridge}>
          <span>
            {t(
              "Mỗi hành trình đều để lại một điều gì đó.",
              "Every journey leaves something behind.",
            )}
          </span>
          <a href="#du-an">
            {t("Đây là những gì mình đã làm", "Here's what I've built")}{" "}
            <ArrowDownRight size={20} aria-hidden="true" />
          </a>
        </div>
        <PortfolioSections />
      </main>
      <SiteFooter />
    </>
  );
}
