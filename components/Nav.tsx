"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Shopping list" },
  { href: "/recipes", label: "Recipes" },
  { href: "/plans", label: "Plans" },
  { href: "/pantry", label: "Pantry" },
  { href: "/add", label: "Add a recipe" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `rounded px-3 py-2 text-sm font-medium ${
      active ? "bg-beige text-primary" : "text-neutral-600 hover:text-primary"
    }`;
  };

  const links = LINKS.map((l) => (
    <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
      {l.label}
    </Link>
  ));

  return (
    <>
      {/* Mobile: top bar with a burger toggle */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-cream px-4 py-3 md:hidden">
        <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold">
          Shopping list
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="rounded p-1 text-2xl leading-none"
        >
          ☰
        </button>
      </header>
      {open && (
        <nav className="flex flex-col gap-1 border-b border-neutral-200 bg-cream p-2 md:hidden">
          {links}
        </nav>
      )}

      {/* Desktop: persistent sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-200 bg-cream p-6 md:flex">
        <Link href="/" className="mb-6 text-lg font-bold">
          Shopping list
        </Link>
        <nav className="flex flex-col gap-1">{links}</nav>
      </aside>
    </>
  );
}
