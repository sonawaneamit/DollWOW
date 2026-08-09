"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ImagePreviewModal({ imageUrl, alt, onClose }: { imageUrl: string; alt: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
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

  if (typeof document === "undefined") return null;

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
        <Image src={imageUrl} alt={alt} fill sizes="96vw" className="object-contain" priority unoptimized />
      </div>
    </div>,
    document.body
  );
}
