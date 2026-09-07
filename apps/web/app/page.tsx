"use client";

import { ArrowDownRight } from "lucide-react";
import { BookJourney } from "../components/book-journey";
import { PortfolioSections } from "../components/portfolio-sections";
import { LanguageProvider, useLanguage } from "../components/language-provider";
import { SiteHeader } from "../components/site-header";
import styles from "./page.module.css";

export default function Home() {
  return (
    <LanguageProvider>
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
            <ArrowDownRight size={20} />
          </a>
        </div>
        <PortfolioSections />
      </main>
    </>
  );
}
