"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./portfolio-sections.module.css";
import { ProjectShowcase } from "./project-showcase";
import { useSectionReveal } from "./use-section-reveal";
import { copyText } from "../lib/copy-text";
import { useHydrated } from "./use-hydrated";

function Contact() {
  const hydrated = useHydrated();
  const {
    t,
    content: { portfolio },
  } = useLanguage();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  async function copyEmail() {
    try {
      await copyText(portfolio.email);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopyState("idle"), 4000);
  }
  return (
    <section
      id="lien-he"
      className={styles.contact}
      aria-labelledby="contact-title"
    >
      <div className={styles.contactTop} data-reveal>
        <span className={styles.eyebrow}>
          {t("05 / Trang tiếp theo", "05 / The next chapter")}
        </span>
        <span className={styles.contactAvailability}>
          {t("Tuyển dụng & hợp tác", "Opportunities & collaboration")}
        </span>
      </div>
      <h2 id="contact-title" data-reveal>
        {t("Mình cùng xây dựng", "Let's build")}
        <br />
        <em>{t("điều gì đó nhé?", "something together.")}</em>
      </h2>
      <p>
        {t(
          "Một ý tưởng mới, một cơ hội phù hợp, hay đơn giản là một lời chào.",
          "A new idea, the right opportunity, or simply a hello.",
        )}
      </p>
      <div className={styles.emailRow}>
        <a href={`mailto:${portfolio.email}`} className={styles.emailLink}>
          <Mail aria-hidden="true" size={22} />
          <span>
            {portfolio.email.split("@")[0]}
            <wbr />@{portfolio.email.split("@")[1]}
          </span>
          <ArrowUpRight aria-hidden="true" size={24} />
        </a>
        <button
          className={styles.copyButton}
          disabled={!hydrated}
          onClick={copyEmail}
          aria-label={
            copyState === "copied"
              ? t("Đã sao chép email", "Email copied")
              : t("Sao chép email", "Copy email")
          }
          title={
            copyState === "copied"
              ? t("Đã sao chép email", "Email copied")
              : t("Sao chép email", "Copy email")
          }
        >
          {copyState === "copied" ? <Check size={18} /> : <Copy size={18} />}
        </button>
        <a
          href={portfolio.github}
          className={styles.githubLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
      <span className={styles.copyStatus} role="status" aria-live="polite">
        {copyState === "copied"
          ? t("Đã sao chép email.", "Email copied.")
          : copyState === "error"
            ? `Email: ${portfolio.email}`
            : ""}
      </span>
      <a href={`tel:${portfolio.phoneHref}`} className={styles.phoneLink}>
        <Phone aria-hidden="true" size={18} />
        {portfolio.phone}
      </a>
    </section>
  );
}

const credits = [
  {
    href: "https://www.openstreetmap.org/copyright",
    vi: "Dữ liệu bản đồ © OpenStreetMap contributors (ODbL)",
    en: "Map data © OpenStreetMap contributors (ODbL)",
  },
  {
    href: "https://data.humdata.org/dataset/cod-ab-vnm",
    vi: "Ranh giới: OCHA COD-AB (CC BY 3.0 IGO)",
    en: "Boundaries: OCHA COD-AB (CC BY 3.0 IGO)",
  },
  {
    href: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
    vi: "Địa hình: Mapzen Terrain Tiles (SRTM, GMTED2010, ETOPO1)",
    en: "Elevation: Mapzen Terrain Tiles (SRTM, GMTED2010, ETOPO1)",
  },
  {
    href: "https://www.naturalearthdata.com/",
    vi: "Nền địa lý: Natural Earth",
    en: "Base geography: Natural Earth",
  },
] as const;

function Colophon() {
  const {
    t,
    language,
    content: { portfolio },
  } = useLanguage();
  return (
    <section
      id="ve-trang-nay"
      className={styles.colophon}
      aria-labelledby="colophon-title"
    >
      <div data-reveal>
        <span className={styles.eyebrow}>
          {t("Ghi chú cuối sổ", "Back-of-the-notebook notes")}
        </span>
        <h2 id="colophon-title">
          {t("Trang này được làm thế nào", "How this site is made")}
        </h2>
      </div>
      <div className={styles.colophonBody} data-reveal>
        <p>
          {t(
            "Bản đồ trong cuốn sổ được dựng từ dữ liệu thật: độ cao địa hình, đường bờ biển, sông hồ và đường phố Đà Lạt, cùng một phép chiếu Mercator để zoom liền mạch từ cả nước tới một thành phố. Trang được xuất tĩnh bằng Next.js, chạy trong Docker sau Nginx với Content Security Policy chặt, và được kiểm thử tự động bằng Playwright.",
            "The atlas in the notebook is built from real data: terrain elevation, coastlines, rivers, lakes and Da Lat's streets, all in one Mercator projection so the zoom flows from the whole country to a single city. The site is exported as static files with Next.js, served from Docker behind Nginx with a strict Content Security Policy, and tested automatically with Playwright.",
          )}
        </p>
        <ul className={styles.credits}>
          {credits.map((credit) => (
            <li key={credit.href}>
              <a href={credit.href} target="_blank" rel="noopener noreferrer">
                {language === "vi" ? credit.vi : credit.en}
              </a>
            </li>
          ))}
          <li>
            <a href={portfolio.source} target="_blank" rel="noopener noreferrer">
              {t("Mã nguồn của trang này", "Source code for this site")}
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function PortfolioSections() {
  const sectionRef = useSectionReveal();
  const {
    t,
    content: { portfolio, projects, experience, techStack },
  } = useLanguage();
  return (
    <div className={styles.sections} ref={sectionRef}>
      <section
        id="gioi-thieu"
        className={styles.about}
        aria-labelledby="about-title"
      >
        <div className={styles.aboutLabel} data-reveal>
          <span className={styles.eyebrow}>
            {t("01 / Đôi điều về mình", "01 / A little about me")}
          </span>
          <span className={styles.aboutMark}>D.</span>
        </div>
        <div className={styles.aboutContent} data-reveal>
          <h2 id="about-title">
            {t("Một người,", "One developer,")}
            <br />
            <em>{t("trọn một sản phẩm.", "the whole product.")}</em>
          </h2>
          <div className={styles.aboutColumns}>
            <p>{portfolio.introduction}</p>
            <p>{portfolio.approach}</p>
          </div>
          <a href="#du-an" className={styles.textLink}>
            {t("Xem các dự án", "Explore my work")}{" "}
            <ArrowDown aria-hidden="true" size={16} />
          </a>
        </div>
      </section>
      <section
        id="du-an"
        className={styles.projectsSection}
        aria-labelledby="projects-title"
      >
        <div className={styles.sectionHeader} data-reveal>
          <div>
            <span className={styles.eyebrow}>
              {t("02 / Những sản phẩm đã xây", "02 / Selected work")}
            </span>
            <h2 id="projects-title">
              {t("Từ bài toán đến", "From problem to")}{" "}
              <em>{t("sản phẩm.", "product.")}</em>
            </h2>
          </div>
        </div>
        <div className={styles.projectGrid}>
          {projects.map((project, index) => (
            <article
              key={project.id}
              className={styles.project}
              data-project-id={project.id}
            >
              <ProjectShowcase project={project}>
                <div className={styles.projectHeading}>
                  <div>
                    <span className={styles.projectCategory}>
                      {project.platform} / {project.category}
                    </span>
                    <h3>{project.name}</h3>
                  </div>
                  <div className={styles.projectHeadingActions}>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t("Xem website", "Visit website")} ${project.name}`}
                        className={styles.liveLink}
                      >
                        <Globe size={15} aria-hidden="true" />
                        {t("Xem website", "Visit website")}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    )}
                    <span className={styles.projectNumber}>0{index + 1}</span>
                  </div>
                </div>
                <p className={styles.projectDescription}>
                  {project.description}
                </p>
                <ul
                  className={styles.technologies}
                  aria-label={`${t("Công nghệ", "Technologies")} ${project.name}`}
                >
                  {project.technologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              </ProjectShowcase>
            </article>
          ))}
        </div>
      </section>
      <section
        id="tech-stack"
        className={styles.techStackSection}
        aria-labelledby="tech-stack-title"
      >
        <div className={styles.techStackIntro} data-reveal>
          <span className={styles.eyebrow}>03 / Tech stack</span>
          <h2 id="tech-stack-title">
            {t("Công nghệ mình dùng.", "The tools I work with.")}
          </h2>
          <p>
            {t(
              "Mình dùng những công nghệ này trong các dự án web và phần mềm, từ viết code đến đưa sản phẩm lên server.",
              "These are the technologies I use for web and desktop projects, from writing the code to running it on a server.",
            )}
          </p>
        </div>
        <dl className={styles.techStackGroups}>
          {techStack.map((group) => (
            <div key={group.id} className={styles.techStackGroup} data-reveal>
              <dt>{group.label}</dt>
              <dd>
                <p>{group.description}</p>
                <ul aria-label={group.label}>
                  {group.technologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        id="kinh-nghiem"
        className={styles.experienceSection}
        aria-labelledby="experience-title"
      >
        <div className={styles.experienceIntro} data-reveal>
          <span className={styles.eyebrow}>
            {t("04 / Kinh nghiệm", "04 / Experience")}
          </span>
          <h2 id="experience-title">
            {t("Hai năm đi cùng", "Two years of")}
            <br />
            <em>{t("những dòng code.", "shipping software.")}</em>
          </h2>
          <p>
            {t(
              "Hai năm làm sản phẩm thật cho mình thấy phần khó thường nằm sau bản demo: dữ liệu thật, thiết bị thật và người dùng thật.",
              "Two years of real products taught me that the hard part usually comes after the demo: real data, real devices and real users.",
            )}
          </p>
        </div>
        <ul className={styles.timeline}>
          {experience.map((phase) => (
            <li key={phase.id} data-reveal>
              <div>
                <h3>{phase.title}</h3>
                <p>{phase.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Contact />
      <Colophon />
    </div>
  );
}

export function SiteFooter() {
  const revealRef = useSectionReveal();
  const {
    t,
    content: { portfolio },
  } = useLanguage();
  return (
    <div className={styles.sections} ref={revealRef}>
      <footer className={styles.footer} data-reveal>
        <a href="#top" className={styles.footerName}>
          Đỗ Hiền Dinh<span>{portfolio.title}</span>
        </a>
        <span>
          {t(
            "Cảm ơn bạn đã dành thời gian tìm hiểu về mình.",
            "Thanks for taking the time to get to know me.",
          )}
        </span>
        <a href="#top" className={styles.backToTop}>
          {t("Về đầu trang", "Back to top")}{" "}
          <ArrowUp aria-hidden="true" size={15} />
        </a>
      </footer>
    </div>
  );
}
