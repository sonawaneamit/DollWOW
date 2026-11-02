"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

const directory = "/images/dollvue/home/dollvue-skin-tone-strip";
const desktopSizes = [640, 1280, 1774].map(width => `${directory}-desktop-${width}.webp ${width}w`).join(", ");
const mobileSizes = [480, 960, 1440].map(width => `${directory}-mobile-${width}.webp ${width}w`).join(", ");

export function DollVueStripPicture({ originalOnly = false, onError }: { originalOnly?: boolean; onError?: () => void }) {
  return (
    <picture>
      {!originalOnly ? <source media="(min-width: 641px)" type="image/webp" srcSet={desktopSizes} sizes="80vw" /> : null}
      <source media="(min-width: 641px)" srcSet={`${directory}-desktop.png`} />
      {!originalOnly ? <source type="image/webp" srcSet={mobileSizes} sizes="80vw" /> : null}
      {/* The picture sources are pre-sized local derivatives; original PNGs remain the error/format fallback. */}
      <img className="home-dollvue-strip__image" src={`${directory}-mobile.png`}
        alt="DollVue preview showing the same Luna doll in four selectable skin tones"
        width={1774} height={887} loading="lazy" decoding="async" onError={onError} />
    </picture>
  );
}

export function DollVueHomepageStrip() {
  const [originalOnly, setOriginalOnly] = useState(false);
  return (
    <section className="home-dollvue-strip" aria-label="DollVue personalized appearance previews">
      {/* Native navigation exposes the streamed introduction before the verified product rail. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/dollvue" className="home-dollvue-strip__link" aria-label="Try DollVue personalized doll previews">
        <DollVueStripPicture originalOnly={originalOnly} onError={() => setOriginalOnly(true)} />
        <span className="home-dollvue-strip__cta">Try DollVue <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
      </a>
    </section>
  );
}
