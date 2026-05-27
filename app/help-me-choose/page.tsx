import { HelpMeChooseQuiz } from "@/components/HelpMeChooseQuiz";

export const metadata = { title: "Help Me Choose" };

export default function HelpMeChoosePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Help Me Choose</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">A short quiz for practical recommendations</h1>
      <p className="mt-3 max-w-3xl text-ivory-400">No sensitive questions. Just budget, delivery timing, material, size, weight, storage, and customization needs.</p>
      <div className="mt-8">
        <HelpMeChooseQuiz />
      </div>
    </section>
  );
}
