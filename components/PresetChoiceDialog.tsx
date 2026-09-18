"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronRight, ImageOff, Search, X } from "lucide-react";
import type { CustomizationOption } from "@/types/customization";
import { formatMoney } from "@/lib/utils/currency";
import styles from "./PresetChoiceDialog.module.css";

export function PresetChoiceDialog({ open, title, presetLabel, dollName, options, selectedId, draftId, onDraft,
  totalWithoutChoice, currencyCode, step, steps, onConfirm, onClose }: {
  open: boolean; title: string; presetLabel: string; dollName: string;
  options: CustomizationOption[]; selectedId?: string; draftId?: string;
  onDraft: (id: string) => void; totalWithoutChoice: number; currencyCode: string;
  step: number; steps: number; onConfirm: (id: string) => void; onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  const [query, setQuery] = useState("");
  const picked = options.find(option => option.id === (draftId ?? selectedId));
  const minimumPrice = options.length ? Math.min(...options.map(option => option.priceDelta!)) : 0;
  const filtered = options.filter(option => option.label.toLowerCase().includes(query.toLowerCase().trim()));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={headingId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>{presetLabel} <span aria-hidden="true">/</span> {dollName}{steps > 1 ? ` / ${step} of ${steps}` : ""}</div>
        <h2 id={headingId}>{title}</h2>
        <p id={descriptionId}>Make this part yours. Your other upgrades stay selected.</p>
        <button type="button" className={styles.close} aria-label="Close chooser" title="Close chooser" onClick={onClose}><X size={22} /></button>
      </header>
      <div className={styles.toolbar}>
        <label className={styles.search}><Search size={18} aria-hidden="true" /><input type="search" aria-label="Search heads" placeholder="Find a head number" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <span>{filtered.length} choices</span>
      </div>
      <div className={styles.scroll}>
        <div className={styles.grid} role="radiogroup" aria-label={title}>
          {filtered.map(option => <label key={option.id} className={styles.option} data-selected={picked?.id === option.id}>
            <input type="radio" name={headingId} value={option.id} checked={picked?.id === option.id} onChange={() => onDraft(option.id)} />
            <span className={styles.photo}>
              {option.swatch?.kind === "image" ? <Image src={option.swatch.value} alt={`Head ${option.label}`} fill sizes="(max-width: 639px) 42vw, 165px" unoptimized className={styles.image} /> : <span className={styles.noPhoto}><ImageOff size={24} />Photo unavailable</span>}
              <span className={styles.check} aria-hidden="true">{picked?.id === option.id && <Check size={16} />}</span>
            </span>
            <span className={styles.optionText}><strong>{option.label}</strong><span>{formatMoney(option.priceDelta!, currencyCode)} upgrade</span></span>
          </label>)}
        </div>
        {!filtered.length && <p className={styles.empty}>No matching heads. Try another number.</p>}
      </div>
      <footer className={styles.footer}>
        <div className={styles.summary} aria-live="polite"><span>{picked ? `Head ${picked.label} selected` : "Choose a head to finish"}<small>{picked ? "Included in the setup total below" : "Extra-head upgrade included in this estimate"}</small></span><strong>{!picked && options.some(option => option.priceDelta !== minimumPrice) ? "From " : ""}{formatMoney(totalWithoutChoice + (picked?.priceDelta ?? minimumPrice), currencyCode)}</strong></div>
        <button className={styles.confirm} type="button" disabled={!picked} onClick={() => picked && onConfirm(picked.id)}>{step < steps ? "Confirm & continue" : "Confirm head"}<ChevronRight size={19} aria-hidden="true" /></button>
      </footer>
    </div>
  </dialog>;
}
