import Link from "next/link";
import Image from "next/image";
import ImageSlideshow from "./components/ImageSlideshow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bread Modular - Affordable Modular Synth Platform",
  description: "An open-source, affordable modular synthesizer platform using modern electronics and minimalistic design. Features USB-C power, MIDI, and more.",
  keywords: ["modular synth", "synthesizer", "DIY electronics", "open source hardware", "USB-C", "MIDI", "affordable synth"],
  openGraph: {
    title: "Bread Modular - Affordable Modular Synth Platform",
    description: "Open-source modular synthesizer platform with modern features and minimalistic design.",
    images: ["/images/home-slide/01.JPEG"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bread Modular - Affordable Modular Synth Platform",
    description: "Open-source modular synthesizer platform with modern features and minimalistic design.",
    images: ["/images/home-slide/01.JPEG"],
  },
};

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_20px] min-h-screen p-0 pt-10 sm:p-10 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-[1024px] w-full mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center w-full gap-8 sm:gap-0" role="banner">
          <Link href="/" className="text-lg font-medium" aria-label="Bread Modular Home">
            <Image 
              src="/images/bread-modular-logo.png"
              alt="Bread Modular Logo"
              width={250}
              height={67}
              className="object-contain w-auto h-auto"
            />
          </Link>
          <nav aria-label="Main navigation">
            <ul className="flex gap-8">
              <li><Link href="/modules" className="hover:opacity-70">MODULES</Link></li>
              <li><Link href="/docs" className="hover:opacity-70">DOCS</Link></li>
              <li><Link href="/contact" className="hover:opacity-70">CONTACT</Link></li>
            </ul>
          </nav>
        </header>
        <div className="w-full h-px bg-neutral-200 mt-8" role="separator"></div>
      </div>

      {/* Main Content */}
      <main className="flex flex-col gap-8 items-center max-w-[1024px] mx-auto w-full" role="main">
        <section aria-label="Product showcase slideshow" className="w-full">
          <ImageSlideshow />
        </section>
        <section aria-label="Hero section">
          <div className="space-y-5 mt-8 mb-16 text-center">
            <h1 className="text-3xl font-medium leading-[1.3] sm:leading-[1.3] sm:text-5xl">AN AFFORDABLE<br />MODULAR SYNTH PLATFORM</h1>
          </div>
        </section>
        <section id="key-features" aria-label="Key features" className="flex flex-col gap-16 w-full">
          <article className="flex flex-col gap-6 p-10 bg-neutral-50">
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-3xl mb-3"><span className="font-bold">Minimalistic</span> Design</h2>
                <p className="text-xl text-neutral-600">We use modern electronics with minimalistic design to keep the cost down.</p>
                <Link 
                  href="/how" 
                  className="inline-block text-sm underline decoration-1 hover:opacity-80 transition-opacity mt-2"
                  aria-label="Learn more about our minimalistic design"
                >
                  SEE HOW
                </Link>
              </div>
              <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
                <p className="text-sm text-neutral-400">Module Image</p>
              </div>
            </div>
          </article>

          <article className="flex flex-col gap-6 p-10 bg-neutral-50">
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-3xl mb-3"><span className="font-bold">Open Source</span> From Day One</h2>
                <p className="text-xl text-neutral-600">Everything is Open Source including schematics, PCB design & code.</p>
                <Link 
                  href="/how" 
                  className="inline-block text-sm underline decoration-1 hover:opacity-80 transition-opacity mt-2"
                  aria-label="Learn more about our open source policy"
                >
                  LEARN MORE
                </Link>
              </div>
              <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
                <p className="text-sm text-neutral-400">Circuit Image</p>
              </div>
            </div>
          </article>

          <article className="flex flex-col gap-6 p-10 bg-neutral-50">
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-3xl mb-3"><span className="font-bold">Modern</span> Capabitlies</h2>
                <p className="text-xl text-neutral-600">We use proven analog designs while leveraging modern features like<br/>Modular MIDI & USB-C Power.</p>
                <Link 
                  href="/how" 
                  className="inline-block text-sm underline decoration-1 hover:opacity-80 transition-opacity mt-2"
                  aria-label="Explore the modern capabilities of Bread Modular"
                >
                  EXPLORE FEATURES
                </Link>
              </div>
              <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
                <p className="text-sm text-neutral-400">Interface Image</p>
              </div>
            </div>
          </article>
        </section>

        {/* CTA Button */}
        <section aria-label="Call to action" className="mt-8 mb-16">
          <Link 
            href="/get-started" 
            className="inline-block bg-black text-white px-12 py-6 text-xl hover:opacity-90 transition-opacity"
            role="button"
            aria-label="Get started with Bread Modular"
          >
            GET STARTED NOW
          </Link>
        </section>

        {/* Social Links */}
        <section aria-label="Social media links" className="w-full max-w-xl mx-auto text-center">
          <div className="w-full h-px bg-neutral-200 mb-16" role="separator"></div>
          <h2 className="text-3xl sm:text-4xl mb-8">FIND US ON SOCIALS</h2>
          <nav aria-label="Social media navigation">
            <div className="flex flex-col gap-1">
              <Link href="https://instagram.com/breadmodular" className="hover:opacity-70" aria-label="Follow us on Instagram for updates">
                INSTAGRAM FOR UPDATES
              </Link>
              <Link href="https://youtube.com/breadmodular" className="hover:opacity-70" aria-label="Watch our tutorials on YouTube">
                YOUTUBE FOR TUTORIALS
              </Link>
              <Link href="https://discord.gg/breadmodular" className="hover:opacity-70" aria-label="Join our Discord community for discussions">
                DISCORD FOR DISCUSSIONS
              </Link>
            </div>
          </nav>
        </section>
      </main>
    </div>
  );
}
