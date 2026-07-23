import { MinimalistHero } from "@/components/ui/minimalist-hero";
import tigerImage from "../cora_tiger.png";
import faceImage from "../face.svg";

const navLinks = [
  { label: "HOME", href: "#" },
  { label: "ABOUT US", href: "#" },
];

export function Hero() {
  return (
    <MinimalistHero
      logoText="CoRA"
      logoImageSrc={faceImage}
      navLinks={navLinks}
      getStartedLink="#"
      imageSrc={tigerImage}
      imageAlt="CoRA tiger illustration"
    />
  );
}
