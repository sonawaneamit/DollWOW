import Image from "next/image";
import React from "react";
import type { MarkdownSectionInsertion } from "@/components/MarkdownContent";

const mediaRoot = "/images/learn/irontech-features";
const sources = {
  standard: "https://www.irontechdoll.com/sex-doll-options-functions/",
  ros: "https://www.irontechdoll.com/ros-silicone-head/",
  evo: "https://www.irontechdoll.com/sex-doll-skeleton-evo-body-hand-toe-skeleton/"
};

function ManufacturerVideo({ name, label, caption, source }: {
  name: string; label: string; caption: string; source: string;
}) {
  return (
    <figure className="my-8">
      <video
        controls
        playsInline
        preload="none"
        poster={`${mediaRoot}/${name}-poster.webp`}
        aria-label={label}
        aria-describedby={`${name}-caption`}
        className="aspect-video w-full rounded-[6px] bg-black object-contain"
        width={960}
        height={540}
      >
        <source src={`${mediaRoot}/${name}.mp4`} type="video/mp4" />
        <a href={`${mediaRoot}/${name}.mp4`}>Open {label}</a>
      </video>
      <figcaption id={`${name}-caption`} className="mt-3 text-sm leading-6 text-text-dim">
        {caption} Silent demonstration. Media: Irontech. <a href={source} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">Manufacturer source</a>.
      </figcaption>
    </figure>
  );
}

export function featureGuideMedia(slug: string): MarkdownSectionInsertion[] {
  if (slug === "irontech-head-types-ros-max") return [
    {
      afterHeading: "Standard Silicone Heads", placement: "after-section",
      content: <ManufacturerVideo name="hard-soft" label="Irontech hard and soft silicone head comparison" source={sources.standard}
        caption="Irontech demonstrates how its hard and soft silicone heads respond to gentle pressure, then shows the eyes, makeup and mouth. These are material examples, not identified standard head codes." />
    },
    {
      afterHeading: "What ROS MAX Changes", placement: "after-section",
      content: <>
        <ManufacturerVideo name="ros-comparison" label="Irontech S1 ROS and S31 ROS MAX comparison" source={sources.ros}
          caption="S1 ROS is on the left and S31 ROS MAX is on the right in the opening comparison. Irontech then shows the ROS MAX mouth and eye area up close. The two examples have different face codes as well as different head versions." />
        <figure className="my-8">
          <Image src={`${mediaRoot}/s31-ros-max.webp`} alt="Irontech S31 ROS MAX head on a display stand with a blonde wig" width={1024} height={1024} sizes="(min-width: 768px) 28rem, 100vw" className="mx-auto h-auto w-full max-w-md rounded-[6px]" />
          <figcaption className="mt-3 text-sm leading-6 text-text-dim">S31 ROS MAX, shown in Irontech&apos;s styled catalog photo. Hair and makeup are part of this photographed look, not proof of what every order includes. Photo: Irontech. <a href={sources.ros} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">Manufacturer source</a>.</figcaption>
        </figure>
      </>
    }
  ];
  if (slug === "sex-doll-skeleton-options") return [{
    afterHeading: "EVO, EXP, And Other Advanced Names", placement: "after-section",
    content: <ManufacturerVideo name="evo-skeleton" label="Irontech EVO skeleton movement demonstration" source={sources.evo}
      caption="Irontech shows its exposed EVO frame, then demonstrates shoulder and torso movement. The uncovered mechanism helps explain the joints; it does not show the safe range of a finished doll's skin or include separate hand and toe upgrades." />
  }];
  return [];
}
