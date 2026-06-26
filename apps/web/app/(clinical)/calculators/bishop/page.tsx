import { redirect } from "next/navigation";

export default function LegacyBishopRedirect() {
  redirect("/tools/calc/ob/bishop");
}
