export default function ClinicalLoading() {
  return (
    <div className="min-h-[60vh] animate-pulse px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="h-48 rounded-3xl bg-slate-200/80 dark:bg-slate-800/80" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-40 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
          <div className="h-40 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-36 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
