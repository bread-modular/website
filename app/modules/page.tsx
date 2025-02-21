import Link from "next/link";
import Image from "next/image";
import { modules } from "../config/modules";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modules - Bread Modular",
  description: "Explore our range of affordable, open-source modular synthesizer modules.",
};

export default function ModulesPage() {
  const featuredModule = modules.find(m => m.featured);
  const regularModules = modules.filter(m => !m.featured);

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
      <main className="flex flex-col gap-16 items-center max-w-[1024px] mx-auto w-full px-4 sm:px-0" role="main">
        {/* Featured Module */}
        {featuredModule && (
          <section aria-label="Featured module" className="w-full">
            <Link href={`/modules/${featuredModule.id}`} className="block">
              <article className="relative w-full h-[600px] bg-neutral-50 overflow-hidden group">
                <Image
                  src={featuredModule.image}
                  alt={featuredModule.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 1024px"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-6">
                  <h2 className="text-3xl font-medium mb-2">{featuredModule.title}</h2>
                  <p className="text-lg text-neutral-200">{featuredModule.description}</p>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Module Grid */}
        <section aria-label="All modules" className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {regularModules.map((module) => (
              <Link 
                key={module.id} 
                href={`/modules/${module.id}`}
                className={`block ${
                  module.size === 'double' ? 'col-span-2' : 
                  module.size === 'triple' ? 'col-span-2 lg:col-span-3' : ''
                }`}
              >
                <article className="relative h-[600px] bg-neutral-50 overflow-hidden group">
                  <Image
                    src={module.image}
                    alt={module.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                    <h2 className="text-xl font-medium">{module.title}</h2>
                    <p className="text-sm text-neutral-200">{module.description}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 