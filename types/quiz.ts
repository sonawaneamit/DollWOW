export type QuizAnswers = {
  companionType: "female" | "male" | "any";
  budget: "under-1500" | "1500-2500" | "2500-4000" | "4000-plus";
  delivery: "fast" | "balanced" | "custom";
  material: "tpe" | "silicone" | "either";
  bodyType: "lighter" | "curvy" | "premium" | "unsure";
  sizeComfort: "easy" | "standard" | "large";
  storage: "limited" | "normal" | "dedicated";
  customNeeds: "ready" | "some-options" | "full-custom";
  experience: "first-time" | "collector";
};

export type QuizRecommendation = {
  productId: string;
  reason: string;
  badge: string;
};
