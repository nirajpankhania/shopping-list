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
    return `rounded px-3 py-2 text-sm font-medium text-menu ${
      active ? "bg-cream font-semibold" : "hover:bg-cream/60"
    }`;
  };

  const links = () =>
    LINKS.map((l) => (
      <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
        {l.label}
      </Link>
    ));

  return (
    <>
      {/* Mobile: top bar with the burger on the left */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-cream px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menu"
          aria-expanded={open}
          className="text-2xl leading-none text-menu"
        >
          ☰
        </button>
        <Link href="/" className="text-lg font-bold">
          Shopping list
        </Link>
      </header>

      {/* Mobile: dimmed overlay + slide-over drawer from the left */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-20 bg-black/30 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-beige p-6 shadow-xl transition-transform md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold">
            Shopping list
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-xl leading-none text-menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1">{links()}</nav>
      </aside>

      {/* Desktop: persistent sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-200 bg-beige p-6 md:flex">
        <Link href="/" className="mb-6 text-lg font-bold">
          Shopping list
        </Link>
        <nav className="flex flex-col gap-1">{links()}</nav>
      </aside>
    </>
  );
}
