"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { QuizAnswers } from "@/types/quiz";
import { defaultQuizAnswers } from "@/lib/quiz/answers";
import { GoldButton } from "./GoldButton";

const questions: Array<{
  key: keyof QuizAnswers;
  label: string;
  helper: string;
  options: Array<{ value: string; label: string; hint?: string }>;
}> = [
  { key: "companionType", label: "Who are you shopping for?", helper: "This keeps male and female dolls from mixing in your shortlist.", options: [
    { value: "female", label: "Female dolls", hint: "Most common choice" },
    { value: "male", label: "Male dolls", hint: "Show male-body options first" },
    { value: "any", label: "Open to either", hint: "Keep the search broad" }
  ] },
  { key: "budget", label: "Budget", helper: "Use the range you would actually be comfortable checking out with.", options: [
    { value: "under-1500", label: "Under $1,500", hint: "Value-focused" },
    { value: "1500-2500", label: "$1,500 to $2,500", hint: "Most common range" },
    { value: "2500-4000", label: "$2,500 to $4,000", hint: "More premium builds" },
    { value: "4000-plus", label: "$4,000+", hint: "High-end options" }
  ] },
  { key: "delivery", label: "Timing", helper: "Ready-to-ship dolls move faster; custom orders give you more control.", options: [
    { value: "fast", label: "As soon as possible", hint: "Prioritize warehouse dolls" },
    { value: "balanced", label: "Balanced", hint: "Good mix of stock and custom" },
    { value: "custom", label: "Custom is fine", hint: "3-5 week custom timing is okay" }
  ] },
  { key: "material", label: "Material", helper: "Pick a preference if you already know it. Otherwise we will keep both.", options: [
    { value: "tpe", label: "TPE", hint: "Softer, often lower price" },
    { value: "silicone", label: "Silicone", hint: "Premium finish and durability" },
    { value: "either", label: "Either", hint: "Show both" }
  ] },
  { key: "bodyType", label: "Build preference", helper: "This is a soft preference, not a strict filter.", options: [
    { value: "lighter", label: "Lighter/easier", hint: "Less difficult to move" },
    { value: "curvy", label: "Curvy", hint: "Fuller proportions" },
    { value: "premium", label: "Premium feel", hint: "Higher-end finish" },
    { value: "unsure", label: "Not sure", hint: "Let DollWow suggest" }
  ] },
  { key: "sizeComfort", label: "Handling comfort", helper: "Weight matters for moving, cleaning, storing, and dressing.", options: [
    { value: "easy", label: "Easy to move", hint: "Prioritize lighter dolls" },
    { value: "standard", label: "Standard", hint: "No strong limit" },
    { value: "large", label: "Larger is okay", hint: "Size matters more than weight" }
  ] },
  { key: "storage", label: "Storage", helper: "This helps avoid recommending something too large for your setup.", options: [
    { value: "limited", label: "Limited space", hint: "Smaller/lighter is safer" },
    { value: "normal", label: "Normal space", hint: "Most dolls can work" },
    { value: "dedicated", label: "Dedicated space", hint: "Larger builds are okay" }
  ] },
  { key: "customNeeds", label: "Customization", helper: "Choose how much you want to personalize before checkout.", options: [
    { value: "ready", label: "Ready-to-ship", hint: "Fewer changes, faster shipping" },
    { value: "some-options", label: "Some options", hint: "A little personalization" },
    { value: "full-custom", label: "Full custom", hint: "More control over the build" }
  ] },
  { key: "experience", label: "Buying experience", helper: "First-time buyers usually benefit from simpler handling and clearer timing.", options: [
    { value: "first-time", label: "First time", hint: "Keep recommendations practical" },
    { value: "collector", label: "Collector", hint: "Show more specialized options" }
  ] }
];

export function HelpMeChooseQuiz({ initialAnswers }: { initialAnswers?: QuizAnswers }) {
  const [answers, setAnswers] = useState<QuizAnswers>({ ...defaultQuizAnswers, ...initialAnswers });

  return (
    <form action="/help-me-choose/results" method="get" className="space-y-5">
      {questions.map((question, index) => (
        <fieldset key={question.key} className="border border-gold-500/14 bg-ink-800/70 p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-gold-300">
            {index + 1}. {question.label}
          </legend>
          <p className="mt-1 text-sm leading-6 text-ivory-500">{question.helper}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                  className={`block min-h-[86px] border px-4 py-3 text-sm transition ${
                    answers[question.key] === option.value
                      ? "border-gold-300 bg-gold-400 text-ink-950 shadow-[0_0_32px_rgba(224,170,112,0.16)]"
                      : "border-gold-500/14 bg-ink-950/45 text-ivory-300 hover:border-gold-300/40"
                  }`}
                >
                  <strong className="block text-base">{option.label}</strong>
                  {option.hint ? <span className="mt-1 block text-xs opacity-75">{option.hint}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <GoldButton className="w-full sm:w-auto">
        <ArrowRight className="h-4 w-4" />
        Show recommendations
      </GoldButton>
    </form>
  );
}
