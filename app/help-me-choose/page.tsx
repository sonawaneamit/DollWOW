import { HelpMeChooseQuiz } from "@/components/HelpMeChooseQuiz";
import { quizAnswersFromParams } from "@/lib/quiz/answers";
import { BadgeCheck, Clock, Ruler, ShieldCheck } from "lucide-react";

export const metadata = { title: "Help Me Choose" };

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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Help Me Choose</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">
            Find a practical shortlist without guessing.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ivory-400">
            Answer a few buying questions and DollWow will suggest dolls to review first. No awkward personal questions,
            no fake “perfect match,” just useful filters for budget, size, material, timing, and customization.
          </p>
        </div>
        <aside className="border border-gold-500/14 bg-ink-800/72 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">What it checks</p>
          <div className="mt-4 grid gap-3">
            {quickSignals.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 border border-gold-500/10 bg-[#120907]/60 p-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />
                  <div>
                    <strong className="text-sm text-ivory-100">{item.title}</strong>
                    <p className="mt-1 text-xs leading-5 text-ivory-500">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
      <div className="mt-8">
        <HelpMeChooseQuiz initialAnswers={initialAnswers} />
      </div>
    </section>
  );
}
