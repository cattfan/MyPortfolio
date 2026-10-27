import {
  experience,
  journeyChapters,
  portfolio,
  projects,
  techStack,
  type Project,
} from "./portfolio";

export type Language = "en" | "vi";

// English copy is keyed by id so adding or reordering Vietnamese entries can never
// silently borrow another entry's translation; a missing key fails the build.
function translate<T extends { id: string }, C, R>(
  items: readonly T[],
  copy: Record<string, C>,
  merge: (item: T, copy: C) => R,
): R[] {
  return items.map((item) => {
    const english = copy[item.id];
    if (!english) throw new Error(`Missing English copy for "${item.id}"`);
    return merge(item, english);
  });
}

type ProjectCopy = Omit<
  Project,
  "id" | "name" | "liveUrl" | "screenshotSource" | "technologies" | "screenshots"
> & { alts: readonly string[] };

const projectCopy: Record<string, ProjectCopy> = {
  "riviu-manager": {
    platform: "Software",
    category: "Multi-device mobile management",
    description:
      "Desktop software for managing multiple Android and iOS devices, with screen monitoring, remote control and workflow automation.",
    role: "Freelance for Riviu · full product development",
    challenge:
      "Manage multiple phones, monitor connections and handle repetitive operations without working on each device separately.",
    contribution:
      "Built the application with Tauri, Rust and React. Integrated device connections, screen streaming, remote control and device groups, alongside a visual workflow editor and device diagnostics.",
    engineering:
      "Separated Android and iOS connections from the React interface, using Rust for device operations and workflow execution. The Flow editor provides visual authoring, while the installer bundles required components to reduce setup on users' computers.",
    outcome:
      "From the device list, users open a phone's screen, control it and run the same workflow across many devices instead of repeating it by hand.",
    alts: [
      "Riviu Manager showing multiple mobile screens and connection states",
      "Riviu Manager workflow editor with branching actions",
    ],
  },
  "riviu-web": {
    platform: "Web",
    category: "Brand and services website",
    description:
      "Riviu's brand website, presenting media services and pricing with content management and contact enquiries.",
    role: "Freelance for Riviu · full product development",
    challenge:
      "Present services and pricing clearly while helping the team update content and monitor the website.",
    contribution:
      "Built the Next.js frontend, NestJS API and PostgreSQL database. Implemented a Puck content editor, pricing pages, contact forms and traffic analytics, and deployed the website to a server.",
    engineering:
      "Separated the Next.js frontend from the NestJS API for content, enquiries and analytics. PostgreSQL and Prisma store the data; the Puck editor lets the team edit and publish page sections without changing interface code.",
    outcome:
      "The site I deployed for Riviu is live at taskscatt.click, with customer-facing service pages and an administration area for the team.",
    alts: [
      "The live Riviu homepage presenting the brand and media services",
      "Service package comparison on the live Riviu website",
    ],
  },
};

const chapterCopy: Record<
  string,
  { title: string; description: string; label: string; place: string }
> = {
  "viet-nam": {
    title: "It starts with curiosity.",
    description:
      "I like understanding how things work. Over two years, that curiosity has turned into real products: websites, desktop apps and systems running on servers.",
    label: "About me",
    place: "Vietnam",
  },
  "phia-nam": {
    title: "Understand before building.",
    description:
      "I begin by listening, asking questions and defining the problem. A good solution is one people find easy to use.",
    label: "How I work",
    place: "Southern Vietnam",
  },
  "cao-nguyen": {
    title: "Learning by building.",
    description:
      "Rust for desktop apps, NestJS for APIs, Docker for deployment. Each project adds a tool that I then put to work on something real.",
    label: "Learning",
    place: "Lam Vien Plateau",
  },
  "da-lat": {
    title: "Ready for what's next.",
    description:
      "I take on freelance web and desktop projects: agreeing the scope clearly up front, building from interface to server and improving with every release.",
    label: "Let's work together",
    place: "Da Lat",
  },
};

const techStackCopy: Record<string, { label: string; description: string }> = {
  frontend: { label: "Frontend", description: "Web interfaces and interactions." },
  backend: { label: "Backend", description: "APIs and business logic." },
  data: { label: "Databases", description: "Storage, queries and data models." },
  desktop: {
    label: "Desktop applications",
    description: "Desktop software and device connections.",
  },
  deployment: {
    label: "Deployment",
    description: "Packaging and running applications on a server.",
  },
  workflow: {
    label: "Workflow & testing",
    description: "Version control and testing user flows.",
  },
};

const experienceCopy: Record<string, { title: string; description: string }> = {
  delivery: {
    title: "More than getting it to run",
    description:
      "I want to understand why code works and where it might break. When something fails, I trace it to the root cause and add a test so it stays fixed.",
  },
  communication: {
    title: "Talk through concrete examples",
    description:
      "A screen, an action or a reproducible bug usually helps people understand each other faster than a long description.",
  },
  shipping: {
    title: "Shipped, not just demoed",
    description:
      "From packaging desktop apps to Docker, Nginx and HTTPS, I get products into users' hands instead of stopping at a demo.",
  },
};

const en = {
  portfolio: {
    ...portfolio,
    introduction:
      "I'm a freelance Software Engineer with two years of experience, taking on everything from interfaces and APIs to databases and server deployment. Both products below are freelance projects I built end to end for Riviu: a desktop app that controls many phones at once and a brand website that is live today.",
    approach:
      "Before writing code, I clarify the problem and ask about anything I'm unsure of. Once it's built, I use it myself, write tests for the important flows and fix what still feels awkward.",
  },
  journeyChapters: translate(journeyChapters, chapterCopy, (chapter, copy) => ({
    ...chapter,
    ...copy,
  })),
  projects: translate(
    projects as readonly Project[],
    projectCopy,
    (project, copy): Project => {
      const { alts, ...text } = copy;
      return {
        ...project,
        ...text,
        screenshots: project.screenshots.map((image, index) => ({
          ...image,
          alt: alts[index] ?? image.alt,
        })),
      };
    },
  ),
  techStack: translate(techStack, techStackCopy, (group, copy) => ({
    ...group,
    ...copy,
  })),
  experience: translate(experience, experienceCopy, (item, copy) => ({
    ...item,
    ...copy,
  })),
};

const vi = {
  portfolio,
  journeyChapters,
  projects: projects as readonly Project[],
  techStack,
  experience,
};
export const localizedContent = { en, vi };

export const mapNames: Record<string, string> = {
  "Hà Nội": "Hanoi",
  "Đà Nẵng": "Da Nang",
  "TP. Hồ Chí Minh": "Ho Chi Minh City",
  Lào: "Laos",
  Campuchia: "Cambodia",
  "Biển Đông": "East Sea",
  "QĐ. Hoàng Sa": "Hoang Sa Islands",
  "QĐ. Trường Sa": "Truong Sa Islands",
  "Phú Quốc": "Phu Quoc",
  "Buôn Ma Thuột": "Buon Ma Thuot",
  "Phan Thiết": "Phan Thiet",
  "Bảo Lộc": "Bao Loc",
  "Lâm Đồng": "Lam Dong",
  "Lạc Dương": "Lac Duong",
  "Hồ Tuyền Lâm": "Tuyen Lam Lake",
  "Hồ Đan Kia": "Dan Kia Lake",
  "Hồ Xuân Hương": "Xuan Huong Lake",
  "Vườn hoa Đà Lạt": "Da Lat Flower Garden",
  "Chợ Đà Lạt": "Da Lat Market",
  "Ga Đà Lạt": "Da Lat Station",
  "Quảng trường Lâm Viên": "Lam Vien Square",
};
