export default function NosologyDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6 lg:px-8">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-[var(--clinical-muted)]" />
      <div className="h-64 animate-pulse rounded-xl bg-[var(--clinical-muted)]" />
      <p className="text-center text-sm text-[var(--clinical-foreground-muted)]">Загрузка нозологии…</p>
    </div>
  );
}
