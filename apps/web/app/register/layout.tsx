import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Регистрация",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
