import Link from "next/link";

/** Query `role=` must be evaluated per request (CI auth e2e). */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ role?: string }> };

export default async function RolesDemoPage(props: Props) {
  const { role } = await props.searchParams;
  const isAdmin = role === "admin";

  return (
    <main className="mx-auto max-w-lg px-4 py-10" data-testid="roles-demo-page">
      <h1 className="text-xl font-bold">Проверка ролей (E2E demo)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Роль: <strong>{isAdmin ? "admin" : "doctor"}</strong>
      </p>
      <nav className="mt-6 space-y-2">
        <Link href="/app" data-testid="nav-app" className="block text-blue-600">
          Рабочий стол
        </Link>
        {isAdmin ? (
          <Link href="/admin" data-testid="nav-admin" className="block text-blue-600">
            Admin
          </Link>
        ) : null}
      </nav>
    </main>
  );
}
