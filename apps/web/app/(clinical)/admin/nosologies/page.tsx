import { redirect } from "next/navigation";

import { NosologyAdminClient } from "@/components/nosology/NosologyAdminClient";
import { createClient } from "@/utils/supabase/server";

type Props = { searchParams: Promise<{ edit?: string }> };

export default async function AdminNosologiesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/nosologies");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/app");
  }

  const { edit } = await searchParams;
  return <NosologyAdminClient initialEditId={edit ?? null} />;
}
