import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollectionDisclosure({ id, title, eyebrow, children }: { id: string; title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <details className="collection-disclosure">
      <summary>
        <h2 id={id}>
          <span>
            {eyebrow ? <span className="block text-sm font-normal text-gold-300">{eyebrow}</span> : null}
            <span>{title}</span>
          </span>
          <ChevronDown aria-hidden="true" className="collection-disclosure__chevron" />
        </h2>
      </summary>
      <div className="collection-disclosure__content">{children}</div>
    </details>
  );
}
