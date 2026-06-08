import { redirect } from "next/navigation";

/** Алиас главной социальной зоны — чат врачей и коллегиальные кейсы. */
export default function CommunityPage() {
  redirect("/cases");
}
