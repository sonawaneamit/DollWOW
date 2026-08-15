"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type PreviewImage = {
  imageUrl: string;
  alt: string;
};

export function ImagePreviewModal({
  images: suppliedImages,
  imageUrl,
  alt,
  index = 0,
  onIndexChange,
  onClose
}: {
  images?: PreviewImage[];
  imageUrl?: string;
  alt?: string;
  index?: number;
  onIndexChange?: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const activeIndexRef = useRef(index);
  const imageCountRef = useRef(0);
  const onIndexChangeRef = useRef(onIndexChange);
  const images = suppliedImages?.length ? suppliedImages : imageUrl ? [{ imageUrl, alt: alt ?? "Product image preview" }] : [];
  const activeIndex = Math.min(index, Math.max(0, images.length - 1));
  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;
  activeIndexRef.current = activeIndex;
  imageCountRef.current = images.length;
  onIndexChangeRef.current = onIndexChange;

  function move(direction: -1 | 1) {
    if (!hasMultipleImages) return;
    onIndexChange?.((activeIndex + direction + images.length) % images.length);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const siblings = Array.from(document.body.children).filter((element) => !element.contains(dialog));
    const siblingState = siblings.map((element) => ({
      element: element as HTMLElement,
      inert: (element as HTMLElement).inert,
      ariaHidden: element.getAttribute("aria-hidden")
    }));
    siblings.forEach((element) => {
      (element as HTMLElement).inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && imageCountRef.current > 1) {
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        const nextIndex = (activeIndexRef.current + direction + imageCountRef.current) % imageCountRef.current;
        onIndexChangeRef.current?.(nextIndex);
      }
      if (event.key === "Tab") {
        const controls = Array.from(dialog?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
        if (controls.length === 0) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      siblingState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  if (typeof document === "undefined" || !activeImage) return null;

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink-950/94 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Product image preview"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        ref={closeButtonRef}
        type="button"
        aria-label="Close image preview"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/25 bg-ink-900/88 text-ivory-50 shadow-soft transition hover:border-gold-300 sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative h-[calc(100svh-2rem)] w-[calc(100vw-1.5rem)] max-w-6xl overflow-hidden rounded-[20px] border border-gold-500/25 bg-ink-950 shadow-soft sm:h-[calc(100svh-3rem)] sm:w-[calc(100vw-3rem)] sm:rounded-[24px]">
        <div
          className="relative h-full w-full touch-pan-y"
          onTouchStart={(event) => {
            touchStartXRef.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartXRef.current;
            const endX = event.changedTouches[0]?.clientX;
            touchStartXRef.current = null;
            if (startX === null || endX === undefined) return;
            const distance = endX - startX;
            if (Math.abs(distance) < 50) return;
            move(distance > 0 ? -1 : 1);
          }}
        >
          <Image src={activeImage.imageUrl} alt={activeImage.alt} fill sizes="96vw" className="object-contain" priority unoptimized />
        </div>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label="View previous product image"
              onClick={() => move(-1)}
              className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/35 bg-ink-950/82 text-ivory-50 shadow-soft backdrop-blur-sm transition hover:border-gold-300 sm:left-5 sm:h-14 sm:w-14"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="View next product image"
              onClick={() => move(1)}
              className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/35 bg-ink-950/82 text-ivory-50 shadow-soft backdrop-blur-sm transition hover:border-gold-300 sm:right-5 sm:h-14 sm:w-14"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div aria-live="polite" className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-gold-500/25 bg-ink-950/82 px-3 py-1.5 text-sm font-semibold text-ivory-50 backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </div>
      </div>
    </div>,
    document.body
  );
}
