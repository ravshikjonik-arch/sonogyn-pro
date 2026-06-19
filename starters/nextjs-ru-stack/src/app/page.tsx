import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold">Next.js RU Stack</h1>
      <p className="text-slate-400">
        Шаблон для РФ: NextAuth, sms.ru, ЮKassa, Telegram, PostgreSQL (Prisma).
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold"
        >
          Регистрация
        </Link>
      </div>
    </main>
  );
}
