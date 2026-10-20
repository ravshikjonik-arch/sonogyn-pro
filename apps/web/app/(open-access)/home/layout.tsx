import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Минимум meta — первый HTML на sonogyn-pro.ru должен быть < ~16KB (лимит прокси). */
export const metadata: Metadata = {
  title: "SonoGyn Pro",
  description: "Клинический кабинет SonoGyn Pro",
};

export default function OpenAccessHomeLayout({ children }: { children: ReactNode }) {
  return children;
}
