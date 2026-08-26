"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, ImageIcon, Loader2, RotateCcw, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";
import { dollVueDraftKey, dollVueSelectionKey, type DollVueGroup } from "@/lib/dollvue/public";
import { productUrl } from "@/lib/catalog/productUrl";

type Props = {
  product: { handle: string; name: string; brand: string; photos: Array<{ position: number; url: string; alt: string }> };
  groups: DollVueGroup[];
  freePreviews: number;
  initialRemaining: number;
  verifiedEmail: string;
  live: boolean;
};

type Result = {
  previewDataUrl: string;
  remaining: number;
  emailDelivered: boolean;
  selections: Array<{ groupId: string; group: string; optionId: string; option: string }>;
};

const MAX_PREVIEW_OPTIONS = 2;

export function DollVue({ product, groups, freePreviews, initialRemaining, verifiedEmail, live }: Props) {
  const resultStartRef = useRef<HTMLDivElement>(null);
  const initialDraft = useMemo(() => readDraft(product.handle), [product.handle]);
  const [step, setStep] = useState(1);
  const [photoPosition, setPhotoPosition] = useState(initialDraft.photoPosition ?? product.photos[0]?.position ?? 0);
  const [selections, setSelections] = useState<Record<string, string>>(initialDraft.selections ?? {});
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("dollvue-mode");
    return () => document.body.classList.remove("dollvue-mode");
  }, []);

  useEffect(() => {
    localStorage.setItem(dollVueDraftKey(product.handle), JSON.stringify({ photoPosition, selections }));
  }, [photoPosition, product.handle, selections]);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (!result) return;
    const frame = window.requestAnimationFrame(() => {
      resultStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  const selectedPhoto = product.photos.find((photo) => photo.position === photoPosition) || product.photos[0];
  const selectedItems = useMemo(() => groups.flatMap((group) => {
    const option = group.options.find((item) => item.id === selections[group.id]);
    return option ? [{ group, option }] : [];
  }), [groups, selections]);
  const optionLimitReached = selectedItems.length >= MAX_PREVIEW_OPTIONS;
  const canGenerate = live && selectedItems.length > 0 && accepted && remaining > 0 && !loading;

  function choose(groupId: string, optionId: string) {
    if (!selections[groupId] && optionLimitReached) return;
    setSelections((current) => current[groupId] === optionId ? omit(current, groupId) : { ...current, [groupId]: optionId });
    setResult(null);
  }

  async function generate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    trackEvent("dollvue_generate", { product_handle: product.handle, option_count: selectedItems.length });
    try {
      const response = await fetch("/dollvue/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          productHandle: product.handle,
          sourcePosition: photoPosition,
          selections: selectedItems.map(({ group, option }) => ({ groupId: group.id, optionId: option.id }))
        })
      });
      const payload = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error || "We couldn’t create this preview.");
      setResult(payload);
      setRemaining(payload.remaining);
      setStep(3);
      trackEvent("dollvue_complete", { product_handle: product.handle, option_count: payload.selections.length, email_delivered: payload.emailDelivered });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn’t create this preview.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPreview() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.previewDataUrl;
    link.download = `dollwow-${product.handle}-dollvue.webp`;
    link.click();
    trackEvent("dollvue_download", { product_handle: product.handle });
  }

  function usePreviewChoices() {
    if (!result) return;
    localStorage.setItem(dollVueSelectionKey(product.handle), JSON.stringify({
      selections: Object.fromEntries(result.selections.map(({ groupId, optionId }) => [groupId, optionId])),
      savedAt: Date.now()
    }));
    trackEvent("dollvue_use_choices", { product_handle: product.handle, option_count: result.selections.length });
    window.location.assign(`${productUrl(product.handle)}#build-studio`);
  }

  async function sharePreview() {
    if (!result) return;
    const blob = await (await fetch(result.previewDataUrl)).blob();
    const file = new File([blob], `dollwow-${product.handle}-dollvue.webp`, { type: blob.type || "image/webp" });
    const shareData = { title: `${product.name} DollVue™ preview`, text: "My DollVue™ look from DollWOW.com", files: [file] };
    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      trackEvent("dollvue_share", { product_handle: product.handle });
      return;
    }
    downloadPreview();
  }

  return (
    <div className={`dollvue-shell dollvue-step-${step}${result ? " has-result" : ""}`} aria-busy={loading}>
      <header className="dollvue-header">
        <Link href={productUrl(product.handle)} aria-label="Back to product"><ArrowLeft /></Link>
        <div><span>DollVue™</span><strong>See your doll your way</strong></div>
        <p><b>{remaining}</b> of {freePreviews} previews</p>
      </header>

      {loading ? (
        <div className="dollvue-wait-overlay" role="status" aria-live="polite">
          <div className="dollvue-wait dollvue-wait-prominent">
            <Loader2 className="animate-spin" />
            <div>
              <strong>Preparing your DollVue™ preview</strong>
              <p>{waitMessage(elapsedSeconds)}</p>
              <small>You can wait here or leave this page. We’ll email {verifiedEmail} when your preview is ready.</small>
              <Link className="dollvue-leave-link" href={`/products/${product.handle}`}>Leave and email me</Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dollvue-main">
        <section className="dollvue-preview" aria-live="polite">
          {result ? (
            <div ref={resultStartRef} className="dollvue-result-copy dollvue-result-copy-mobile">
              <ResultIntro result={result} verifiedEmail={verifiedEmail} />
            </div>
          ) : null}
          <div className="dollvue-preview-frame">
            {result && showOriginal && selectedPhoto ? (
              <Image src={selectedPhoto.url} alt={selectedPhoto.alt} fill priority sizes="(max-width: 900px) 100vw, 56vw" />
            ) : result ? (
              // Generated data is intentionally rendered directly; it never leaves this private route.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.previewDataUrl} alt={`DollVue preview for ${product.name}`} />
            ) : selectedPhoto ? (
              <Image src={selectedPhoto.url} alt={selectedPhoto.alt} fill priority sizes="(max-width: 900px) 100vw, 56vw" />
            ) : <ImageIcon aria-hidden="true" />}
            <div className="dollvue-preview-badge"><Sparkles /> {result ? (showOriginal ? "Original" : "Your preview") : "Selected photo"}</div>
          </div>
          {result ? (
            <div>
              <div className="dollvue-compare-toggle" aria-label="Compare original and your preview">
                <button type="button" className={showOriginal ? "is-active" : ""} onClick={() => setShowOriginal(true)}>Original</button>
                <button type="button" className={!showOriginal ? "is-active" : ""} onClick={() => setShowOriginal(false)}>Your preview</button>
                <button type="button" onClick={sharePreview}><Share2 /> <span>Share</span></button>
                <button type="button" onClick={downloadPreview} aria-label="Download preview"><Download /> <span>Save</span></button>
              </div>
              <div className="dollvue-result-actions">
                <button className="dollvue-result-primary" type="button" onClick={usePreviewChoices}>
                  Use these choices <ArrowRight />
                </button>
                <div className="dollvue-result-links">
                  <Link href={productUrl(product.handle)}>Back to product</Link>
                  <button type="button" onClick={() => { setResult(null); setStep(1); setShowOriginal(false); }}><RotateCcw /> Start over</button>
                </div>
              </div>
              <div className="dollvue-result-notes-mobile">
                <ResultNotes />
              </div>
            </div>
          ) : null}
        </section>

        <section className="dollvue-controls">
          <div className="dollvue-title">
            <p>DollVue™</p>
            <h1>See your doll your way</h1>
            <span>Start with a real DollWOW product photo, then preview different hair, eyes, skin tone, and other available appearance choices before you decide.</span>
            <small>A private, no-pressure way to explore the look you have in mind.</small>
            <small className="dollvue-product-context">{product.brand} · {product.name}</small>
          </div>
          <ol className="dollvue-steps" aria-label="DollVue progress">
            {[1, 2, 3].map((number) => <li key={number} className={step >= number ? "is-active" : ""}><span>{step > number ? <Check /> : number}</span>{number === 1 ? "Photo" : number === 2 ? "Look" : "Preview"}</li>)}
          </ol>

          {step === 2 ? (
            <div className={`dollvue-option-intro${optionLimitReached ? " is-limit-reached" : ""}`}>
              <div>
                <strong>Choose up to {MAX_PREVIEW_OPTIONS} appearance options</strong>
                <small>{selectedItems.length} of {MAX_PREVIEW_OPTIONS} selected</small>
              </div>
              <p>Each preview combines up to two visible changes. Use another free preview to explore a different combination.</p>
              {optionLimitReached ? (
                <p className="dollvue-option-limit" role="status" aria-live="polite">
                  Limit reached — remove one selected choice to unlock the greyed-out options.
                </p>
              ) : (
                <p className="dollvue-option-limit-hint">Choose one or two options below.</p>
              )}
            </div>
          ) : null}

          <div className="dollvue-scroll-area">
            {step === 1 ? (
              <div className="dollvue-pane">
                <div className="dollvue-instructions">
                  <ShieldCheck />
                  <div><strong>Choose a photo to personalize</strong><p>Pick the photo that shows the features you want to compare most clearly. Your preview will keep this photo’s pose, setting, and overall composition. Front-facing photos usually give the clearest preview of hair, eyes, makeup, and skin tone.</p></div>
                </div>
                <div className="dollvue-photo-grid">
                  {product.photos.map((photo) => (
                    <button type="button" key={photo.position} className={photo.position === photoPosition ? "is-selected" : ""} onClick={() => setPhotoPosition(photo.position)} aria-label={`Choose photo ${photo.position}`} aria-pressed={photo.position === photoPosition}>
                      <Image src={photo.url} alt={`${photo.alt} — photo ${photo.position}`} fill sizes="30vw" />
                      {photo.position === photoPosition ? <Check /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : step === 2 ? (
              <div className="dollvue-pane dollvue-options">
                {groups.map((group) => (
                  <fieldset key={group.id}>
                    <legend>{group.label}<small>{selections[group.id] ? "1 selected" : "Optional"}</small></legend>
                    <div className="dollvue-option-row">
                      {group.options.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={`${selections[group.id] === option.id ? "is-selected" : ""}${!selections[group.id] && optionLimitReached ? " is-limit-locked" : ""}`}
                          onClick={() => choose(group.id, option.id)}
                          aria-pressed={selections[group.id] === option.id}
                          aria-label={!selections[group.id] && optionLimitReached ? `${option.label}. Unavailable until you remove one of your two selected choices.` : option.label}
                          title={!selections[group.id] && optionLimitReached ? "Remove one selected choice to unlock this option" : undefined}
                          disabled={!selections[group.id] && optionLimitReached}
                        >
                          {option.swatch?.kind === "image" ? <Image src={option.swatch.value} alt="" width={72} height={72} /> : null}
                          <span>{option.label}</span>
                          {!selections[group.id] && optionLimitReached ? <small className="dollvue-option-lock-label">2-choice limit</small> : null}
                          {selections[group.id] === option.id ? <Check /> : null}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <p className="dollvue-verified-email"><ShieldCheck /><span><b>Verified access</b><small>Previews are connected to {verifiedEmail} across your devices.</small></span></p>
                <label className="dollvue-consent"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>DollVue™ creates an approximate visual preview. Your finished doll may vary in color, texture, styling, and option details.</span></label>
                <p className="dollvue-privacy">Your identity and account details are never displayed with a preview. DollWOW may retain and reuse selected previews.</p>
                {!live ? <p className="dollvue-notice">DollVue™ is temporarily unavailable. Please try again shortly.</p> : null}
                {error ? <div className="dollvue-error" role="alert"><strong>We couldn’t create this preview.</strong><p>{error}</p><small>Your selections are still here. Try again, choose another photo, or ask DollWOW for help.</small></div> : null}
              </div>
            ) : result ? (
              <div className="dollvue-pane dollvue-result-copy">
                <ResultSummary result={result} verifiedEmail={verifiedEmail} />
              </div>
            ) : null}
          </div>

          {!result ? (
            <footer className="dollvue-actionbar">
              {step === 1 ? <button type="button" className="dollvue-primary" onClick={() => setStep(2)}>Choose this photo <ArrowRight /></button> : (
                <><button type="button" className="dollvue-back" onClick={() => setStep(1)}><ArrowLeft /> Photo</button><button type="button" className="dollvue-primary" onClick={generate} disabled={!canGenerate}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{loading ? "Preparing…" : "Create my preview"}</button></>
              )}
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ResultSummary({ result, verifiedEmail }: { result: Result; verifiedEmail: string }) {
  return (
    <>
      <ResultIntro result={result} verifiedEmail={verifiedEmail} />
      <ResultNotes />
    </>
  );
}

function ResultIntro({ result, verifiedEmail }: { result: Result; verifiedEmail: string }) {
  return (
    <>
      <p className="dollvue-result-eyebrow">DollVue™</p>
      <h2>Your look is ready</h2>
      <strong className="dollvue-selection-heading">Previewed choices</strong>
      <div>{result.selections.map((item) => <span key={`${item.groupId}-${item.optionId}`}>{item.group}: {item.option}</span>)}</div>
      <p>{result.emailDelivered ? `Sent to ${verifiedEmail}.` : "The email could not be sent. You can save the preview here."}</p>
    </>
  );
}

function ResultNotes() {
  return (
    <p className="dollvue-support-note">Approximate preview—colors and details may vary, and DollVue can sometimes make a mistake. Use the original photos for product details, or <Link href="/support">ask our team</Link> for help.</p>
  );
}

function omit(record: Record<string, string>, key: string) {
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key));
}

function readDraft(handle: string): { photoPosition?: number; selections?: Record<string, string> } {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(dollVueDraftKey(handle)) || "{}") as ReturnType<typeof readDraft>;
  } catch {
    return {};
  }
}

function waitMessage(seconds: number) {
  if (seconds < 8) return "Checking your selections…";
  if (seconds < 18) return "Preparing the product photo…";
  if (seconds < 35) return "Applying your chosen look…";
  return "Finishing your preview…";
}
