export function SectionContent({ content }: { content: string | string[] }) {
  if (Array.isArray(content)) {
    return (
      <ul className="space-y-2">
        {content.map((item) => (
          <li key={item.slice(0, 48)} className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-medical-teal" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="leading-relaxed">{content}</p>;
}
