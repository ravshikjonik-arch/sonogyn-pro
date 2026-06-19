import Link from "next/link";

import { auth } from "@/auth";
import { signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Кабинет</h1>
      <p className="mt-2 text-slate-400">
        {session?.user?.name ?? session?.user?.email ?? session?.user?.id}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/billing" className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950">
          Оплата (ЮKassa)
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="rounded-xl border border-slate-600 px-5 py-3 text-sm">
            Выйти
          </button>
        </form>
      </div>
    </main>
  );
}
