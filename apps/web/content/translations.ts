import {
  experience,
  journeyChapters,
  portfolio,
  projects,
  techStack,
  type Project,
} from "./portfolio";

export type Language = "en" | "vi";

const englishProjects: Project[] = projects.map((project) =>
  project.id === "riviu-manager"
    ? {
        ...project,
        platform: "Software",
        category: "Multi-device mobile management",
        description:
          "Desktop software for managing multiple Android and iOS devices, with screen monitoring, remote control and workflow automation.",
        role: "Full product development",
        challenge:
          "Manage multiple phones, monitor connections and handle repetitive operations without working on each device separately.",
        contribution:
          "Built the application with Tauri, Rust and React. Integrated device connections, screen streaming, remote control and device groups, alongside a visual workflow editor and device diagnostics.",
        engineering:
          "Separated Android and iOS connections from the React interface, using Rust for device operations and workflow execution. The Flow editor provides visual authoring, while the installer bundles required components to reduce setup on users' computers.",
        outcome:
          "Users can open a device screen, control the phone and run a saved workflow from the device list. The project screenshots show the device manager and visual Flow editor.",
        screenshots: project.screenshots.map((image, index) => ({
          ...image,
          alt:
            index === 0
              ? "Riviu Manager showing multiple mobile screens and connection states"
              : "Riviu Manager workflow editor with branching actions",
          caption: index === 0 ? "Device management" : "Workflow editor",
        })),
      }
    : {
        ...project,
        category: "Brand and services website",
        description:
          "Riviu's brand website, presenting media services and pricing with content management and contact enquiries.",
        role: "Full product development",
        challenge:
          "Present services and pricing clearly while helping the team update content and monitor the website.",
        contribution:
          "Built the Next.js frontend, NestJS API and PostgreSQL database. Implemented a Puck content editor, pricing pages, contact forms and traffic analytics, and deployed the website to a server.",
        engineering:
          "Separated the Next.js frontend from the NestJS API for content, enquiries and analytics. PostgreSQL and Prisma store the data; the Puck editor lets the team edit and publish page sections without changing interface code.",
        outcome:
          "A live website at taskscatt.click, with customer-facing service pages and an administration area for the team.",
        screenshots: project.screenshots.map((image, index) => ({
          ...image,
          alt:
            index === 0
              ? "The live Riviu homepage presenting the brand and media services"
              : "Service package comparison on the live Riviu website",
          caption: index === 0 ? "Riviu homepage" : "Service pricing",
        })),
      },
);

const en = {
  portfolio: {
    ...portfolio,
    location: "Da Lat, Vietnam",
    resume: "/cv/do-hien-dinh-en.pdf",
    introduction:
      "I'm Đỗ Hiền Dinh, a Software Engineer with two years of experience building web and desktop applications. I develop websites, mobile device management software and data tools, from the interface to the backend and deployment.",
    approach:
      "I like to understand the task before writing code. If something is unclear, I ask. Once it's built, I try it myself and fix the parts that feel awkward.",
  },
  journeyChapters: [
    {
      ...journeyChapters[0],
      title: "It starts with curiosity.",
      description:
        "I'm Đỗ Hiền Dinh, a Software Engineer with two years of experience. I enjoy understanding how things work and solving problems through software.",
      label: "About me",
      place: "Vietnam",
      kicker: "01 / About me",
    },
    {
      ...journeyChapters[1],
      title: "Understand before building.",
      description:
        "I begin by listening, asking questions and defining the problem. A useful solution should make sense for the people using it.",
      label: "How I work",
      place: "Southern Vietnam",
      kicker: "02 / How I work",
    },
    {
      ...journeyChapters[2],
      title: "Always more to learn.",
      description:
        "I learn by trying, testing and listening to feedback. Each new problem is a chance to understand more and improve how I work.",
      label: "Learning",
      place: "The highlands",
      kicker: "03 / Learning",
    },
    {
      ...journeyChapters[3],
      title: "Ready for what's next.",
      description:
        "I'm looking to build software with a team that communicates openly. I welcome feedback, test my work and improve it with each release.",
      label: "Let's work together",
      place: "Da Lat",
      kicker: "04 / Let's work together",
    },
  ],
  projects: englishProjects,
  techStack: techStack.map((group, index) => ({
    ...group,
    ...[
      { label: "Frontend", description: "Web interfaces and interactions." },
      { label: "Backend", description: "APIs and business logic." },
      { label: "Databases", description: "Storage, queries and data models." },
      {
        label: "Desktop applications",
        description: "Desktop software and device connections.",
      },
      {
        label: "Deployment",
        description: "Packaging and running applications on a server.",
      },
      {
        label: "Workflow & testing",
        description: "Version control and testing user flows.",
      },
    ][index]!,
  })),
  experience: [
    {
      id: "delivery",
      title: "More than getting it to run",
      description:
        "I want to understand why the code works and where it might break. When something goes wrong, I look for the cause instead of leaving a quick fix behind.",
    },
    {
      id: "devices",
      title: "Talk through what's unclear",
      description:
        "I prefer concrete examples. A screen, an action or a bug usually helps people understand each other faster.",
    },
    {
      id: "operation",
      title: "Still plenty to learn",
      description:
        "Two years isn't a long time. I'm still getting better at reading code, finding bugs and choosing a solution that fits the task.",
    },
  ],
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
