import { MinimalistHero } from "@/components/ui/minimalist-hero";
import { createClient } from "@/lib/supabase/server";
import tigerImage from "../cora_tiger.png";
import faceImage from "../face.svg";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "ABOUT US", href: "#" },
];

export async function Hero() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MinimalistHero
      logoText="CoRA"
      logoImageSrc={faceImage}
      navLinks={navLinks}
      getStartedLink={user ? "/workspace" : "/auth"}
      imageSrc={tigerImage}
      imageAlt="CoRA tiger illustration"
    />
  );
}
