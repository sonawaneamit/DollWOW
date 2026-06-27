import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = "2026-06-16";

const authors = {
  jesse: {
    displayName: "Jesse",
    title: "Licensed Sexologist and DollWow Intimacy Education Editor",
    type: "real DollWow contributor",
    shortBio: "Jesse is a licensed sexologist and DollWow's intimacy education editor.",
    bio:
      "Jesse writes DollWow's care, privacy, safety, and buyer-comfort guides through the lens of a licensed sexologist. Jesse's role is to make sensitive buying questions feel clear and practical, while keeping product, shipping, and policy claims grounded in DollWow catalog data and supplier information.",
    voice:
      "Calm, careful, privacy-aware, and practical. Jesse should reduce anxiety, separate fact from preference, and avoid medical or therapeutic certainty unless the article has specific review.",
    signaturePhrases: [
      "For most buyers, the practical question is...",
      "A safer way to compare is...",
      "If timing matters, ask before checkout.",
      "This is informational, not medical advice."
    ],
    rules: [
      "Use for care, safety, privacy, customization, and sensitive buyer-question topics.",
      "Jesse can be described as a licensed sexologist.",
      "Do not turn Jesse's byline into medical, therapeutic, psychological, or legal advice."
    ]
  },
  alex: {
    displayName: "Alex",
    title: "Doll Collector and DollWow Product Educator with 20+ Years of Experience",
    type: "real DollWow contributor",
    shortBio: "Alex is a doll collector and DollWow product educator with 20+ years of experience.",
    bio:
      "Alex writes DollWow's buying guides, brand explainers, and product-comparison content from 20+ years of collector experience. Alex focuses on the details buyers can actually compare: material, height, weight, measurements, body type, option compatibility, catalog photos, and what should be confirmed before checkout.",
    voice:
      "Specific, detail-oriented, and collector-practical. Alex should sound like someone who knows where catalog listings can mislead buyers, not like a brochure or generic product roundup.",
    signaturePhrases: [
      "The spec that matters here is...",
      "I would compare this against...",
      "The listing is only the starting point.",
      "Product-specific options win over brand-wide assumptions."
    ],
    rules: [
      "Use for product comparisons, brand guides, size/fit guides, materials, measurements, and collection education.",
      "Alex can be described as having 20+ years of collector experience.",
      "Keep Alex's experience tied to product education, collecting, materials, measurements, and comparison judgment."
    ]
  }
};

const voiceBlock = `Write in DollWow's editorial voice: discreet, practical, premium adult-commerce guidance. The copy should sound like an experienced adult-commerce specialist, not a generic AI explainer. Be clear and specific, never explicit for its own sake. Help a privacy-conscious buyer compare product facts, options, timing, and risks. Do not invent reviews, credentials, health claims, legal advice, supplier authorization, shipping guarantees, included accessories, or product availability. Use careful language when something depends on supplier confirmation.

Anti-ChatGPT style rules: do not open with "When it comes to," "In today's world," "It is important to note," "This comprehensive guide," or "Whether you're a beginner..." Avoid generic phrases like "unlock," "elevate your experience," "game-changer," "boasts," and "crafted to perfection." Use concrete buyer details: price, material, height, weight, measurements, storage, stock status, customization, supplier confirmation, privacy, delivery timing, and checkout risk. Mix short and medium sentences. Do not stuff keywords.

Author voice: Jesse is calm, careful, privacy-aware, and practical. Alex is specific, detail-oriented, and collector-practical.`;

