import Link from "next/link";
import type { ReactNode } from "react";

export function MarkdownContent({ markdown }: { markdown: string }) {
  return <div className="learn-article-body">{renderBlocks(markdown)}</div>;
}

function renderBlocks(markdown: string) {
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
      blocks.push(<h2 key={blocks.length}>{line.replace(/^##\s+/, "")}</h2>);
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(<h3 key={blocks.length}>{line.replace(/^###\s+/, "")}</h3>);
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

    const paragraph = [];
    while (lines[index]?.trim() && !/^(#{2,3}\s+|\||-\s+)/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={blocks.length}>{renderInline(paragraph.join(" "))}</p>);
  }

  return blocks;
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
