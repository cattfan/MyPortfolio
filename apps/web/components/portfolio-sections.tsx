"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
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

function Contact() {
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
            {t("Hiểu bài toán.", "Understand the problem.")}
            <br />
            <em>
              {t("Làm rõ từng trải nghiệm.", "Make each experience clear.")}
            </em>
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
            <em>{t("những dòng code.", "writing software.")}</em>
          </h2>
          <p>
            {t(
              "Có phần làm xong khá nhanh, có lỗi phải ngồi tìm lâu hơn mình nghĩ. Sau mỗi lần như vậy, mình hiểu thêm một chút về việc mình đang làm.",
              "Some parts come together quickly. Some bugs take much longer than I expect. Each time, I come away understanding a little more of what I'm doing.",
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
          <ArrowUpRight aria-hidden="true" size={15} />
        </a>
      </footer>
    </div>
  );
}
