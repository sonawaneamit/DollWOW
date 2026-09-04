import Image from "next/image";
import { protectedProductImageUrl } from "@/lib/catalog/productImage";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";
import type { Product } from "@/types/product";

type Props = {
  product: Product;
  editorial?: Product["extended"]["editorialIntro"];
  preview?: boolean;
};

type EditorialPreview = {
  imageIndex: number;
  imageAlt: string;
  imagePosition?: string;
  eyebrow: string;
  heading: string;
  paragraph: string;
  facts: Array<{ label: string; value: string }>;
};

const editorialPreviews: Record<string, EditorialPreview> = {
  "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd": {
    imageIndex: 3,
    imageAlt: "Irontech Evie side portrait with long brown hair against a blue background",
    eyebrow: "A private game begins",
    heading: "Evie after the final inning",
    paragraph: "Imagine the final inning is over and Evie has saved the real game for somewhere private. Her red visor sits above long brown waves, red glasses frame her blue eyes, and an open baseball jacket reveals the fitted blue top beneath. Softly parted lips and an F-cup silhouette give the sporty look a distinctly adult edge. At 161 cm (5 ft 3 in), her full-silicone build brings bold curves to the fantasy. Pull her close by the waist, slip the silver headphones from her neck, and take your time with every playful detail. With Evie, the scoreboard can wait. This is the kind of extra inning meant to be enjoyed behind closed doors.",
    facts: [
      { label: "Height", value: "5 ft 3 in / 161 cm" },
      { label: "Material", value: "Full silicone" },
      { label: "Profile", value: "F-cup" },
    ],
  },
  "wm-terry-173cm-h-cup-tpe-companion-doll-3uz4h": {
    imageIndex: 0,
    imageAlt: "WM Dolls Terry with long blonde hair wearing a teal outfit beside a sunlit window",
    imagePosition: "center 22%",
    eyebrow: "Sunlight and secrets",
    heading: "A private afternoon with Terry",
    paragraph: "Terry waits by the window, the afternoon light catching the golden strands of her long blonde hair. She stands 173 cm (5 ft 8 in) tall, a commanding presence in her ribbed teal knitwear that clings to every curve. Her H-cup silhouette draws your gaze, while her blue eyes hold a steady, knowing invitation. As you approach, she reaches back to lift her hair, exposing the tan line of her neck and the curve of her 45.0 kg (99.2 lb) TPE frame. The room falls silent, leaving only the anticipation of what happens when the curtains close. Terry decides the day is long enough. It is time to focus entirely on you.",
    facts: [
      { label: "Height", value: "5 ft 8 in / 173 cm" },
      { label: "Material", value: "TPE" },
      { label: "Profile", value: "H-cup" },
    ],
  },
  "irontech-abraham-176cm-silicone-companion-doll-1xmxj": {
    imageIndex: 0,
    imageAlt: "Irontech Abraham with long brown hair and dark armor in a wooded setting",
    imagePosition: "center 16%",
    eyebrow: "The knight's respite",
    heading: "Surrender to Abraham's strength",
    paragraph: "The clash of steel fades as Abraham guides you into the velvet shadows of the forest. His 176 cm (5 ft 9 in) frame dominates the space, a silhouette of dark armor and quiet power. Long brown hair brushes against his shoulders while his dark eyes hold a steady, unwavering gaze. As he unbuckles his heavy chest plate, the defined lines of his silicone torso emerge beneath the canopy. He drops his sword without a sound, choosing instead to close the distance between you. Here, the only rule is his touch, turning a warrior's discipline into a slow, deliberate passion.",
    facts: [
      { label: "Height", value: "5 ft 9 in / 176 cm" },
      { label: "Material", value: "Silicone" },
      { label: "Weight", value: "123.5 lb / 56.0 kg" },
    ],
  },
  "piper-lana-155cm-f-cup-silicone-companion-doll-1d7qv": {
    imageIndex: 0,
    imageAlt: "Lana by Piper with long blonde hair wearing lavender lingerie in a bedroom",
    imagePosition: "center 15%",
    eyebrow: "A private sanctuary",
    heading: "The quiet allure of Lana",
    paragraph: "Lana waits in the dim light of the bedroom, her long blonde hair cascading over her shoulders against the white sheets. Dressed in a muted lavender two-piece that barely contains her F-cup silhouette, she watches you with dark, expectant eyes. At 155 cm (5 ft 1 in), her 60.6 lb (27.5 kg) silicone frame brings generous curves to the fantasy. She leans back, arching her spine to invite your touch, her lips parted in a silent plea for your attention. The world outside fades until only her curves remain. Tonight, Lana claims your full focus, demanding everything you have to give.",
    facts: [
      { label: "Height", value: "5 ft 1 in / 155 cm" },
      { label: "Material", value: "Silicone" },
      { label: "Profile", value: "F-cup" },
    ],
  },
};

export function supportsProductEditorialPreview(product: Product) {
  return Boolean(editorialPreviews[product.handle]);
}

export function ProductEditorialPreview({ product, editorial, preview = false }: Props) {
  const testPreview = editorialPreviews[product.handle];
  const content = preview ? testPreview : editorial;
  // Require real magazine copy — empty Admin shells must not paint a blank block.
  if (!hasEditorialIntro(content)) return null;
  const media = testPreview || {
    imageIndex: Math.min(3, Math.max(0, product.images.length - 1)),
    imageAlt: `${product.title} editorial product portrait`,
    facts: [],
  };

  return (
    <section
      className="pdp-editorial-preview"
      aria-labelledby="pdp-editorial-preview-title"
      data-testid="pdp-editorial-magazine"
      data-editorial-mode={preview ? "test-preview" : "live"}
    >
      {preview ? <div className="pdp-editorial-preview__notice">Preview only · Not published</div> : null}
      <div className="pdp-editorial-preview__inner">
        <div className="pdp-editorial-preview__media">
          <Image
            src={protectedProductImageUrl(product.handle, media.imageIndex)}
            alt={media.imageAlt}
            fill
            priority
            loading="eager"
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="pdp-editorial-preview__image"
            style={{ objectPosition: media.imagePosition }}
          />
        </div>
        <div className="pdp-editorial-preview__copy">
          <p className="pdp-editorial-preview__eyebrow">{content.eyebrow}</p>
          <h2 id="pdp-editorial-preview-title">{content.heading}</h2>
          <p>{content.paragraph}</p>
          {media.facts.length ? <dl className="pdp-editorial-preview__facts">
            {media.facts.map((fact) => (
              <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
            ))}
          </dl> : null}
        </div>
      </div>
    </section>
  );
}
