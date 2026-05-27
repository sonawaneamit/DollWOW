"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { QuizAnswers } from "@/types/quiz";
import { GoldButton } from "./GoldButton";

const questions: Array<{
  key: keyof QuizAnswers;
  label: string;
  options: Array<{ value: string; label: string }>;
}> = [
  { key: "budget", label: "Budget", options: [
    { value: "under-1500", label: "Under $1,500" },
    { value: "1500-2500", label: "$1,500 to $2,500" },
    { value: "2500-4000", label: "$2,500 to $4,000" },
    { value: "4000-plus", label: "$4,000+" }
  ] },
  { key: "delivery", label: "Delivery timing", options: [
    { value: "fast", label: "Fast delivery" },
    { value: "balanced", label: "Balanced" },
    { value: "custom", label: "Custom is fine" }
  ] },
  { key: "material", label: "Material", options: [
    { value: "tpe", label: "TPE" },
    { value: "silicone", label: "Silicone" },
    { value: "either", label: "Either" }
  ] },
  { key: "bodyType", label: "Body preference", options: [
    { value: "lighter", label: "Lighter/easier" },
    { value: "curvy", label: "Curvy" },
    { value: "premium", label: "Premium feel" },
    { value: "unsure", label: "Not sure" }
  ] },
  { key: "sizeComfort", label: "Handling comfort", options: [
    { value: "easy", label: "Easy to move" },
    { value: "standard", label: "Standard" },
    { value: "large", label: "Larger is okay" }
  ] },
  { key: "storage", label: "Storage space", options: [
    { value: "limited", label: "Limited" },
    { value: "normal", label: "Normal" },
    { value: "dedicated", label: "Dedicated space" }
  ] },
  { key: "customNeeds", label: "Custom choices", options: [
    { value: "ready", label: "Ready-to-ship" },
    { value: "some-options", label: "Some options" },
    { value: "full-custom", label: "Full custom" }
  ] },
  { key: "experience", label: "Experience", options: [
    { value: "first-time", label: "First time" },
    { value: "collector", label: "Collector" }
  ] }
];

const defaults: QuizAnswers = {
  budget: "1500-2500",
  delivery: "balanced",
  material: "either",
  bodyType: "unsure",
  sizeComfort: "standard",
  storage: "normal",
  customNeeds: "some-options",
  experience: "first-time"
};

export function HelpMeChooseQuiz() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>(defaults);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers })
    });
    const payload = await response.json();
    setLoading(false);
    router.push(`/help-me-choose/results?ids=${encodeURIComponent(payload.productIds.join(","))}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {questions.map((question) => (
        <fieldset key={question.key} className="rounded-[18px] border border-gold-500/14 bg-ink-800/70 p-4">
          <legend className="px-1 text-sm font-semibold text-gold-300">{question.label}</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {question.options.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name={question.key}
                  value={option.value}
                  checked={answers[question.key] === option.value}
                  onChange={() => setAnswers((current) => ({ ...current, [question.key]: option.value }))}
                  className="sr-only"
                />
                <span
                  className={`block rounded-[14px] border px-4 py-3 text-sm ${
                    answers[question.key] === option.value
                      ? "border-gold-300 bg-gold-400 text-ink-950"
                      : "border-gold-500/14 bg-ink-950/45 text-ivory-300"
                  }`}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <GoldButton className="w-full sm:w-auto" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Show recommendations
      </GoldButton>
    </form>
  );
}
