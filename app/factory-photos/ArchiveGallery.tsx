"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

type Category = "all" | "build" | "face" | "details" | "release";

const filters: Array<{ value: Category; label: string }> = [
  { value: "all", label: "All photos" },
  { value: "build", label: "Completed build" },
  { value: "face", label: "Face and finish" },
  { value: "details", label: "Visible details" },
  { value: "release", label: "Release review" }
];

const categoryDescriptions: Record<Exclude<Category, "all">, string> = {
  build: "Review the visible head and body combination, overall proportions, and completed appearance shown in the supplied media.",
  face: "Look more closely at the visible face, eyes, makeup, hair or wig, and photographed finishing details.",
  details: "Compare appearance selections, hands, feet, surface areas, or other details that the supplied view can reasonably support.",
  release: "See examples of the final visible checkpoint before a supported custom order proceeds toward shipment."
};

function publicCategory(category: string): Exclude<Category, "all"> {
  if (category === "build") return "build";
  if (category === "face") return "face";
  if (category === "release") return "release";
  return "details";
}

function labelFor(category: Exclude<Category, "all">) {
  if (category === "build") return "Completed build";
  if (category === "face") return "Face and finish";
  if (category === "release") return "Release review";
  return "Visible details";
}

function altFor(category: Exclude<Category, "all">) {
  if (category === "build") return "Anonymized historical factory photo showing a completed doll build for visible configuration review.";
  if (category === "face") return "Anonymized historical factory photo showing the face and visible finish before shipment.";
  if (category === "release") return "Anonymized historical pre-shipment photo from a final visible release review.";
  return "Anonymized historical factory photo selected to review a visible customization or finishing detail.";
}

type ArchiveEntry = { src: string; category: string };

export function ArchiveGallery({ manifestEntries }: { manifestEntries: ArchiveEntry[] }) {
  const [active, setActive] = useState<Category>("all");
  const [visibleCount, setVisibleCount] = useState(36);
  const entries = useMemo(() => manifestEntries.map((entry) => {
    const category = publicCategory(entry.category);
    return { src: entry.src, category, label: labelFor(category), alt: altFor(category) };
  }), [manifestEntries]);
  const filteredEntries = useMemo(
    () => active === "all" ? entries : entries.filter((entry) => entry.category === active),
    [active, entries]
  );
  const visibleEntries = filteredEntries.slice(0, visibleCount);

  function selectCategory(category: Category) {
    setActive(category);
    setVisibleCount(36);
  }

  return (
    <section className={styles.archiveSection} aria-labelledby="archive-gallery-title">
      <div className={styles.archiveToolbar}>
        <div>
          <p className={styles.eyebrow}>Selected historical examples</p>
          <h2 id="archive-gallery-title">Browse sex doll factory photos by review purpose</h2>
          <p>Use the filters to see how different views can support a visible review. The archive is organized by what a buyer may need to check, not by old customer, product, or order identity.</p>
        </div>
        <div className={styles.filters} aria-label="Filter factory approval examples">
          {filters.map((filter) => (
            <button key={filter.value} type="button" aria-pressed={active === filter.value} onClick={() => selectCategory(filter.value)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {active !== "all" ? <p className={styles.categoryDescription}>{categoryDescriptions[active]}</p> : null}

      <div className={styles.archiveGrid} aria-live="polite">
        {visibleEntries.map((entry) => (
          <figure key={entry.src} className={styles.archiveEntry}>
            <div className={styles.archiveImage}>
              <Image src={entry.src} alt={entry.alt} fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 280px" />
            </div>
            <figcaption><strong>{entry.label} · Historical prior-team example</strong><small>Factory lighting and available views vary by order.</small></figcaption>
          </figure>
        ))}
      </div>

      <div className={styles.loadMoreWrap}>
        {visibleEntries.length < filteredEntries.length ? (
          <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + 36)}>
            Show more factory photos <span>{visibleEntries.length} of {filteredEntries.length} selected examples</span>
          </button>
        ) : (
          <p className={styles.galleryProgress}>{visibleEntries.length} of {filteredEntries.length} selected examples</p>
        )}
      </div>
      <p className={styles.shortDisclosure}>Factory media and available views vary by product, order, and manufacturer.</p>
    </section>
  );
}
