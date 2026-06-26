import { redirect } from "next/navigation";

export default function LegacyAppointmentCalculatorsRedirect() {
  redirect("/tools/calc/appointment");
}
