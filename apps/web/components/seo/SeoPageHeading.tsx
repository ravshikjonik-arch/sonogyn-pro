/** Server-rendered page H1 for client-only calculator flows; visible to crawlers and screen readers. */
export function SeoPageHeading({ children }: { children: string }) {
  return <h1 className="sr-only">{children}</h1>;
}
