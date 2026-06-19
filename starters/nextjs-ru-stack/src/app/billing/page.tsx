"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function BillingForm() {
  const searchParams = useSearchParams();
  const returned = searchParams.get("status") === "return";
  const [amount, setAmount] = useState("990");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/yookassa/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountRub: Number(amount), description: "Подписка PRO" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "payment_failed");
        return;
      }
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link href="/dashboard" className="text-sm text-sky-400 underline">
        ← Кабинет
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Оплата (ЮKassa)</h1>
      {returned ? (
        <p className="mt-2 rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Вы вернулись с платёжной страницы. Статус обновится после webhook.
        </p>
      ) : null}

      <label className="mt-6 block text-sm text-slate-400">Сумма, ₽</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
        min={1}
      />
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-sky-500 py-3 font-semibold text-slate-950"
      >
        {loading ? "…" : "Перейти к оплате"}
      </button>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-400">Загрузка…</p>}>
      <BillingForm />
    </Suspense>
  );
}
