import type { QuizAnswers } from "@/types/quiz";

export const defaultQuizAnswers: QuizAnswers = {
  companionType: "female",
  budget: "1500-2500",
  delivery: "balanced",
  material: "either",
  bodyType: "unsure",
  sizeComfort: "standard",
  storage: "normal",
  customNeeds: "some-options",
  experience: "first-time"
};

const companionTypes = new Set<QuizAnswers["companionType"]>(["female", "male", "any"]);
const budgets = new Set<QuizAnswers["budget"]>(["under-1500", "1500-2500", "2500-4000", "4000-plus"]);
const deliveries = new Set<QuizAnswers["delivery"]>(["fast", "balanced", "custom"]);
const materials = new Set<QuizAnswers["material"]>(["tpe", "silicone", "either"]);
const bodyTypes = new Set<QuizAnswers["bodyType"]>(["lighter", "curvy", "premium", "unsure"]);
const sizeComforts = new Set<QuizAnswers["sizeComfort"]>(["easy", "standard", "large"]);
const storageOptions = new Set<QuizAnswers["storage"]>(["limited", "normal", "dedicated"]);
const customNeeds = new Set<QuizAnswers["customNeeds"]>(["ready", "some-options", "full-custom"]);
const experiences = new Set<QuizAnswers["experience"]>(["first-time", "collector"]);

export function quizAnswersFromParams(params: Record<string, string | undefined>): QuizAnswers {
  return {
    companionType: companionTypes.has(params.companionType as QuizAnswers["companionType"])
      ? (params.companionType as QuizAnswers["companionType"])
      : defaultQuizAnswers.companionType,
    budget: budgets.has(params.budget as QuizAnswers["budget"]) ? (params.budget as QuizAnswers["budget"]) : defaultQuizAnswers.budget,
    delivery: deliveries.has(params.delivery as QuizAnswers["delivery"])
      ? (params.delivery as QuizAnswers["delivery"])
      : defaultQuizAnswers.delivery,
    material: materials.has(params.material as QuizAnswers["material"])
      ? (params.material as QuizAnswers["material"])
      : defaultQuizAnswers.material,
    bodyType: bodyTypes.has(params.bodyType as QuizAnswers["bodyType"])
      ? (params.bodyType as QuizAnswers["bodyType"])
      : defaultQuizAnswers.bodyType,
    sizeComfort: sizeComforts.has(params.sizeComfort as QuizAnswers["sizeComfort"])
      ? (params.sizeComfort as QuizAnswers["sizeComfort"])
      : defaultQuizAnswers.sizeComfort,
    storage: storageOptions.has(params.storage as QuizAnswers["storage"])
      ? (params.storage as QuizAnswers["storage"])
      : defaultQuizAnswers.storage,
    customNeeds: customNeeds.has(params.customNeeds as QuizAnswers["customNeeds"])
      ? (params.customNeeds as QuizAnswers["customNeeds"])
      : defaultQuizAnswers.customNeeds,
    experience: experiences.has(params.experience as QuizAnswers["experience"])
      ? (params.experience as QuizAnswers["experience"])
      : defaultQuizAnswers.experience
  };
}

export function quizAnswersToSearchParams(answers: QuizAnswers) {
  const params = new URLSearchParams();
  Object.entries(answers).forEach(([key, value]) => params.set(key, value));
  return params;
}

export function quizAnswerSummary(answers: QuizAnswers) {
  const companionTypeLabels: Record<QuizAnswers["companionType"], string> = {
    female: "Female dolls",
    male: "Male dolls",
    any: "Female or male dolls"
  };
  const budgetLabels: Record<QuizAnswers["budget"], string> = {
    "under-1500": "Under $1,500",
    "1500-2500": "$1,500 to $2,500",
    "2500-4000": "$2,500 to $4,000",
    "4000-plus": "$4,000+"
  };
  const deliveryLabels: Record<QuizAnswers["delivery"], string> = {
    fast: "Fast shipping",
    balanced: "Flexible timing",
    custom: "Custom order is okay"
  };
  const materialLabels: Record<QuizAnswers["material"], string> = {
    tpe: "TPE",
    silicone: "Silicone",
    either: "No material preference"
  };
  const sizeLabels: Record<QuizAnswers["sizeComfort"], string> = {
    easy: "Easier to move",
    standard: "Standard size and weight",
    large: "Larger dolls are okay"
  };
  const customLabels: Record<QuizAnswers["customNeeds"], string> = {
    ready: "Ready-to-ship first",
    "some-options": "Some customization",
    "full-custom": "Full custom is okay"
  };

  return [
    { label: "Dolls", value: companionTypeLabels[answers.companionType] },
    { label: "Budget", value: budgetLabels[answers.budget] },
    { label: "Timing", value: deliveryLabels[answers.delivery] },
    { label: "Material", value: materialLabels[answers.material] },
    { label: "Size", value: sizeLabels[answers.sizeComfort] },
    { label: "Options", value: customLabels[answers.customNeeds] }
  ];
}
