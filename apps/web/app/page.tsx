import type { Metadata } from "next";
import { Home } from "../components/home";

const indexable = process.env.PORTFOLIO_INDEXABLE === "1";

// Robots live on the home page only: the 404 page keeps Next's own noindex tag.
export const metadata: Metadata = {
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function Page() {
  return <Home />;
}
