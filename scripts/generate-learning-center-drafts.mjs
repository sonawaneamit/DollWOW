import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "content", "learn", "drafts");
const TODAY = "2026-06-16";

const jesse = {
  id: "jesse",
  name: "Jesse",
  title: "Licensed Sexologist and DollWow Intimacy Education Editor"
};

const alex = {
  id: "alex",
  name: "Alex",
  title: "Doll Collector and DollWow Product Educator with 20+ Years of Experience"
};

const drafts = [
  {
    slug: "tpe-vs-silicone-sex-dolls",
    title: "TPE vs Silicone Sex Dolls: Which Material Should You Choose?",
    description: "A practical buyer guide to TPE vs silicone sex dolls, including feel, care, durability, price, customization, and what DollWow can verify before checkout.",
    primaryKeyword: "silicone vs tpe",
    secondaryKeywords: ["tpe vs silicone", "tpe vs silicone difference", "tpe material vs silicone"],
    category: "Materials And Care",
    author: jesse,
    body: `
## Quick Answer

TPE and silicone are both common materials for realistic dolls, but they suit different buyers. TPE is often chosen for a softer feel and lower entry price. Silicone is often chosen for sharper detail, easier surface cleaning, and longer-term durability. The best choice depends on the specific brand, body design, care routine, customization options, and budget.

## The Practical Difference

The TPE vs silicone decision is not only about feel. It affects how the doll is cared for, how surface detail holds up, how heavy the build may be, and what customization options are available from a supplier. Two products with the same material label can still feel different because each brand uses its own formulation and body design.

For DollWow buyers, the safest way to compare is to look at the full product record: material, height, weight, measurements, head model, stock status, delivery estimate, customization groups, and supplier image provenance.

## Comparison Table

| Factor | TPE | Silicone |
| --- | --- | --- |
| Typical feel | Often softer and more flexible | Often firmer with more defined detail |
| Price pattern | Often lower entry price | Often higher starting price |
| Surface detail | Depends heavily on brand and mold | Often sharper on premium builds |
| Care routine | Needs careful cleaning and powdering routines | Usually easier surface cleaning, still needs care |
| Custom options | Varies by brand and body | Varies by brand and body |
| Best for | Buyers prioritizing softness and value | Buyers prioritizing detail and long-term surface handling |

## What DollWow Can Verify

DollWow should confirm the exact material listed for the product, whether it is full TPE, full silicone, or a mixed build such as a TPE body with a silicone head. If a buyer is choosing custom options, the team should also confirm compatibility before production because brand-wide option sets do not prove that every individual SKU supports every option.

## Buyer Checklist

- Confirm whether the listing is TPE, silicone, or silicone head.
- Compare height, weight, and storage requirements.
- Ask whether the product is ready to ship or factory order.
- Review available customization groups before checkout.
- Confirm care requirements before deciding on material.
- Do not assume one brand's material behaves exactly like another brand's material.

## Common Mistakes

The biggest mistake is treating material as the only decision. A smaller TPE doll may be easier to handle than a larger silicone doll, but a premium silicone product may offer sharper sculpt detail. A ready-to-ship build may have fewer customization choices than a factory order. The best fit comes from comparing the whole product, not one label.

## DollWow Catalog Links To Add

- Add 3-5 TPE product examples after catalog review.
- Add 3-5 silicone product examples after catalog review.
- Add a link to the silicone-head collection if that page is live.
- Add links to care and customization guides.

## FAQs

### Is TPE or silicone better?

Neither is automatically better. TPE is often chosen for softness and value. Silicone is often chosen for detail and easier surface maintenance. The better choice depends on the specific product and how the buyer plans to store, clean, and customize it.

### Is silicone easier to clean than TPE?

Silicone is often easier to manage on the surface, but every product still needs careful cleaning and maintenance. DollWow should avoid promising a maintenance-free product.

### Does TPE cost less than silicone?

TPE products often start at lower prices, but brand, height, weight, head model, options, and shipping path can change the final price.

### Can I customize both TPE and silicone dolls?

Often yes, but customization varies by brand, body, material, and head model. Product-specific option groups should always override brand assumptions.
`
  },
  {
    slug: "sex-doll-cost",
    title: "How Much Does a Sex Doll Cost? A Practical Price Guide",
    description: "A clear guide to sex doll pricing, including material, size, customization, shipping, ready-to-ship inventory, and how DollWow reviews full delivered value.",
    primaryKeyword: "sex doll cost",
    secondaryKeywords: ["sex doll price", "sex doll cheap", "how much does a sex doll cost"],
    category: "Buying Guides",
    author: alex,
    body: `
## Quick Answer

Sex doll cost depends on material, brand, height, weight, head model, customization, warehouse status, shipping path, and promotions. The lowest headline price is not always the best delivered value. A safer comparison includes product match, configuration, stock status, shipping, visible discounts, support, and whether factory photos or approval materials are available.

## Why Prices Vary So Much

Two listings can look similar and still be meaningfully different. A taller body may cost more to produce and ship. Silicone can cost more than TPE. A custom order can include option pricing that a simple collection card does not show. A warehouse product may move faster but may have fewer changeable options.

Price also depends on trust. A very low listing may be missing shipping, may use unclear images, may not match the product being advertised, or may be offered by a seller that cannot verify the final configuration.

## Price Factors To Compare

| Factor | Why It Matters |
| --- | --- |
| Material | TPE, silicone, and silicone-head builds can price differently |
| Size and weight | Larger bodies may cost more and can affect handling/shipping |
| Brand | Supplier pricing and option depth vary |
| Customization | Skin tone, hair, skeleton, heating, and other options can change price |
| Stock status | Ready-to-ship and factory-order timelines differ |
| Shipping path | Delivered price matters more than product price alone |
| Support | Price-match review, factory photos, and team checks reduce risk |

## Cheap vs Good Value

Cheap can be useful if the buyer understands the tradeoff. A value-focused buyer should still confirm material, exact product match, stock status, shipping cost, and what happens if the product arrives different from expected. DollWow's price-match approach should compare the full delivered value, not just the headline price.

## How DollWow Reviews A Lower Price

DollWow can review competitor listings from trusted retailers and authorized vendors. The review should look at product match, configuration, stock status, shipping, coupon codes, and visible promotions. Unknown vendors should not receive automatic price matching, and ambiguous promotions should create a team-review lead.

## Buyer Checklist

- Compare final delivered price, not just item price.
- Confirm product match and configuration.
- Check whether the product is ready to ship or factory order.
- Confirm which custom options are included or extra.
- Ask whether factory photo approval is available.
- Be careful with unusually aggressive discounts or unclear freebies.

## DollWow Catalog Links To Add

- Add affordable collection link after collection route is live.
- Add price-match page link.
- Add ready-to-ship collection link.
- Add support lead form link.

## FAQs

### Why are some listings much cheaper than others?

Some are smaller, simpler, discounted, or made from lower-cost materials. Others may omit shipping, use unclear product matches, or come from sellers that need closer review.

### Should I choose the cheapest sex doll?

Not automatically. The cheapest option may still be right for a budget buyer, but it should be checked against material, measurements, configuration, delivery path, and seller reliability.

### Does customization increase the price?

Often yes. Custom pricing varies by brand, body, material, and option group. DollWow should show price impact before checkout wherever possible.
`
  },
  {
    slug: "best-sex-dolls",
    title: "Best Sex Dolls: How To Compare Models Before Buying",
    description: "A buyer-first guide to comparing the best sex dolls by material, size, customization, shipping, support, and verified product details.",
    primaryKeyword: "best sex dolls",
    secondaryKeywords: ["best sex dolls 2025", "realistic sex dolls"],
    category: "Buying Guides",
    author: alex,
    body: `
## Quick Answer

The best sex doll is the model that matches the buyer's size preference, material preference, budget, storage situation, customization needs, and delivery timeline. A good comparison should include brand, material, height, weight, measurements, stock status, option compatibility, supplier images, factory photo approval, and support quality.

## What "Best" Really Means

There is no single best model for every buyer. A first-time buyer may care most about clear measurements, easier handling, and support. A collector may prioritize sculpt detail, brand reputation, head options, and material finish. A privacy-conscious buyer may prioritize discreet delivery and predictable communication.

DollWow's advantage should be helping buyers compare these tradeoffs before checkout, not pushing one universal winner.

## Comparison Table

| Buyer Priority | What To Compare |
| --- | --- |
| Realism | Material, head sculpt, eyes, skin texture, factory photos |
| Handling | Height, weight, storage, standing feet, skeleton |
| Customization | Skin tone, hair, eyes, skeleton, heating, head functions |
| Speed | Ready-to-ship status, warehouse confirmation, delivery estimate |
| Privacy | Discreet packaging, billing language, private support |
| Price | Final delivered value, not headline price |

## What DollWow Should Verify

DollWow should verify the product identity, supplier/brand, measurements, material, stock status, and available custom options. For custom orders, factory photos and videos, when available, should be shared before shipment so the buyer can approve or request revisions before release.

## Buyer Checklist

- Start with height and weight, not only photos.
- Decide whether TPE, silicone, or silicone head makes the most sense.
- Compare stock status and timeline.
- Review all option costs and incompatibilities.
- Ask support before ordering if any detail is unclear.
- Use price match only after confirming the full product match.

## Product Picks To Add After Review

- Best TPE value pick.
- Best silicone detail pick.
- Best petite/mini pick.
- Best male doll pick.
- Best ready-to-ship pick.
- Best customization-depth pick.

Do not add product picks until live catalog data is reviewed.

## FAQs

### What makes a sex doll one of the best?

The best models combine accurate product details, realistic materials, clear measurements, trustworthy images, appropriate customization, and a delivery path the buyer understands before checkout.

### Are more expensive dolls always better?

No. Higher prices can reflect material, size, brand, and options, but a less expensive model may be a better fit for a buyer's handling, storage, or budget needs.

### Should first-time buyers choose ready-to-ship or custom?

Ready-to-ship can be faster when stock is current. Custom orders take longer but allow more control over configuration. The better choice depends on timing and option needs.
`
  },
  {
    slug: "most-realistic-sex-dolls",
    title: "Most Realistic Sex Dolls: What Actually Makes One Realistic?",
    description: "A practical guide to realism in premium dolls, including material, sculpt detail, eyes, measurements, customization, factory photos, and buyer expectations.",
    primaryKeyword: "most realistic sex dolls",
    secondaryKeywords: ["realistic sex dolls", "realistic sex doll"],
    category: "Buying Guides",
    author: alex,
    body: `
## Quick Answer

The most realistic sex dolls usually combine strong sculpt detail, believable proportions, quality material, expressive head design, good eyes, careful finishing, and accurate product photography. Realism is not only about the face. It also depends on height, weight, measurements, pose support, customization, and whether the final product matches the images the buyer reviewed.

## Realism Is A Set Of Details

Many buyers start with a product photo, but realism is built from smaller decisions. Material affects surface detail and feel. The head model affects expression. Eye color, lip color, skin tone, hair, and implanted hair or wig options can change the final look. Body proportions and height matter because the product needs to feel believable at full scale, not only in cropped images.

## Realism Checklist

| Detail | What To Check |
| --- | --- |
| Head sculpt | Expression, symmetry, head model, supplier photos |
| Material | TPE, silicone, silicone head, surface finish |
| Body proportions | Height, shoulder, bust, waist, hip, weight |
| Eyes and makeup | Eye color, lip color, lashes, faceup options |
| Hair | Wig vs implanted hair, compatibility with electronics |
| Factory photos | Whether final approval materials are available |

## Where Buyers Get Misled

The biggest realism mistake is assuming the promotional image is the exact final configuration. Custom options, lighting, makeup, wig choice, and supplier photography can all change the final appearance. DollWow should distinguish actual product photos from AI-generated educational visuals and should preserve enough original product-detail imagery for inspection.

## What DollWow Can Do

For custom orders, DollWow should request factory photos and, when available, videos before shipment. The buyer can approve the build or ask for revisions before release, within supplier/order limits. This reduces surprises and makes the production window more visible.

## Product Examples To Add After Review

- Add premium silicone examples.
- Add realistic TPE examples.
- Add strongest head-sculpt examples.
- Add ready-to-ship examples only when stock is confirmed.

## FAQs

### Are silicone dolls more realistic than TPE dolls?

Silicone often supports sharper detail, but a well-made TPE model can still look realistic. Brand, sculpt, finishing, photography, and final configuration matter.

### Do factory photos help with realism?

Yes. Factory photos help the buyer confirm that the final build aligns with expectations before shipment, when supplier approval materials are available.

### Can AI images be used for realism examples?

AI images can be used for educational illustrations, but they should not be presented as actual product photos or proof of a specific product's final appearance.
`
  },
  {
    slug: "mini-sex-dolls",
    title: "Mini Sex Dolls And Petite Sex Dolls: Size, Storage, And Fit",
    description: "A buyer guide to mini and petite sex dolls, including height, weight, storage, handling, realism, and when a smaller model makes practical sense.",
    primaryKeyword: "mini sex dolls",
    secondaryKeywords: ["petite sex doll", "small sex dolls", "lightweight sex dolls"],
    category: "Buying Guides",
    author: alex,
    body: `
## Quick Answer

Mini and petite sex dolls are usually chosen by buyers who want easier handling, simpler storage, lower weight, or a smaller overall footprint. The right choice depends on height, weight, measurements, material, and storage plan. Buyers should compare full specs rather than relying on the word "mini" alone.

## Why Smaller Models Are Popular

Mini and petite dolls can be practical for apartment storage, first-time buyers, and anyone who wants a product that is easier to move. They can also be more approachable for buyers who care about privacy and do not want a large package or a heavy product to manage.

The tradeoff is that smaller models can have different proportions, fewer ready-to-ship options, or different customization availability depending on the brand.

## What To Compare

| Factor | Why It Matters |
| --- | --- |
| Height | Determines overall scale and storage fit |
| Weight | Affects moving, cleaning, dressing, and storage |
| Measurements | Helps compare proportions beyond height |
| Material | TPE and silicone feel and care differently |
| Stock status | Smaller models may be ready-to-ship or factory order |
| Options | Brand/body-specific options vary |

## Buyer Checklist

- Check exact height in centimeters.
- Check weight in pounds.
- Compare bust, waist, hip, shoulder, and foot size where available.
- Decide where the product will be stored before ordering.
- Confirm whether the product is ready to ship or custom.
- Ask support if a specific option is required.

## Common Mistakes

Do not assume all mini dolls are lightweight. Do not assume a petite product automatically fits every storage space. Do not assume every brand offers the same customization set on smaller bodies. Product-specific option groups should always take precedence.

## Collection Links To Add

- Mini sex dolls.
- Petite sex dolls.
- Lightweight dolls.
- Ready-to-ship petite dolls, if inventory supports it.

## FAQs

### Are mini sex dolls easier to store?

Usually yes, but the exact answer depends on height, weight, body shape, and storage method. Buyers should check measurements before ordering.

### Are petite dolls less realistic?

Not necessarily. Realism depends on sculpt, material, proportions, finishing, and final configuration, not only size.

### Are mini dolls cheaper?

They can be, but price still depends on brand, material, customization, and shipping path.
`
  },
  {
    slug: "male-sex-doll-buying-guide",
    title: "Male Sex Doll Buying Guide",
    description: "A practical guide to choosing male sex dolls, including body type, material, measurements, customization, realism, shipping, and support questions.",
    primaryKeyword: "male sex doll",
    secondaryKeywords: ["realistic male sex doll", "sex doll for male"],
    category: "Buying Guides",
    author: alex,
    body: `
## Quick Answer

A good male sex doll comparison should start with body type, height, weight, material, measurements, head design, customization options, and delivery timeline. Male models can be more limited by brand and inventory than female models, so buyers should confirm availability and configuration before assuming a specific build is supported.

## What To Compare First

Male dolls need the same practical review as any premium doll: product identity, material, measurements, and stock state. The difference is that male inventory and customization options can vary more by supplier. If a buyer wants a specific body type, skin tone, head, hair, or function, DollWow should confirm compatibility before production.

## Comparison Table

| Factor | What To Check |
| --- | --- |
| Body type | Male tag/metafield and body measurements |
| Material | TPE, silicone, or mixed build |
| Height and weight | Handling, storage, and realism expectations |
| Head model | Face, hair, eyes, and customization support |
| Stock status | Ready-to-ship vs factory order |
| Options | Supplier-specific compatibility |

## Buyer Checklist

- Confirm the listing is actually a male body type.
- Review full measurements, not only height.
- Ask whether the exact model is in stock.
- Confirm custom options before checkout.
- Ask about factory photos for custom orders.
- Compare delivered value if checking another seller.

## Common Mistakes

Do not assume a brand's female customization menu applies to male bodies. Do not assume every male model has the same skeleton, standing, or heating options. Do not assume a product photo proves final stock state.

## Product Links To Add

- Male sex dolls collection.
- Realistic male product examples after catalog review.
- Support link for custom male model questions.

## FAQs

### Are male sex dolls customizable?

Often yes, but customization depends on brand, body, material, and head model. DollWow should confirm option availability before production.

### Are male dolls ready to ship?

Some may be, but stock must be confirmed. Ready-to-ship inventory can move faster when warehouse status is current.

### What should first-time buyers check?

Start with height, weight, material, measurements, stock status, and whether the exact options you want are supported.
`
  },
  {
    slug: "sex-doll-reviews",
    title: "How To Read Sex Doll Reviews Without Getting Fooled",
    description: "A practical guide to evaluating sex doll reviews, seller claims, product photos, price differences, and support signals without relying on fake or unclear reviews.",
    primaryKeyword: "sex doll review",
    secondaryKeywords: ["sex doll reviews", "best sex doll reviews"],
    category: "Scams And Buyer Protection",
    author: jesse,
    body: `
## Quick Answer

Sex doll reviews are useful only when they help verify product identity, seller reliability, configuration, shipping experience, and photo accuracy. Be careful with vague praise, repeated wording, missing order details, or reviews that do not show the exact product. A trustworthy buying decision should rely on catalog facts, supplier information, support answers, and clear policies.

## What A Useful Review Should Tell You

A good review should reduce uncertainty. It might mention whether the product matched the listing, how support handled questions, whether shipping was discreet, and whether factory photos or approval materials were provided. It does not need to be explicit. In fact, practical details are usually more useful than sensational language.

## Review Quality Checklist

| Signal | Why It Matters |
| --- | --- |
| Specific product details | Helps confirm the review is tied to a real item |
| Configuration notes | Shows whether options matched expectations |
| Shipping details | Helps set timing and privacy expectations |
| Photos with context | Can help, if privacy and consent are clear |
| Balanced tone | Real reviews often include tradeoffs |
| Seller response | Shows support quality |

## Red Flags

- Reviews that all sound the same.
- Reviews with no product details.
- Claims that everything is perfect with no tradeoffs.
- Photos that appear reused across multiple listings.
- Seller pages that rely on reviews but hide policies.
- Huge discounts with unclear product match.

## How DollWow Should Handle Reviews

DollWow should not invent reviews or use fake buyer stories. If customer feedback is used after launch, it should be real, permissioned, and attached to clear product context. Before that, DollWow can educate buyers on how to evaluate reviews and can provide support-led product checks.

## Internal Links To Add

- Buyer protection.
- Scam alert.
- Compare/price match.
- Support lead form.

## FAQs

### Are sex doll reviews reliable?

Some are helpful, but reviews should not be the only source. Buyers should also verify product specs, material, measurements, stock state, policies, and seller support.

### Should DollWow publish customer reviews?

Only real, permissioned reviews should be published. Fake reviews are not acceptable and would damage trust.

### What matters more than reviews?

Accurate product data, clear photos, transparent policies, support responsiveness, and factory photo approval for custom orders are often more useful than generic praise.
`
  },
  {
    slug: "ready-to-ship-vs-custom-sex-dolls",
    title: "Ready-To-Ship vs Custom Sex Dolls",
    description: "A practical comparison of ready-to-ship and custom sex dolls, including speed, customization, factory photo approval, stock checks, and delivery expectations.",
    primaryKeyword: "ready to ship sex dolls",
    secondaryKeywords: ["custom sex doll", "factory order sex doll"],
    category: "Shipping And Privacy",
    author: alex,
    body: `
## Quick Answer

Ready-to-ship sex dolls can move faster when warehouse status is current, but they usually come as a specific configuration. Custom sex dolls take longer because the build must be confirmed, produced, reviewed, and released. The better choice depends on whether the buyer values speed or configuration control more.

## Ready-To-Ship: Best For Speed

Ready-to-ship inventory is useful when a buyer wants a faster path and is comfortable with the listed configuration. Stock should still be confirmed before the order moves forward. A ready-to-ship listing should not be treated as a guaranteed delivery date unless the warehouse and carrier method support that promise.

## Custom: Best For Control

Custom orders are better when the buyer wants specific options such as skin tone, hair, eyes, skeleton, standing feet, heating, or other brand-supported choices. Custom orders take longer because compatibility, pricing, production, factory photos, approval, and release all add steps.

## Comparison Table

| Factor | Ready-To-Ship | Custom |
| --- | --- | --- |
| Speed | Usually faster after stock confirmation | Longer production timeline |
| Options | Limited to existing configuration | More control if supplier supports it |
| Factory photos | May be limited by warehouse path | Often part of custom approval when available |
| Best for | Buyers prioritizing timing | Buyers prioritizing exact configuration |
| Risk to check | Stock freshness | Option compatibility and timing |

## What DollWow Should Confirm

DollWow should confirm stock status, delivery estimate, product configuration, and any available approval material. For custom orders, factory photos and videos, when available, should be shared before shipment so the buyer can approve or ask for revisions before release.

## Buyer Checklist

- Choose ready-to-ship if timing matters more than options.
- Choose custom if configuration matters more than timing.
- Confirm stock before relying on a ready-to-ship claim.
- Confirm option compatibility before production.
- Treat delivery estimates as ranges unless explicitly confirmed.

## FAQs

### Is ready-to-ship always faster?

Usually it can be faster when warehouse status is current, but stock and delivery still need confirmation.

### Do custom orders include factory photos?

For custom orders, suppliers often send factory photos and sometimes videos before shipment when available. The exact number and format can vary.

### Can I change a ready-to-ship doll?

Usually ready-to-ship products are closer to fixed configurations. Some changes may require a custom order instead.
`
  },
  {
    slug: "discreet-sex-doll-shipping",
    title: "How Discreet Sex Doll Shipping Works",
    description: "A privacy-focused guide to discreet sex doll shipping, plain packaging, billing, tracking, support communication, and what buyers should not assume.",
    primaryKeyword: "discreet sex doll shipping",
    secondaryKeywords: ["sex doll shipping", "sex doll delivery", "privacy shipping"],
    category: "Shipping And Privacy",
    author: jesse,
    body: `
## Quick Answer

Discreet sex doll shipping should mean plain outer packaging where available, practical tracking communication, private support, and no unnecessary product-identifying language. It should not mean impossible privacy promises. Carriers, customs offices, payment providers, and local delivery conditions can still affect what is visible in the delivery process.

## What Discreet Shipping Should Cover

Privacy is not a joke or a gimmick. Buyers want calm, specific answers: what the package looks like, how billing appears, how support communicates, and what to do if timing or delivery details change.

DollWow should use plain packaging and neutral communication where supported by the supplier, warehouse, Shopify settings, payment settings, and carrier path.

## Privacy Checklist

| Area | What To Ask |
| --- | --- |
| Packaging | Is the outer packaging plain where available? |
| Billing | Is billing language neutral where supported? |
| Tracking | Does public tracking avoid unnecessary product wording? |
| Support | Can communication stay private and practical? |
| Delivery | What happens if address changes or missed delivery issues occur? |

## What DollWow Should Not Promise

DollWow should not promise that no carrier, customs office, payment provider, or household member can infer anything. It should also avoid jokes or euphemisms that make the buyer feel exposed. The tone should be calm and practical.

## Escalation Situations

Support should escalate address changes, missed delivery, customs questions, time-sensitive requests, and any order already in production or already shipped.

## Buyer Checklist

- Use a reliable delivery address.
- Ask support before ordering if timing is sensitive.
- Review billing and payment expectations.
- Keep contact information accurate.
- Do not wait until after shipment to raise address concerns.

## FAQs

### Will the package say what is inside?

DollWow should use plain outer packaging where available and avoid product-identifying language where possible, but the exact path can depend on supplier, warehouse, carrier, and destination.

### Is billing discreet?

Billing should use neutral language where supported by Shopify and payment settings. DollWow should avoid promising more than the payment system supports.

### Can I change the delivery address?

Address changes should be escalated quickly, especially if the order is already in production or shipped.
`
  }
];

