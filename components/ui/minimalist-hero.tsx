import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: "700",
});

interface NavLink {
  label: string;
  href: string;
}

interface MinimalistHeroProps {
  logoText: string;
  logoImageSrc: string | StaticImageData;
  navLinks: NavLink[];
  getStartedLink: string;
  imageSrc: string | StaticImageData;
  imageAlt: string;
}

export function MinimalistHero({
  logoText,
  logoImageSrc,
  navLinks,
  getStartedLink,
  imageSrc,
  imageAlt,
}: MinimalistHeroProps) {
  return (
    <section
      className="relative flex min-h-screen flex-col text-neutral-900"
      style={{ backgroundColor: "#FFF7EC" }}
    >
      <div
        className="absolute left-0 right-0"
        style={{ top: "150px", height: "1px", backgroundColor: "#ededec" }}
      />

      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <span className="flex items-center gap-1">
          <Image
            src={logoImageSrc}
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 object-contain"
          />
          <span
            className={`${exo2.className} text-4xl font-semibold tracking-tight`}
            style={{ color: "#A3040C" }}
          >
            {logoText}
          </span>
        </span>
        <div className="flex items-center gap-8">
          <nav className="hidden gap-8 text-xs font-medium tracking-widest md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-opacity hover:opacity-60"
                style={{ color: "#A3040C" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={getStartedLink}
            className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium tracking-widest text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#A3040C" }}
          >
            GET STARTED
          </Link>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <div />

        <div className="relative min-h-[60vh] px-6 py-12 md:min-h-0 md:px-12">
          <div className="relative h-full w-full overflow-hidden rounded-2xl">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
