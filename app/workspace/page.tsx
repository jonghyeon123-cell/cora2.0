import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Exo_2 } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import faceImage from "../../face.svg";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: "700",
});

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF7EC" }}>
      <header
        className="flex items-center justify-between border-b px-6 py-6 md:px-12"
        style={{ borderColor: "#ededec" }}
      >
        <Link href="/" className="flex items-center gap-1">
          <Image
            src={faceImage}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <span
            className={`${exo2.className} text-2xl font-semibold tracking-tight`}
            style={{ color: "#A3040C" }}
          >
            CoRA
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <p className="text-sm text-neutral-500">{user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium tracking-widest text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#A3040C" }}
            >
              LOG OUT
            </button>
          </form>
        </div>
      </header>
    </main>
  );
}
