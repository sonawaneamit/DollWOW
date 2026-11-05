export const comparisonSlug = "powered-oral-features-comparison";

export function comparisonPreviewEnabled(environment: string | undefined, flag: string | undefined) {
  return (environment === "preview" || environment === "development") && flag === "1";
}

export const comparisonSources = [
  { id: "se-head", title: "SEDOLL: silicone head feature guide", url: "https://www.sedoll.com/silicone-doll-head-oral-heating-suction-sound-features-a-complete-guide/" },
  { id: "se-motion", title: "SEDOLL: motorized neck update", url: "https://www.sedoll.com/sex-doll-news-new-blowjob-sexbot-brings-more-realistic-oral-action/" },
  { id: "iron-head", title: "Irontech: ROS and ROS MAX heads", url: "https://de.irontechdoll.com/ros-silicone-head/" },
  { id: "iron-motion", title: "Irontech: oral movement", url: "https://www.irontechdoll.com/oral-sex-movement-2/" },
  { id: "iron-combined", title: "Irontech: combined motor functions", url: "https://www.irontechdoll.com/oral-sex-movement-with-electric-hip-and-waist-function/" }
] as const;

type SourceId = typeof comparisonSources[number]["id"];
export type FeatureComparison = {
  brand: string;
  names: string;
  mechanism: string;
  evidence: "Manufacturer documentation" | "Reported; exact configuration unconfirmed";
  check: string;
  sources: SourceId[];
};

export const featureComparisons: FeatureComparison[] = [
  { brand: "Irontech", names: "ROS Oral Sex Function; Oral Sex Movement", mechanism: "Head feature and body-driven movement are separate options.", evidence: "Manufacturer documentation", check: "ROS/ROS MAX head eligibility and body compatibility must be checked separately. The manufacturer's standalone and combined-function pages list different body exclusions; do not infer a universal fit list.", sources: ["iron-head", "iron-motion", "iron-combined"] },
  { brand: "SEDOLL", names: "Oral Suction-Moaning; Blowjob Sexbot", mechanism: "A head feature is distinct from the neck-mounted motor option.", evidence: "Manufacturer documentation", check: "The head guide describes silicone ROS heads. The motion update describes TPE/STPE bodies and a move from the older waist mechanism to the neck. Confirm the generation and exact body, not just the option name.", sources: ["se-head", "se-motion"] },
  { brand: "Top Fire", names: "Oral Suction; Tongue Licking; 3-in-1; Automatic Oral Motion", mechanism: "Research reports both head features and body motion, sold separately.", evidence: "Reported; exact configuration unconfirmed", check: "Power-source reports conflict. A 3-in-1 head does not establish that a body motor or hip movement is included. Ask for the exact fitted configuration.", sources: [] },
  { brand: "WM / WM SS", names: "Oral Sucking; Rock & Roll Tongue; Auto Blowjob Sex Robot", mechanism: "Research reports head modules and a separate movement option.", evidence: "Reported; exact configuration unconfirmed", check: "SS head features are not evidence of compatibility with every WM body. Prices, added weight, supported bodies and combination rules need confirmation.", sources: [] },
  { brand: "Top CY", names: "Auto Blow Job / Neck Move", mechanism: "Research describes a neck motor, not a powered head module.", evidence: "Reported; exact configuration unconfirmed", check: "Do not confuse its separate auto-sucking label with an oral feature. Confirm the exact body and heating restrictions.", sources: [] },
  { brand: "MD Doll", names: "Automatic Oral Sex", mechanism: "Research describes body-driven movement.", evidence: "Reported; exact configuration unconfirmed", check: "Confirm the fitted motor and controller for the particular model. No added-weight or option-price estimate is treated as a current quote.", sources: [] },
  { brand: "Jarliet", names: "Auto Blowjob / Auto-Oral", mechanism: "Research describes a body motor on selected builds.", evidence: "Reported; exact configuration unconfirmed", check: "Availability varies with body dimensions and construction. Do not infer powered mouth suction from the motion option.", sources: [] },
  { brand: "SY Doll", names: "Automatic Blowjob; oral auto-sucking", mechanism: "Research reports body movement; the separate head feature needs confirmation.", evidence: "Reported; exact configuration unconfirmed", check: "Confirm the head series, body and fitted equipment. Separate inventory rows for different motor options do not prove that one doll includes both.", sources: [] },
  { brand: "Galatea", names: "Rock-and-Roll Tongue; oral auto-sucking; oral heating", mechanism: "Research describes powered head features.", evidence: "Reported; exact configuration unconfirmed", check: "A powered head package does not establish body-driven movement. Confirm the exact package and supplied power equipment.", sources: [] },
  { brand: "AngelKiss", names: "Oral Sucking; Oral Heating", mechanism: "Research reports a head feature on selected silicone ROS heads.", evidence: "Reported; exact configuration unconfirmed", check: "Historical head references do not guarantee today's menu. Confirm current head eligibility and the equipment included.", sources: [] },
  { brand: "Firefly Diary", names: "Oral Sucking", mechanism: "Research reports a head feature on selected ROS heads.", evidence: "Reported; exact configuration unconfirmed", check: "Not every soft head is ROS. A separate automatic-suction body option is not evidence of an oral feature. Power, weight and current pricing remain unconfirmed.", sources: [] },
  { brand: "Yeloly", names: "3-in-1 oral function", mechanism: "Research reports a custom head package, including on torso builds.", evidence: "Reported; exact configuration unconfirmed", check: "Treat this as an optional configured package, not a standard inclusion. A collection mixing different suction functions is not product-level proof.", sources: [] }
];

export const comparisonFaqs = [
  { question: "Is ROS the same as a powered oral feature?", answer: "No. ROS describes a head design, often with a movable jaw. It does not by itself establish a motor, pump or powered movement. Check the exact listed option and head/body combination." },
  { question: "Are mouth features and automatic head movement the same thing?", answer: "No. A powered head feature and a body or neck motor are different systems. A listing may offer one, both, or neither; a shared marketing label is not proof of the equipment fitted." },
  { question: "Does WM's Blowjob Sucker mean an oral feature?", answer: "The research handoff identifies this confusing label as a vaginal suction option, not an oral feature. Similar auto-sucking labels from Top CY, Starpery and Fanreal must not be treated as oral capability without product-specific evidence." },
  { question: "Does a brand's feature guide prove a ready-to-ship doll includes it?", answer: "No. A factory customization option is not proof of installed warehouse equipment. Confirm the exact listing, fitted head and body functions, warehouse and current availability before ordering." },
  { question: "Can these options be added to any existing doll?", answer: "Do not assume so. Body motors and powered head equipment need a compatible factory configuration. Confirm any proposed retrofit in writing for the exact model before buying equipment." },
  { question: "What should I compare before choosing?", answer: "Compare the exact mechanism, head/body compatibility, supplied controller and power equipment, total configured weight, cleaning instructions and written after-sales terms. Do not substitute a general brand claim for the selected build." }
];

export function comparisonFaqSchema() {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: comparisonFaqs.map(faq => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
}

export const comparisonChecks = [
  "Exact body and head model, including generation and material",
  "Which powered system is fitted, and which options are separate",
  "Controller, power supply, cables and regional adapter included",
  "Actual configured weight, compatibility conflicts and delivery",
  "Model-specific cleaning instructions and written after-sales terms"
];
