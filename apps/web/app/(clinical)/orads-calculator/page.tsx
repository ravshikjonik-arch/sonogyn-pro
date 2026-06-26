import { redirect } from "next/navigation";

/** Старый wizard с фото-карточками — перенаправление на O-RADS Pro (чипы). */
export default function OradsCalculatorLegacyRedirect() {
  redirect("/tools/calc/rads/o-rads");
}
