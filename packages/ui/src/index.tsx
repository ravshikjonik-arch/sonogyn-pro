import type { ReactNode } from "react";

export type { AuthProvider, AuthButtonsVariant } from "./auth/types";
export { AuthButtons } from "./auth/AuthButtons";

export type SectionHeadingProps = {
  /** Eyebrow / kicker line above the title */
  kicker?: string;
  title: string;
  description?: ReactNode;
};

/**
 * Lightweight heading block shared between web and native shells for consistent hierarchy.
 */
export function SectionHeading({ kicker, title, description }: SectionHeadingProps) {
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {kicker ? (
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {kicker}
        </span>
      ) : null}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{title}</h2>
      {description ? <div style={{ opacity: 0.85, fontSize: 14 }}>{description}</div> : null}
    </header>
  );
}
