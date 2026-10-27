import type { Metadata } from "next";
import { Home } from "../../components/home";
import { pageMetadata, personJsonLd } from "../page-metadata";

// English edition: same page, English server HTML and link previews.
// build-static.mjs sets <html lang="en"> in the exported en.html.
export const metadata: Metadata = pageMetadata("en");

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personJsonLd("en") }}
      />
      <Home language="en" />
    </>
  );
}
