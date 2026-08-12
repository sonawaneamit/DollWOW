"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, ImageIcon, Loader2, Mail, RotateCcw, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";
import { visualizerDraftKey, type VisualizerGroup } from "@/lib/doll-visualizer/public";

type Props = {
  product: { handle: string; name: string; brand: string; photos: Array<{ position: number; url: string; alt: string }> };
  groups: VisualizerGroup[];
  freePreviews: number;
  live: boolean;
};

type Result = {
  previewDataUrl: string;
  remaining: number;
  emailDelivered: boolean;
  selections: Array<{ groupId: string; group: string; optionId: string; option: string }>;
};

export function DollVisualizer({ product, groups, freePreviews, live }: Props) {
  const initialDraft = useMemo(() => readDraft(product.handle), [product.handle]);
  const [step, setStep] = useState(1);
  const [photoPosition, setPhotoPosition] = useState(initialDraft.photoPosition ?? product.photos[0]?.position ?? 0);
  const [selections, setSelections] = useState<Record<string, string>>(initialDraft.selections ?? {});
  const [email, setEmail] = useState(initialDraft.email ?? "");
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState(freePreviews);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("visualizer-mode");
    return () => document.body.classList.remove("visualizer-mode");
  }, []);

  useEffect(() => {
    localStorage.setItem(visualizerDraftKey(product.handle), JSON.stringify({ photoPosition, selections, email }));
  }, [email, photoPosition, product.handle, selections]);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const selectedPhoto = product.photos.find((photo) => photo.position === photoPosition) || product.photos[0];
  const selectedItems = useMemo(() => groups.flatMap((group) => {
    const option = group.options.find((item) => item.id === selections[group.id]);
    return option ? [{ group, option }] : [];
  }), [groups, selections]);
  const canGenerate = live && selectedItems.length > 0 && /^\S+@\S+\.\S+$/.test(email) && accepted && remaining > 0 && !loading;

  function choose(groupId: string, optionId: string) {
    setSelections((current) => current[groupId] === optionId ? omit(current, groupId) : { ...current, [groupId]: optionId });
    setResult(null);
  }

  async function generate() {
    if (!canGenerate) return;
    setLoading(true);
    setError("");
    trackEvent("doll_visualizer_generate", { product_handle: product.handle, option_count: selectedItems.length });
    try {
      const response = await fetch("/ops/doll-visualizer/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          productHandle: product.handle,
          sourcePosition: photoPosition,
          email,
          selections: selectedItems.map(({ group, option }) => ({ groupId: group.id, optionId: option.id }))
        })
      });
      const payload = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The preview could not be generated.");
      setResult(payload);
      setRemaining(payload.remaining);
      setStep(3);
      trackEvent("doll_visualizer_complete", { product_handle: product.handle, option_count: payload.selections.length, email_delivered: payload.emailDelivered });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The preview could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPreview() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.previewDataUrl;
    link.download = `dollwow-${product.handle}-visualizer.webp`;
    link.click();
    trackEvent("doll_visualizer_download", { product_handle: product.handle });
  }

  async function sharePreview() {
    if (!result) return;
    const blob = await (await fetch(result.previewDataUrl)).blob();
    const file = new File([blob], `dollwow-${product.handle}-visualizer.webp`, { type: blob.type || "image/webp" });
    const shareData = { title: `${product.name} Doll Visualizer™ preview`, text: "My Doll Visualizer™ look from DollWOW.com", files: [file] };
    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      trackEvent("doll_visualizer_share", { product_handle: product.handle });
      return;
    }
    downloadPreview();
  }

  return (
    <div className="visualizer-shell">
      <header className="visualizer-header">
        <Link href={`/products/${product.handle}`} aria-label="Back to product"><ArrowLeft /></Link>
        <div><span>Private pilot</span><strong>Doll Visualizer™</strong></div>
        <p><b>{remaining}</b> of {freePreviews} previews</p>
      </header>

      <div className="visualizer-main">
        <section className="visualizer-preview" aria-live="polite">
          <div className="visualizer-preview-frame">
            {result && showOriginal && selectedPhoto ? (
              <Image src={selectedPhoto.url} alt={selectedPhoto.alt} fill priority sizes="(max-width: 900px) 100vw, 56vw" />
            ) : result ? (
              // Generated data is intentionally rendered directly; it never leaves this private route.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.previewDataUrl} alt={`AI-generated styling preview for ${product.name}`} />
            ) : selectedPhoto ? (
              <Image src={selectedPhoto.url} alt={selectedPhoto.alt} fill priority sizes="(max-width: 900px) 100vw, 56vw" />
            ) : <ImageIcon aria-hidden="true" />}
            <div className="visualizer-preview-badge"><Sparkles /> {result ? (showOriginal ? "Before" : "Your preview") : "Reference photo"}</div>
          </div>
          {result ? (
            <div>
              <div className="visualizer-compare-toggle" aria-label="Compare original and generated preview">
                <button type="button" className={showOriginal ? "is-active" : ""} onClick={() => setShowOriginal(true)}>Before</button>
                <button type="button" className={!showOriginal ? "is-active" : ""} onClick={() => setShowOriginal(false)}>Preview</button>
                <button type="button" onClick={sharePreview}><Share2 /> Share</button>
                <button type="button" onClick={downloadPreview}><Download /> Save</button>
              </div>
              <div className="visualizer-result-actions">
                <button type="button" onClick={() => { setResult(null); setStep(2); setShowOriginal(false); }}><RotateCcw /> Adjust look</button>
                <Link href={`/products/${product.handle}`} onClick={() => trackEvent("doll_visualizer_continue", { product_handle: product.handle })}>Continue customizing <ArrowRight /></Link>
              </div>
            </div>
          ) : null}
        </section>

        <section className="visualizer-controls">
          <div className="visualizer-title">
            <p>{product.brand} · {product.name}</p>
            <h1>See the look before you choose.</h1>
            <span>Try exterior factory options together on a real product photo.</span>
          </div>
          <ol className="visualizer-steps" aria-label="Visualizer progress">
            {[1, 2, 3].map((number) => <li key={number} className={step >= number ? "is-active" : ""}><span>{step > number ? <Check /> : number}</span>{number === 1 ? "Photo" : number === 2 ? "Look" : "Preview"}</li>)}
          </ol>

          <div className="visualizer-scroll-area">
            {step === 1 ? (
              <div className="visualizer-pane">
                <div className="visualizer-instructions">
                  <ShieldCheck />
                  <div><strong>Make sure the feature is clearly visible</strong><p>Choose a photo where every area you want to change is unobstructed and in clear, neutral light. Hands, hair, clothing, deep shadows, or a tight crop over that feature can make the preview inaccurate. Used previews are not refundable when the selected feature is hidden.</p></div>
                </div>
                <div className="visualizer-photo-grid">
                  {product.photos.map((photo) => (
                    <button type="button" key={photo.position} className={photo.position === photoPosition ? "is-selected" : ""} onClick={() => setPhotoPosition(photo.position)} aria-pressed={photo.position === photoPosition}>
                      <Image src={photo.url} alt={photo.alt} fill sizes="30vw" />
                      {photo.position === photoPosition ? <Check /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : step === 2 ? (
              <div className="visualizer-pane visualizer-options">
                {groups.map((group) => (
                  <fieldset key={group.id}>
                    <legend>{group.label}<small>{selections[group.id] ? "1 selected" : "Optional"}</small></legend>
                    <div className="visualizer-option-row">
                      {group.options.map((option) => (
                        <button type="button" key={option.id} className={selections[group.id] === option.id ? "is-selected" : ""} onClick={() => choose(group.id, option.id)} aria-pressed={selections[group.id] === option.id}>
                          {option.swatch?.kind === "image" ? <Image src={option.swatch.value} alt="" width={72} height={72} /> : null}
                          <span>{option.label}</span>{selections[group.id] === option.id ? <Check /> : null}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <label className="visualizer-email"><Mail /><span><b>Email this look</b><small>We’ll send the preview and selected options.</small></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
                <label className="visualizer-consent"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I understand this is an AI-generated illustration. Actual factory colors and shades may vary slightly. Generated previews may be retained and used by DollWOW without displaying my identity.</span></label>
                {loading ? (
                  <div className="visualizer-wait" role="status">
                    <Loader2 className="animate-spin" />
                    <div><strong>Creating your look</strong><p>{waitMessage(elapsedSeconds)}</p><small>You can wait here or leave this page. We’ll email the finished preview to {email} when it is ready.</small></div>
                  </div>
                ) : null}
                {!live ? <p className="visualizer-notice">Preview generation is safely paused until the private pilot is enabled.</p> : null}
                {error ? <p className="visualizer-error" role="alert">{error}</p> : null}
              </div>
            ) : result ? (
              <div className="visualizer-pane visualizer-result-copy">
                <Sparkles /><h2>Your Doll Visualizer™ look</h2>
                <div>{result.selections.map((item) => <span key={`${item.groupId}-${item.optionId}`}>{item.group}: {item.option}</span>)}</div>
                <p>{result.emailDelivered ? `A copy was sent to ${email}.` : "Your preview is ready. Email delivery is not connected in this pilot environment yet."}</p>
                <p className="visualizer-disclaimer">AI-generated preview for illustration only. Colors, shades, textures, and small details may vary, and AI can occasionally misinterpret a feature. The finished doll follows your confirmed factory options—not this image. Contact support if a result looks wrong.</p>
              </div>
            ) : null}
          </div>

          {!result ? (
            <footer className="visualizer-actionbar">
              {step === 1 ? <button type="button" className="visualizer-primary" onClick={() => setStep(2)}>Choose styling <ArrowRight /></button> : (
                <><button type="button" className="visualizer-back" onClick={() => setStep(1)}><ArrowLeft /> Photo</button><button type="button" className="visualizer-primary" onClick={generate} disabled={!canGenerate}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{loading ? "Creating…" : "Create preview"}</button></>
              )}
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function omit(record: Record<string, string>, key: string) {
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key));
}

function readDraft(handle: string): { photoPosition?: number; selections?: Record<string, string>; email?: string } {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(visualizerDraftKey(handle)) || "{}") as ReturnType<typeof readDraft>;
  } catch {
    return {};
  }
}

function waitMessage(seconds: number) {
  if (seconds < 12) return "Preparing the product photo and selected factory references…";
  if (seconds < 30) return "Applying only your chosen visual options…";
  return "Checking the finished preview and preparing your email…";
}
