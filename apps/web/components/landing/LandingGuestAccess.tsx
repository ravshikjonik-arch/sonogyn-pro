import { Check, Lock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { GUEST_ACCESS_TIERS } from "./data";

export function LandingGuestAccess() {
  return (
    <section id="guest" className="scroll-mt-24">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
          Гостевой визит
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
          Что доступно сейчас
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Не все разделы работают без входа — это демо-витрина. Кабинет и платные функции открываются после
          авторизации и оплаты PRO.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {GUEST_ACCESS_TIERS.map((tier) => (
          <Card key={tier.title} className="border-slate-200/80 bg-white/90 dark:bg-[var(--clinical-card)]">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{tier.title}</CardTitle>
                <Badge variant="secondary">{tier.badge}</Badge>
              </div>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tier.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex items-start gap-2 text-sm text-[var(--clinical-foreground-muted)] transition hover:text-[var(--clinical-primary-deep)]"
                    >
                      {item.locked ? (
                        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      )}
                      <span>
                        <span className="font-medium text-slate-900 group-hover:text-[var(--clinical-primary-deep)] dark:text-white">
                          {item.label}
                        </span>
                        {item.note ? (
                          <span className="ml-1 text-xs text-slate-500">· {item.note}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