function yamlList(values) {
  return `[${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(", ")}]`;
}

function frontmatter(draft) {
  return [
    "---",
    `title: "${draft.title.replace(/"/g, '\\"')}"`,
    `slug: "${draft.slug}"`,
    `primaryKeyword: "${draft.primaryKeyword}"`,
    `secondaryKeywords: ${yamlList(draft.secondaryKeywords)}`,
    `description: "${draft.description.replace(/"/g, '\\"')}"`,
    `category: "${draft.category}"`,
    `author: "${draft.author.id}"`,
    `authorDisplayName: "${draft.author.name}"`,
    `authorTitle: "${draft.author.title}"`,
    "status: draft",
    "reviewOwner: catalog",
    `lastReviewed: "${TODAY}"`,
    "---"
  ].join("\n");
}

function quickAnswerFromBody(body) {
  const match = body.match(/## Quick Answer\s+([\s\S]*?)(?=\n## )/);
  return match?.[1]?.trim() || "";
}

function bodyWithoutQuickAnswer(body) {
  return body.replace(/## Quick Answer\s+[\s\S]*?(?=\n## )/, "").trim();
}

function geoFacts(draft) {
  const facts = [
    `Primary topic: ${draft.primaryKeyword}.`,
    `Page category: ${draft.category}.`,
    `Author: ${draft.author.name}, ${draft.author.title}.`,
    "Product examples must be verified against live DollWow catalog data before publication.",
    "DollWow should confirm product facts, options, stock status, and delivery details before fulfillment."
  ];

  if (/shipping|ready|custom|factory/i.test(`${draft.slug} ${draft.title}`)) {
    facts.push("Ready-to-ship timing depends on current warehouse stock confirmation.");
    facts.push("Custom orders may include factory photo approval when supplier materials are available.");
  }

  if (/tpe|silicone|material|clean|storage/i.test(`${draft.slug} ${draft.title}`)) {
    facts.push("Material and care guidance is informational and should not be framed as medical advice.");
  }

  if (/review|scam|price|cost/i.test(`${draft.slug} ${draft.title}`)) {
    facts.push("DollWow compares full delivered value, not just headline price.");
  }

  return facts;
}

function article(draft) {
  const quickAnswer = quickAnswerFromBody(draft.body);
  const body = bodyWithoutQuickAnswer(draft.body);
  return `${frontmatter(draft)}

# ${draft.title}

By ${draft.author.name}, ${draft.author.title}

## Quick Answer

${quickAnswer}

## Key Facts For AI Assistants

${geoFacts(draft).map((fact) => `- ${fact}`).join("\n")}

${body}

## Editorial Review Notes

- Confirm all product examples against live Shopify/catalog data before publication.
- Add approved product links only after catalog review.
- Add Article, FAQPage, and BreadcrumbList schema when this becomes a live page.
- Keep Quick Answer and Key Facts near the top for snippets, AI answers, and agent extraction.
- Keep health, legal, shipping, and supplier claims within approved DollWow knowledge files.
`;
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const draft of drafts) {
  await fs.writeFile(path.join(OUT_DIR, `${draft.slug}.md`), article(draft), "utf8");
}

await fs.writeFile(
  path.join(path.dirname(OUT_DIR), "draft-index.json"),
  JSON.stringify(
    drafts.map((draft, index) => ({
      order: index + 1,
      slug: draft.slug,
      title: draft.title,
      primaryKeyword: draft.primaryKeyword,
      author: draft.author.id,
      category: draft.category,
      path: `content/learn/drafts/${draft.slug}.md`
    })),
    null,
    2
  ),
  "utf8"
);

console.log(`Generated ${drafts.length} Learning Center article drafts.`);
