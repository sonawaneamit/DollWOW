import { HelpMeChooseQuiz } from "@/components/HelpMeChooseQuiz";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";
import { quizAnswersFromParams } from "@/lib/quiz/answers";
import { BadgeCheck, Clock, Ruler, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Help Me Choose a Sex Doll",
  description: "Find realistic sex dolls that fit your preferred size, material, budget, delivery timing, and customization needs with the DollWow guided quiz."
};

const quickSignals = [
  { title: "Size and weight", copy: "We factor in height, weight, and storage comfort.", icon: Ruler },
  { title: "Timing", copy: "Ready-to-ship and custom orders have different timing.", icon: Clock },
  { title: "Material", copy: "TPE, silicone, and silicone-head builds are sorted clearly.", icon: BadgeCheck },
  { title: "Private support", copy: "You can ask our team before you buy.", icon: ShieldCheck }
];

export default async function HelpMeChoosePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const initialAnswers = quizAnswersFromParams(await searchParams);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm text-accent">Help Me Choose</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-semibold leading-tight text-text sm:text-5xl">
          Find a practical shortlist without guessing.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-dim">
          Answer a few simple questions and we’ll create a shortlist based on your budget, preferred size, material,
          delivery timing, and customization needs. You can change any answer before viewing your matches.
        </p>
      </div>

      <div className="mt-8">
        <InfoVisualPanel
          seed="help-me-choose"
          eyebrow="Browse by fit"
          title="Start with a few real catalog examples."
          copy="The quiz narrows the catalog by size, timing, material, budget, and customization instead of making you scroll everything."
          cta={{ label: "Browse all dolls", href: "/shop/sex-dolls" }}
          compact
        />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-card">
        <p className="text-sm font-semibold text-accent">What it checks</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickSignals.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3 rounded-sm bg-surface-tint p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <strong className="text-sm text-text">{item.title}</strong>
                  <p className="mt-1 text-sm leading-5 text-text-dim">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-8">
        <HelpMeChooseQuiz initialAnswers={initialAnswers} />
      </div>
    </section>
  );
}
