import type { Metadata } from "next";
import { Home } from "../components/home";
import { pageMetadata, personJsonLd } from "./page-metadata";

export const metadata: Metadata = pageMetadata("vi");

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personJsonLd("vi") }}
      />
      <Home />
    </>
  );
}
