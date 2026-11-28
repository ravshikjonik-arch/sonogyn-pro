type BadgeProps = {
  /** Например: «Hadlock et al. (1985)» */
  title: string;
  /** Например: «J Pediatr 107:589–596 · формулы EFW» */
  reference: string;
  /** Например: «ACR» или «IOTA» */
  organization?: string;
  /** Например: «Сверено 25.11.2026 · юнит-тесты ✓» */
  verified?: string;
};

/**
 * Компактная карточка источника метода калькулятора.
 * Образец — SourceCard (medical-knowledge), урезанный до 3–4 строк для страницы калькулятора.
 * Доверие: врач видит, чей метод и что он верифицирован тестами.
 */
export function CalculatorSourceBadge({ title, reference, organization, verified }: BadgeProps) {
  return (
    <aside className="mt-4 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-3 text-xs">
      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
        Источник метода
      </p>
      <p className="mt-1 font-semibold text-[var(--clinical-foreground)]">
        {title}
        {organization ? <span className="ml-2 text-[var(--clinical-foreground-muted)]">· {organization}</span> : null}
      </p>
      <p className="mt-0.5 text-[var(--clinical-foreground-muted)]">{reference}</p>
      {verified ? <p className="mt-1 text-[var(--clinical-foreground-muted)]">{verified}</p> : null}
    </aside>
  );
}