const blogTopics = [
  topic("tpe-vs-silicone-sex-dolls", "TPE vs Silicone Sex Dolls: Which Material Should You Choose?", "silicone vs tpe", ["tpe vs silicone", "tpe vs silicone difference", "tpe material vs silicone"], "Materials And Care", "informational", "jesse", ["/tpe-sex-dolls", "/silicone-sex-dolls", "/silicone-head-sex-dolls", "/customize"]),
  topic("sex-doll-cost", "How Much Does a Sex Doll Cost? A Practical Price Guide", "sex doll cost", ["sex doll price", "sex doll cheap", "how much does a sex doll cost"], "Buying Guides", "commercial", "alex", ["/cheap-sex-dolls", "/best-price-guarantee", "/compare", "/support"]),
  topic("best-sex-dolls", "Best Sex Dolls: How To Compare Models Before Buying", "best sex dolls", ["best sex dolls 2025", "best sex doll stores", "realistic sex dolls"], "Buying Guides", "commercial", "alex", ["/best-sex-dolls", "/realistic-sex-dolls", "/help-me-choose", "/compare"]),
  topic("most-realistic-sex-dolls", "Most Realistic Sex Dolls: What Actually Makes One Realistic?", "most realistic sex dolls", ["realistic sex dolls", "realistic sex doll"], "Buying Guides", "commercial", "alex", ["/realistic-sex-dolls", "/silicone-sex-dolls", "/customize", "/buyer-protection"]),
  topic("mini-sex-dolls", "Mini Sex Dolls And Petite Sex Dolls: Size, Storage, And Fit", "mini sex dolls", ["petite sex doll", "small sex dolls", "lightweight sex dolls"], "Buying Guides", "informational", "alex", ["/mini-sex-dolls", "/petite-sex-dolls", "/shop/height-under-155", "/shipping"]),
  topic("male-sex-doll-buying-guide", "Male Sex Doll Buying Guide", "male sex doll", ["realistic male sex doll", "sex doll for male"], "Buying Guides", "commercial", "alex", ["/male-sex-dolls", "/help-me-choose", "/customize", "/support"]),
  topic("torso-sex-dolls", "Torso Sex Dolls: Who They Are Best For", "torso sex dolls", ["sex doll torso", "torso doll"], "Buying Guides", "commercial", "alex", ["/torso-sex-dolls", "/shop", "/support"]),
  topic("sex-doll-reviews", "How To Read Sex Doll Reviews Without Getting Fooled", "sex doll review", ["sex doll reviews", "best sex doll reviews"], "Scams And Buyer Protection", "informational", "jesse", ["/buyer-protection", "/scam-alert", "/compare", "/support"]),
  topic("ready-to-ship-vs-custom-sex-dolls", "Ready-To-Ship vs Custom Sex Dolls", "ready to ship sex dolls", ["custom sex doll", "factory order sex doll"], "Shipping And Privacy", "commercial", "alex", ["/ready-to-ship-sex-dolls", "/custom-sex-dolls", "/shipping", "/how-ordering-works"]),
  topic("discreet-sex-doll-shipping", "How Discreet Sex Doll Shipping Works", "discreet sex doll shipping", ["sex doll shipping", "sex doll delivery", "privacy shipping"], "Shipping And Privacy", "informational", "jesse", ["/shipping", "/shipping-protection", "/privacy-policy", "/support"]),
  topic("how-to-clean-a-sex-doll", "How To Clean a Sex Doll Safely", "how to clean sex doll", ["sex doll cleaning", "cleaning a sex doll"], "Materials And Care", "informational", "jesse", ["/learn/tpe-vs-silicone-sex-dolls", "/customize", "/support"]),
  topic("sex-doll-storage", "Sex Doll Storage: How To Protect Material, Shape, And Privacy", "sex doll storage", ["how to store a sex doll", "sex doll maintenance"], "Materials And Care", "informational", "jesse", ["/learn/how-to-clean-a-sex-doll", "/shipping", "/support"]),
  topic("sex-doll-maintenance-checklist", "Sex Doll Maintenance Checklist", "sex doll maintenance", ["sex doll care", "sex doll cleaning"], "Materials And Care", "informational", "jesse", ["/learn/how-to-clean-a-sex-doll", "/learn/sex-doll-storage", "/support"]),
  topic("sex-doll-scams", "Sex Doll Scams: Red Flags Before You Buy", "sex doll scams", ["avoid sex doll scams", "fake sex doll sellers"], "Scams And Buyer Protection", "informational", "jesse", ["/scam-alert", "/buyer-protection", "/compare", "/support"]),
  topic("sex-doll-laws-us", "Are Sex Dolls Legal In The US? Buyer Information, Not Legal Advice", "sex doll laws", ["are sex dolls legal in the us", "sex doll laws usa"], "Laws And Safety", "informational", "jesse", ["/adult-only", "/shipping", "/support"]),
  topic("custom-sex-dolls", "Custom Sex Dolls: What You Can Usually Change", "custom sex doll", ["sex doll customization", "customize sex doll"], "Customization", "commercial", "alex", ["/custom-sex-dolls", "/customize", "/support"]),
  topic("implanted-hair-vs-wig", "Implanted Hair vs Wig: What To Know Before Choosing", "implanted hair sex doll", ["sex doll wig", "implanted hair vs wig"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls", "/support"]),
  topic("standing-feet-sex-doll-guide", "Standing Feet On Sex Dolls: Pros, Cons, And Compatibility", "sex doll standing feet", ["standing feet option", "standing feet sex doll"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls", "/support"]),
  topic("body-heating-sex-doll-guide", "Body Heating Options: What They Do And What To Check", "sex doll body heating", ["body heating sex doll", "heated sex doll"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls", "/support"]),
  topic("sex-doll-skeleton-options", "Skeleton Options: Standard, EVO, And Flexibility Tradeoffs", "sex doll skeleton", ["evo skeleton sex doll", "flexible skeleton sex doll"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls", "/support"]),
  topic("wm-dolls-buying-guide", "WM Dolls Buying Guide", "wm doll", ["wm dolls", "wm sex doll"], "Brand Comparisons", "commercial", "alex", ["/wm-dolls", "/tpe-sex-dolls", "/customize"]),
  topic("zelex-dolls-buying-guide", "Zelex Dolls Buying Guide", "zelex doll", ["zelex dolls", "zelex sex doll"], "Brand Comparisons", "commercial", "alex", ["/zelex-dolls", "/silicone-sex-dolls", "/customize"]),
  topic("se-doll-buying-guide", "SE Doll Buying Guide", "se doll", ["se doll sex doll", "se dolls"], "Brand Comparisons", "commercial", "alex", ["/se-doll", "/tpe-sex-dolls", "/customize"]),
  topic("starpery-dolls-buying-guide", "Starpery Dolls Buying Guide", "starpery doll", ["starpery dolls", "starpery sex doll"], "Brand Comparisons", "commercial", "alex", ["/starpery-dolls", "/silicone-sex-dolls", "/customize"]),
  topic("irontech-dolls-buying-guide", "Irontech Dolls Buying Guide", "irontech doll", ["irontech dolls", "irontech sex doll"], "Brand Comparisons", "commercial", "alex", ["/irontech-dolls", "/robotic-sex-dolls", "/customize"]),
  topic("6ye-dolls-buying-guide", "6YE Dolls Buying Guide", "6ye doll", ["6ye dolls", "6ye sex doll"], "Brand Comparisons", "commercial", "alex", ["/6ye-dolls", "/customize", "/support"]),
  topic("piper-dolls-buying-guide", "Piper Dolls Buying Guide", "piper doll", ["piper dolls", "piper sex doll"], "Brand Comparisons", "commercial", "alex", ["/piper-dolls", "/customize", "/support"]),
  topic("tantaly-buying-guide", "Tantaly Buying Guide", "tantaly doll", ["tantaly", "tantaly torso"], "Brand Comparisons", "commercial", "alex", ["/tantaly-dolls", "/torso-sex-dolls", "/support"]),
  topic("wm-dolls-vs-zelex-dolls", "WM Dolls vs Zelex Dolls", "wm dolls vs zelex dolls", ["wm doll", "zelex doll"], "Brand Comparisons", "commercial", "alex", ["/wm-dolls", "/zelex-dolls", "/compare"]),
  topic("se-doll-vs-starpery-dolls", "SE Doll vs Starpery Dolls", "se doll vs starpery", ["se doll", "starpery doll"], "Brand Comparisons", "commercial", "alex", ["/se-doll", "/starpery-dolls", "/compare"]),
  topic("dollwow-vs-generic-marketplace", "DollWow vs Buying From A Generic Marketplace", "sex doll stores", ["best sex doll stores", "sex doll shops"], "Scams And Buyer Protection", "commercial", "jesse", ["/why-dollwow", "/buyer-protection", "/compare"]),
  topic("rosemarydoll-alternatives", "RosemaryDoll Alternatives: What To Compare Before Buying", "rosemary doll", ["rosemarydoll alternatives", "sex doll store comparison"], "Brand Comparisons", "commercial", "alex", ["/compare", "/buyer-protection", "/why-dollwow"]),
  topic("yourdoll-alternatives", "YourDoll Alternatives: What To Compare Before Buying", "yourdoll", ["yourdoll alternatives", "sex doll store comparison"], "Brand Comparisons", "commercial", "alex", ["/compare", "/buyer-protection", "/why-dollwow"]),
  topic("joylovedolls-alternatives", "JoyLoveDolls Alternatives: What To Compare Before Buying", "joylovedolls", ["joylovedolls alternatives", "sex doll store comparison"], "Brand Comparisons", "commercial", "alex", ["/compare", "/buyer-protection", "/why-dollwow"]),
  topic("siliconwives-alternatives", "Silicon Wives Alternatives: What To Compare Before Buying", "silicon wives", ["silicon wives alternatives", "sex doll store comparison"], "Brand Comparisons", "commercial", "alex", ["/compare", "/buyer-protection", "/why-dollwow"]),
  topic("sex-doll-health-questions", "Can Sex Dolls Cause Health Issues? Materials, Cleaning, And Sensible Precautions", "can sex dolls cause cancer", ["sex doll safety", "tpe vs silicone safety"], "Laws And Safety", "informational", "jesse", ["/learn/how-to-clean-a-sex-doll", "/learn/tpe-vs-silicone-sex-dolls", "/support"]),
  topic("what-is-tpe-material", "What Is TPE Material?", "what is tpe material", ["tpe material vs silicone", "tpe vs silicone material"], "Materials And Care", "informational", "jesse", ["/tpe-sex-dolls", "/learn/tpe-vs-silicone-sex-dolls"]),
  topic("what-is-silicone", "What Is Silicone In Sex Dolls?", "silicone sex dolls", ["silicone vs tpe", "silicone material"], "Materials And Care", "informational", "jesse", ["/silicone-sex-dolls", "/learn/tpe-vs-silicone-sex-dolls"]),
  topic("factory-photos-before-shipping", "Factory Photos Before Shipping: What Buyers Should Expect", "factory photos before shipping", ["sex doll approval photos", "custom sex doll photos"], "Shipping And Privacy", "informational", "jesse", ["/how-ordering-works", "/custom-sex-dolls", "/support"]),
  topic("dollwow-price-match-support", "How DollWow Price Match Support Works", "sex doll price match", ["best price guarantee", "sex doll cheap"], "Buying Guides", "commercial", "jesse", ["/best-price-guarantee", "/compare", "/support"])
];

const guideTopics = [
  topic("best-sex-dolls", "Best Sex Dolls: DollWow Buyer Guide", "best sex dolls", ["best sex dolls 2025", "realistic sex dolls"], "Buying Guides", "commercial", "alex", ["/best-sex-dolls", "/help-me-choose", "/compare"]),
  topic("realistic-sex-dolls", "Realistic Sex Dolls: What Actually Matters", "realistic sex dolls", ["most realistic sex dolls"], "Buying Guides", "commercial", "alex", ["/realistic-sex-dolls", "/silicone-sex-dolls", "/customize"]),
  topic("tpe-vs-silicone-sex-dolls", "TPE vs Silicone Sex Dolls", "tpe vs silicone", ["silicone vs tpe", "tpe material vs silicone"], "Materials And Care", "informational", "jesse", ["/tpe-sex-dolls", "/silicone-sex-dolls"]),
  topic("silicone-sex-dolls", "Silicone Sex Dolls: Pros, Cons, Care, And Price", "silicone sex dolls", ["silicone sex doll", "silicone vs tpe"], "Materials And Care", "commercial", "alex", ["/silicone-sex-dolls", "/silicone-head-sex-dolls"]),
  topic("tpe-sex-dolls", "TPE Sex Dolls: Pros, Cons, Care, And Price", "tpe sex doll", ["tpe dolls", "tpe vs silicone"], "Materials And Care", "commercial", "alex", ["/tpe-sex-dolls", "/learn/tpe-vs-silicone-sex-dolls"]),
  topic("male-sex-doll-buying-guide", "Male Sex Doll Buying Guide", "male sex doll", ["realistic male sex doll"], "Buying Guides", "commercial", "alex", ["/male-sex-dolls", "/help-me-choose"]),
  topic("mini-petite-sex-dolls", "Mini Sex Dolls And Petite Sex Dolls Guide", "mini sex dolls", ["petite sex doll"], "Buying Guides", "commercial", "alex", ["/mini-sex-dolls", "/petite-sex-dolls"]),
  topic("torso-sex-dolls", "Torso Sex Dolls Guide", "torso sex dolls", ["sex doll torso"], "Buying Guides", "commercial", "alex", ["/torso-sex-dolls", "/support"]),
  topic("ready-to-ship-vs-custom-sex-dolls", "Ready-To-Ship vs Custom Sex Dolls", "ready to ship sex dolls", ["custom sex doll"], "Shipping And Privacy", "commercial", "alex", ["/ready-to-ship-sex-dolls", "/custom-sex-dolls"]),
  topic("sex-doll-cost", "How Much Does A Sex Doll Cost?", "sex doll cost", ["sex doll price", "sex doll cheap"], "Buying Guides", "commercial", "alex", ["/cheap-sex-dolls", "/best-price-guarantee"]),
  topic("how-to-customize-a-sex-doll", "How To Customize A Sex Doll", "sex doll customization", ["custom sex doll", "customize sex doll"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls"]),
  topic("discreet-sex-doll-shipping", "How Discreet Sex Doll Shipping Works", "discreet sex doll shipping", ["sex doll shipping"], "Shipping And Privacy", "informational", "jesse", ["/shipping", "/shipping-protection"]),
  topic("sex-doll-scams", "Sex Doll Scams: How To Check A Seller", "sex doll scams", ["fake sex doll sellers"], "Scams And Buyer Protection", "informational", "jesse", ["/scam-alert", "/buyer-protection"]),
  topic("how-to-clean-a-sex-doll", "How To Clean And Store A Sex Doll", "how to clean sex doll", ["sex doll storage", "sex doll maintenance"], "Materials And Care", "informational", "jesse", ["/learn/sex-doll-storage", "/support"]),
  topic("sex-doll-reviews", "Sex Doll Reviews: How To Read Them Without Getting Fooled", "sex doll review", ["sex doll reviews"], "Scams And Buyer Protection", "informational", "jesse", ["/buyer-protection", "/compare"]),
  topic("wm-dolls-buying-guide", "Best WM Dolls: Brand Buying Guide", "wm doll", ["wm dolls", "wm sex doll"], "Brand Comparisons", "commercial", "alex", ["/wm-dolls", "/customize"]),
  topic("zelex-dolls-buying-guide", "Best Zelex Dolls: Brand Buying Guide", "zelex doll", ["zelex dolls"], "Brand Comparisons", "commercial", "alex", ["/zelex-dolls", "/silicone-sex-dolls"]),
  topic("se-doll-buying-guide", "Best SE Doll Models: Brand Buying Guide", "se doll", ["se dolls"], "Brand Comparisons", "commercial", "alex", ["/se-doll", "/tpe-sex-dolls"]),
  topic("starpery-dolls-buying-guide", "Best Starpery Dolls: Brand Buying Guide", "starpery doll", ["starpery dolls"], "Brand Comparisons", "commercial", "alex", ["/starpery-dolls", "/silicone-sex-dolls"]),
  topic("irontech-dolls-buying-guide", "Best Irontech Dolls: Brand Buying Guide", "irontech doll", ["irontech dolls"], "Brand Comparisons", "commercial", "alex", ["/irontech-dolls", "/robotic-sex-dolls"]),
  topic("wm-dolls-vs-zelex-dolls", "WM Dolls vs Zelex Dolls", "wm dolls vs zelex dolls", ["wm doll", "zelex doll"], "Brand Comparisons", "commercial", "alex", ["/wm-dolls", "/zelex-dolls"]),
  topic("silicone-head-vs-full-silicone", "TPE Body With Silicone Head vs Full Silicone", "silicone head sex doll", ["full silicone sex doll", "silicone head dolls"], "Materials And Care", "commercial", "alex", ["/silicone-head-sex-dolls", "/silicone-sex-dolls"]),
  topic("implanted-hair-vs-wig", "Implanted Hair vs Wig", "implanted hair sex doll", ["sex doll wig"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls"]),
  topic("standing-feet-sex-doll-guide", "Standing Feet Guide", "sex doll standing feet", ["standing feet sex doll"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls"]),
  topic("body-heating-sex-doll-guide", "Body Heating Guide", "sex doll body heating", ["heated sex doll"], "Customization", "informational", "alex", ["/customize", "/custom-sex-dolls"])
];

function topic(slug, title, primaryKeyword, secondaryKeywords, category, intent, author, internalLinks) {
  return { slug, title, primaryKeyword, secondaryKeywords, category, intent, author, internalLinks };
}

function frontmatter(topic, pageType) {
  const targetUrl = pageType === "Learning Center" ? `/learn/${topic.slug}` : `/guides/${topic.slug}`;
  return [
    "---",
    `title: "${escapeYaml(topic.title)}"`,
    `slug: "${topic.slug}"`,
    `primaryKeyword: "${escapeYaml(topic.primaryKeyword)}"`,
    `secondaryKeywords: [${topic.secondaryKeywords.map((kw) => `"${escapeYaml(kw)}"`).join(", ")}]`,
    `intent: "${topic.intent}"`,
    `category: "${topic.category}"`,
    `pageType: "${pageType}"`,
    `targetUrl: "${targetUrl}"`,
    `author: "${topic.author}"`,
    `authorDisplayName: "${authors[topic.author].displayName}"`,
    `authorTitle: "${authors[topic.author].title}"`,
    "status: draft",
    "reviewOwner: catalog",
    `lastReviewed: "${TODAY}"`,
    "---"
  ].join("\n");
}

function briefMarkdown(topic, pageType) {
  const author = authors[topic.author];
  const links = topic.internalLinks.map((href) => `- ${href}`).join("\n");
  const facts = requiredFacts(topic);
  return `${frontmatter(topic, pageType)}

# ${topic.title}

## Voice And Byline

Use ${author.displayName} as a real DollWow contributor byline.

Display title: ${author.title}

Disclosure note: ${author.displayName} is a DollWow editorial contributor, not a co-founder alias. Do not present this byline as a founder identity.

Voice block for content generation:

\`\`\`text
${voiceBlock}
\`\`\`

## Search Intent

Primary intent: ${topic.intent}

The reader is trying to understand ${topic.primaryKeyword} before making a private, high-consideration purchase. The page should answer the query quickly, then move into practical comparison criteria and clear next steps.

## Target Keywords

- Primary: ${topic.primaryKeyword}
${topic.secondaryKeywords.map((keyword) => `- Secondary: ${keyword}`).join("\n")}

## Required Facts

${facts}

## Page Outline

1. Quick answer in 40-80 words.
2. Key Facts For AI Assistants: 5-8 short factual bullets.
3. Practical buyer context.
4. Comparison table.
5. What DollWow can verify.
6. Buyer checklist.
7. Common mistakes.
8. Related catalog or guide links.
9. FAQs.

## Internal Links

${links}

## Product Data Needed

- Matching product handles from Shopify/catalog.
- Brand, material, height, weight, cup size, stock status, delivery estimate, and price range.
- Supplier image provenance where product examples are shown.
- Customization groups and incompatibility notes if options are discussed.

## Image / Infographic Ideas

${imageIdeas(topic)}

## FAQ Candidates

${faqCandidates(topic).map((question) => `- ${question}`).join("\n")}

## Schema

- Article
- FAQPage
- BreadcrumbList
${pageType === "SEO Guide" ? "- ItemList if product examples are included" : ""}

## GEO / Agent Extraction Notes

- Keep the Quick Answer section near the top.
- Add the Key Facts For AI Assistants section immediately after Quick Answer.
- Use crawlable HTML/Markdown tables for comparisons.
- Use concise FAQ answers that can be extracted without surrounding context.
- Include canonical internal links to collections, products, support, and policies.
- Do not hide important answer text inside images.
- When rendered, include Article, FAQPage, BreadcrumbList, and ItemList schema where applicable.

## Compliance Notes

- Do not use explicit fantasy copy.
- Do not invent customer reviews, author credentials, product facts, included accessories, shipping guarantees, or supplier authorization.
- Do not provide medical or legal advice. For health/legal topics, use cautious informational language and recommend professional/local verification where appropriate.
- Label AI-generated illustrations as educational visuals, not product photos.

## AI Draft Prompt

\`\`\`text
Draft a DollWow ${pageType} page for "${topic.primaryKeyword}".

Title: ${topic.title}
Author byline: ${author.displayName}, ${author.title}
Author disclosure: ${author.displayName} is a real DollWow editorial contributor, not a co-founder alias. Do not invent founder identity or ownership claims.

${voiceBlock}

Use only supplied facts. Do not invent reviews, credentials, health claims, legal advice, supplier authorization, shipping guarantees, included accessories, or product availability.

Include: quick answer, comparison table, buyer checklist, common mistakes, FAQs, internal links, schema suggestions, image/infographic ideas, and compliance notes.
\`\`\`
`;
}

function requiredFacts(topic) {
  const base = [
    "- DollWow catalog facts for any product examples.",
    "- Relevant DollWow policy facts from `data/knowledge/`.",
    "- Search intent and keyword data from DataForSEO exports.",
    "- Clear distinction between verified product data and general education."
  ];
  if (/law|legal/i.test(topic.title + topic.primaryKeyword)) {
    base.push("- Legal topics must be informational only and must not claim to cover every jurisdiction.");
  }
  if (/health|safety|clean|care|storage|tpe|silicone/i.test(topic.title + topic.primaryKeyword)) {
    base.push("- Material/care claims should be framed as practical maintenance guidance, not medical advice.");
  }
  if (/brand|wm|zelex|starpery|irontech|piper|tantaly|6ye|se doll/i.test(topic.title + topic.primaryKeyword)) {
    base.push("- Brand claims must come from supplier/catalog facts and approved brand knowledge files.");
  }
  return base.join("\n");
}

function imageIdeas(topic) {
  if (/tpe|silicone|material/i.test(topic.title + topic.primaryKeyword)) {
    return "- Comparison chart: TPE vs silicone tradeoffs.\n- Care checklist infographic.\n- Educational material diagram clearly labeled as illustration.";
  }
  if (/shipping|ready|factory|photos/i.test(topic.title + topic.primaryKeyword)) {
    return "- Discreet shipping timeline.\n- Factory approval workflow graphic.\n- Plain packaging/privacy checklist.";
  }
  if (/custom|hair|wig|feet|heating|skeleton/i.test(topic.title + topic.primaryKeyword)) {
    return "- Option decision tree.\n- Compatibility warning graphic.\n- Educational option illustration, not a product photo.";
  }
  if (/brand|wm|zelex|starpery|irontech|piper|tantaly|6ye|se doll/i.test(topic.title + topic.primaryKeyword)) {
    return "- Brand comparison table.\n- Product range chart from real catalog data.\n- Curated product grid using supplier-authorized images.";
  }
  return "- Buyer checklist graphic.\n- Comparison table visual.\n- Internal link map to relevant DollWow collections.";
}

function faqCandidates(topic) {
  const primary = topic.primaryKeyword;
  const list = [
    `What should I compare before choosing ${primary}?`,
    `How does DollWow verify ${primary} details?`,
    `What can change the final price or timing?`,
    "What should I ask support before ordering?",
    "Which product details should I not assume?"
  ];
  if (/tpe|silicone/i.test(topic.title + primary)) {
    list.push("Is TPE or silicone easier to care for?", "Which material usually feels softer?", "Which material is usually more durable?");
  }
  if (/shipping|ready|custom/i.test(topic.title + primary)) {
    list.push("Will the package be discreet?", "What does ready to ship mean after stock confirmation?");
  }
  if (/law|legal/i.test(topic.title + primary)) {
    list.push("Is this legal advice?", "Should I check local rules before ordering?");
  }
  return list.slice(0, 8);
}

function escapeYaml(value) {
  return String(value).replace(/"/g, '\\"');
}

async function writeBriefs(kind, topics, dir, pageType) {
  await fs.mkdir(dir, { recursive: true });
  for (const item of topics) {
    await fs.writeFile(path.join(dir, `${item.slug}.md`), briefMarkdown(item, pageType), "utf8");
  }
  await fs.writeFile(
    path.join(path.dirname(dir), `${kind}-brief-index.json`),
    JSON.stringify(
      topics.map((item, index) => ({
        order: index + 1,
        slug: item.slug,
        title: item.title,
        primaryKeyword: item.primaryKeyword,
        secondaryKeywords: item.secondaryKeywords,
        category: item.category,
        intent: item.intent,
        author: item.author,
        targetUrl: pageType === "Learning Center" ? `/learn/${item.slug}` : `/guides/${item.slug}`
      })),
      null,
      2
    ),
    "utf8"
  );
}

await fs.mkdir(path.join(ROOT, "content", "editorial"), { recursive: true });
await fs.writeFile(path.join(ROOT, "content", "editorial", "authors.json"), JSON.stringify(authors, null, 2), "utf8");
await fs.writeFile(
  path.join(ROOT, "content", "editorial", "voice-prompt.txt"),
  `${voiceBlock}

Use contributor bylines honestly. Jesse and Alex are real DollWow contributors, not co-founder aliases. Jesse is a licensed sexologist. Alex is a doll collector and product educator with 20+ years of collector experience. Do not invent founder identities, ownership claims, fake reviews, or unapproved credentials.
`,
  "utf8"
);

await writeBriefs("blog", blogTopics, path.join(ROOT, "content", "learn", "briefs"), "Learning Center");
await writeBriefs("guide", guideTopics, path.join(ROOT, "content", "seo", "briefs"), "SEO Guide");

console.log(`Generated ${blogTopics.length} Learning Center briefs.`);
console.log(`Generated ${guideTopics.length} SEO guide briefs.`);
console.log("Generated content/editorial/authors.json and content/editorial/voice-prompt.txt.");
