"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Link2, Loader2, Upload } from "lucide-react";
import { GoldButton } from "./GoldButton";

export function VisualSearchForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileSummary = useMemo(() => {
    if (!imageFile) return "";
    const sizeMb = (imageFile.size / (1024 * 1024)).toFixed(1);
    return `${imageFile.name} • ${sizeMb} MB`;
  }, [imageFile]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    let response: Response;
    if (mode === "upload" && imageFile) {
      const formData = new FormData();
      formData.set("imageFile", imageFile);
      if (email) formData.set("customerEmail", email);
      formData.set("mode", "customer_lookup");
      response = await fetch("/api/search/visual", {
        method: "POST",
        body: formData
      });
    } else {
      response = await fetch("/api/search/visual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageUrl, customerEmail: email || undefined, mode: "customer_lookup" })
      });
    }

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "We could not check that image.");
      return;
    }

    router.push(`/find-this-doll/${payload.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "url" ? "border-gold-300 bg-gold-500/10 text-gold-100" : "border-gold-500/20 text-ivory-300 hover:border-gold-300/50"}`}
        >
          <Link2 className="h-4 w-4" />
          Paste image link
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "upload" ? "border-gold-300 bg-gold-500/10 text-gold-100" : "border-gold-500/20 text-ivory-300 hover:border-gold-300/50"}`}
        >
          <Upload className="h-4 w-4" />
          Upload image
        </button>
      </div>

      {mode === "url" ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Image link</span>
          <div className="flex rounded-[14px] border border-gold-500/20 bg-ink-950/70 focus-within:border-gold-300">
            <span className="flex items-center px-3 text-gold-300">
              <ImageIcon className="h-4 w-4" />
            </span>
            <input
              required={mode === "url"}
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://example.com/doll-photo.jpg"
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-ivory-50 placeholder:text-ivory-600 focus:ring-0"
            />
          </div>
        </label>
      ) : (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Upload image</span>
          <div className="rounded-[14px] border border-dashed border-gold-500/25 bg-ink-950/55 p-4">
            <input
              required={mode === "upload"}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-ivory-200 file:mr-4 file:rounded-full file:border-0 file:bg-gold-500/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-100 hover:file:bg-gold-500/25"
            />
            <p className="mt-2 text-xs text-ivory-500">JPG, PNG, or WebP. We store it briefly so the visual-search provider can inspect it.</p>
            {fileSummary ? <p className="mt-2 text-sm text-ivory-300">{fileSummary}</p> : null}
          </div>
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ivory-200">Email for follow-up, optional</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 px-4 py-3 text-ivory-50 placeholder:text-ivory-600 focus:border-gold-300 focus:ring-gold-300"
        />
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <GoldButton className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Search photo
      </GoldButton>
      <p className="text-xs text-ivory-600">
        {mode === "upload"
          ? "Upload a clear product photo and we will look for likely matches."
          : "Use a direct image link. We look for likely public matches, then compare them to the live DollWow catalog."}
      </p>
    </form>
  );
}
