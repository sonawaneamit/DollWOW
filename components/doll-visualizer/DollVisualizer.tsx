"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, ImageIcon, Loader2, Mail, RotateCcw, Share2, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";
import { useCart } from "@/components/cart/CartProvider";
import { visualizerDraftKey, type VisualizerGroup } from "@/lib/doll-visualizer/public";
import type { BagItem } from "@/lib/cart/bag";

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
  const cart = useCart();
  const resultStartRef = useRef<HTMLDivElement>(null);
  const initialDraft = useMemo(() => readDraft(product.handle), [product.handle]);
  const [step, setStep] = useState(1);
  const [photoPosition, setPhotoPosition] = useState(initialDraft.photoPosition ?? product.photos[0]?.position ?? 0);
  const [selections, setSelections] = useState<Record<string, string>>(initialDraft.selections ?? {});
  const [email, setEmail] = useState(initialDraft.email ?? "");
  const [emailConsent, setEmailConsent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState(freePreviews);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

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
  const emailIsValid = !email || /^\S+@\S+\.\S+$/.test(email);
  const canGenerate = live && selectedItems.length > 0 && emailIsValid && (!email || emailConsent) && accepted && remaining > 0 && !loading;

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
          ...(email ? { email } : {}),
          selections: selectedItems.map(({ group, option }) => ({ groupId: group.id, optionId: option.id }))
        })
      });
      const payload = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error || "We couldn’t create this preview.");
      setResult(payload);
      setRemaining(payload.remaining);
      setStep(3);
      trackEvent("doll_visualizer_complete", { product_handle: product.handle, option_count: payload.selections.length, email_delivered: payload.emailDelivered });
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
    link.download = `dollwow-${product.handle}-visualizer.webp`;
    link.click();
    trackEvent("doll_visualizer_download", { product_handle: product.handle });
  }

  async function addPreviewToCart() {
    if (!result || cartLoading) return;
    setCartLoading(true);
    setCartError("");
    try {
      const response = await fetch("/ops/doll-visualizer/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productHandle: product.handle,
          selections: result.selections.map(({ groupId, optionId }) => ({ groupId, optionId }))
        })
      });
      const payload = await response.json() as { item?: Omit<BagItem, "addedAt" | "quantity">; error?: string };
      if (!response.ok || !payload.item) throw new Error(payload.error || "We couldn’t add this look to the cart.");
      cart.addItem({ ...payload.item, quantity: 1 });
      trackEvent("doll_visualizer_add_to_cart", { product_handle: product.handle, option_count: result.selections.length });
    } catch (caught) {
      setCartError(caught instanceof Error ? caught.message : "We couldn’t add this look to the cart.");
    } finally {
      setCartLoading(false);
    }
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
        <div><span>Doll Visualizer™</span><strong>See your doll your way</strong></div>
        <p><b>{remaining}</b> of {freePreviews} previews</p>
      </header>

      {loading ? (
        <div className="visualizer-wait-overlay" role="status" aria-live="polite">
          <div className="visualizer-wait visualizer-wait-prominent">
            <Loader2 className="animate-spin" />
            <div>
              <strong>Preparing your Doll Visualizer™ preview</strong>
              <p>{waitMessage(elapsedSeconds)}</p>
              <small>{email ? `You can wait here or leave this page. We’ll email ${email} when your preview is ready.` : "Please keep this page open while your preview is created."}</small>
              {email ? <Link className="visualizer-leave-link" href={`/products/${product.handle}`}>Leave and email me</Link> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="visualizer-main">
        <section className="visualizer-preview" aria-live="polite">
          {result ? (
            <div ref={resultStartRef} className="visualizer-result-copy visualizer-result-copy-mobile">
              <ResultSummary result={result} email={email} />
            </div>
          ) : null}
          <div className="visualizer-preview-frame">
            {result && showOriginal && selectedPhoto ? (
              <Image src={selectedPhoto.url} alt={selectedPhoto.alt} fill priority sizes="(max-width: 900px) 100vw, 56vw" />
            ) : result ? (
              // Generated data is intentionally rendered directly; it never leaves this private route.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.previewDataUrl} alt={`Doll Visualizer preview for ${product.name}`} />
            ) : selectedPhoto ? (
              <Image src={selectedPhoto.url} alt={selectedPhoto.alt} fill priority sizes="(max-width: 900px) 100vw, 56vw" />
            ) : <ImageIcon aria-hidden="true" />}
            <div className="visualizer-preview-badge"><Sparkles /> {result ? (showOriginal ? "Original" : "Your preview") : "Selected photo"}</div>
          </div>
          {result ? (
            <div>
              <div className="visualizer-compare-toggle" aria-label="Compare original and your preview">
                <button type="button" className={showOriginal ? "is-active" : ""} onClick={() => setShowOriginal(true)}>Original</button>
                <button type="button" className={!showOriginal ? "is-active" : ""} onClick={() => setShowOriginal(false)}>Your preview</button>
                <button type="button" onClick={sharePreview}><Share2 /> <span>Share</span></button>
                <button type="button" onClick={downloadPreview} aria-label="Download preview"><Download /> <span>Save</span></button>
              </div>
              <div className="visualizer-result-actions">
                <button className="visualizer-result-primary" type="button" onClick={addPreviewToCart} disabled={cartLoading}>
                  {cartLoading ? <Loader2 className="animate-spin" /> : <ShoppingBag />} {cartLoading ? "Adding…" : "Add to Cart"}
                </button>
                <div className="visualizer-result-links">
                  <Link href={`/products/${product.handle}`}>Back to product</Link>
                  <button type="button" onClick={() => { setResult(null); setStep(1); setShowOriginal(false); setCartError(""); }}><RotateCcw /> Start over</button>
                </div>
              </div>
              {cartError ? <p className="visualizer-error" role="alert">{cartError}</p> : null}
            </div>
          ) : null}
        </section>

        <section className="visualizer-controls">
          <div className="visualizer-title">
            <p>Doll Visualizer™</p>
            <h1>See your doll your way</h1>
            <span>Start with a real DollWOW product photo, then preview different hair, eyes, skin tone, and other available appearance choices before you decide.</span>
            <small>A private, no-pressure way to explore the look you have in mind.</small>
            <small className="visualizer-product-context">{product.brand} · {product.name}</small>
          </div>
          <ol className="visualizer-steps" aria-label="Visualizer progress">
            {[1, 2, 3].map((number) => <li key={number} className={step >= number ? "is-active" : ""}><span>{step > number ? <Check /> : number}</span>{number === 1 ? "Photo" : number === 2 ? "Look" : "Preview"}</li>)}
          </ol>

          <div className="visualizer-scroll-area">
            {step === 1 ? (
              <div className="visualizer-pane">
                <div className="visualizer-instructions">
                  <ShieldCheck />
                  <div><strong>Choose a photo to personalize</strong><p>Pick the photo that shows the features you want to compare most clearly. Your preview will keep this photo’s pose, setting, and overall composition. Front-facing photos usually give the clearest preview of hair, eyes, makeup, and skin tone.</p></div>
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
                <div className="visualizer-option-intro"><strong>Choose the look</strong><p>Select the appearance choices you would like to preview. Only options available for this doll are shown.</p></div>
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
                <label className="visualizer-email"><Mail /><span><b>Email my preview</b><small>Optional. Add your email if you would like to leave this page and receive the finished preview.</small></span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (!event.target.value) setEmailConsent(false); }} placeholder="you@example.com" autoComplete="email" /></label>
                {email && !emailIsValid ? <p className="visualizer-error">Enter a valid email or leave the field blank.</p> : null}
                {email ? <label className="visualizer-consent"><input type="checkbox" checked={emailConsent} onChange={(event) => setEmailConsent(event.target.checked)} /><span>Email me this Doll Visualizer™ preview.</span></label> : null}
                <label className="visualizer-consent"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>Doll Visualizer™ creates an approximate visual preview. Your finished doll may vary in color, texture, styling, and option details.</span></label>
                <p className="visualizer-privacy">Your identity and account details are never displayed with a preview. DollWOW may retain and reuse selected previews.</p>
                {!live ? <p className="visualizer-notice">Doll Visualizer™ is temporarily unavailable. Please try again shortly.</p> : null}
                {error ? <div className="visualizer-error" role="alert"><strong>We couldn’t create this preview.</strong><p>{error}</p><small>Your selections are still here. Try again, choose another photo, or ask DollWOW for help.</small></div> : null}
              </div>
            ) : result ? (
              <div className="visualizer-pane visualizer-result-copy">
                <ResultSummary result={result} email={email} />
              </div>
            ) : null}
          </div>

          {!result ? (
            <footer className="visualizer-actionbar">
              {step === 1 ? <button type="button" className="visualizer-primary" onClick={() => setStep(2)}>Choose this photo <ArrowRight /></button> : (
                <><button type="button" className="visualizer-back" onClick={() => setStep(1)}><ArrowLeft /> Photo</button><button type="button" className="visualizer-primary" onClick={generate} disabled={!canGenerate}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{loading ? "Preparing…" : "Create my preview"}</button></>
              )}
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ResultSummary({ result, email }: { result: Result; email: string }) {
  return (
    <>
      <Sparkles />
      <p className="visualizer-result-eyebrow">Your Doll Visualizer™ preview</p>
      <h2>Here’s your doll with the look you chose</h2>
      <p>Compare your preview with the original product photo before making your selections.</p>
      <strong className="visualizer-selection-heading">Previewed choices</strong>
      <div>{result.selections.map((item) => <span key={`${item.groupId}-${item.optionId}`}>{item.group}: {item.option}</span>)}</div>
      {email ? <p>{result.emailDelivered ? `A copy was sent to ${email}.` : "Your preview is ready, but the email could not be sent. You can download it here."}</p> : null}
      <p className="visualizer-disclaimer">This preview is an interpretation of your selected appearance choices, not a photograph of the finished doll. Color, texture, styling, and option details can vary in production. DollWOW will confirm your final selections before the order moves forward.</p>
      <p className="visualizer-disclaimer">Use the original product photos and specifications to evaluate the doll’s body, proportions, material, and included features.</p>
      <p className="visualizer-support-note">Previews can sometimes get a detail wrong. <Link href="/support">Ask our team</Link> if you’d like help confirming your choices.</p>
    </>
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
  if (seconds < 8) return "Checking your selections…";
  if (seconds < 18) return "Preparing the product photo…";
  if (seconds < 35) return "Applying your chosen look…";
  return "Finishing your preview…";
}
