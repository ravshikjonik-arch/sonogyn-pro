import { redirect } from "next/navigation";
export default function LegacyConsensusRedirect() {
  redirect("/tools/refs/consensus");
}
