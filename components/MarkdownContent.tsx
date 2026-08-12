import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type MarkdownSectionVisual = {
  afterHeading: string;
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
};

export type MarkdownSectionInsertion = {
  afterHeading: string;
  content: ReactNode;
};

export function MarkdownContent({
  markdown,
  sectionVisuals = [],
  sectionInsertions = []
}: {
  markdown: string;
  sectionVisuals?: MarkdownSectionVisual[];
  sectionInsertions?: MarkdownSectionInsertion[];
}) {
  return <div className="learn-article-body">{renderBlocks(markdown, sectionVisuals, sectionInsertions)}</div>;
}

function renderBlocks(markdown: string, sectionVisuals: MarkdownSectionVisual[], sectionInsertions: MarkdownSectionInsertion[]) {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      const heading = line.replace(/^##\s+/, "");
      blocks.push(<h2 id={headingId(heading)} key={blocks.length}>{heading}</h2>);
      const visual = sectionVisuals.find((item) => item.afterHeading === heading);
      if (visual) blocks.push(<SectionVisual key={`${heading}-visual`} visual={visual} />);
      const insertion = sectionInsertions.find((item) => item.afterHeading === heading);
      if (insertion) blocks.push(<div key={`${heading}-insertion`}>{insertion.content}</div>);
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      const heading = line.replace(/^###\s+/, "");
      blocks.push(<h3 id={headingId(heading)} key={blocks.length}>{heading}</h3>);
      index += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (lines[index]?.startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      blocks.push(<Table key={blocks.length} lines={tableLines} />);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (/^-\s+/.test(lines[index] || "")) {
        items.push(lines[index].replace(/^-\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={blocks.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (/^\d+\.\s+/.test(lines[index] || "")) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={blocks.length}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph = [];
    while (lines[index]?.trim() && !/^(#{2,3}\s+|\||-\s+|\d+\.\s+)/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={blocks.length}>{renderInline(paragraph.join(" "))}</p>);
  }

  return blocks;
}

function SectionVisual({ visual }: { visual: MarkdownSectionVisual }) {
  return (
    <figure className="my-8 overflow-hidden rounded-[8px] border border-border bg-surface shadow-card md:mx-auto md:max-w-[36rem]">
      <Image
        src={visual.src}
        alt={visual.alt}
        width={visual.width ?? 1200}
        height={visual.height ?? 1600}
        className="h-auto w-full"
        sizes="(min-width: 768px) 48rem, 100vw"
      />
      <figcaption className="border-t border-border bg-surface-elevated px-4 py-3 text-sm leading-5 text-text-dim">
        {visual.caption}
      </figcaption>
    </figure>
  );
}

export function headingId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Table({ lines }: { lines: string[] }) {
  const rows = lines
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    )
    .filter((cells) => cells.length && !cells.every((cell) => /^-+$/.test(cell.replace(/\s/g, ""))));
  const [head, ...body] = rows;
  if (!head) return null;

  return (
    <div className="learn-table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell}>{renderInline(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>{renderInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(value: string) {
  const parts = value.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/") && !href.startsWith("//")) {
        return (
          <Link key={`${href}-${index}`} href={href} className="font-semibold text-gold-400 underline underline-offset-4 transition hover:text-gold-300">
            {label}
          </Link>
        );
      }
      if (/^https?:\/\//.test(href)) {
        return (
          <a
            key={`${href}-${index}`}
            href={href}
            className="font-semibold text-gold-400 underline underline-offset-4 transition hover:text-gold-300"
            target="_blank"
            rel="noreferrer"
          >
            {label}
          </a>
        );
      }
      return label;
    }
    return part;
  });
}
