import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupView } from "@/components/signup-view";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/workspace");
  }

  return (
    <main>
      <SignupView />
    </main>
  );
}
