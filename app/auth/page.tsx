import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthView } from "@/components/auth-view";

export default async function AuthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/workspace");
  }

  return (
    <main>
      <AuthView />
    </main>
  );
}
