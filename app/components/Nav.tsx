"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINKS = [
  { label: "Work", id: "work", href: "/work" },
  { label: "Foundry", id: "foundry", href: "/#foundry" },
  { label: "Info", id: "info", href: "/info" },
];

function Highlight() {
  return (
    <motion.span
      layoutId="nav-pill"
      transition={{ duration: 0.6, ease: EASE }}
      className="absolute inset-0 rounded-full bg-white"
    />
  );
}

export default function Nav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [spy, setSpy] = useState("home");

  useEffect(() => {
    if (!onHome) return;
    const update = () => {
      const g = document.getElementById("foundry");
      const line = window.innerHeight * 0.5;
      setSpy(g && g.getBoundingClientRect().top <= line ? "foundry" : "home");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onHome]);

  const active = onHome
    ? spy
    : pathname.startsWith("/work")
    ? "work"
    : pathname.startsWith("/info")
    ? "info"
    : "";

  const onHomeClick = (e: React.MouseEvent) => {
    if (onHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onFoundryClick = (e: React.MouseEvent) => {
    if (onHome) {
      e.preventDefault();
      document.getElementById("foundry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
      aria-label="Primary"
      className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
    >
      <ul className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <li>
          <Link
            href="/"
            onClick={onHomeClick}
            aria-label="Home"
            aria-current={active === "home" ? "page" : undefined}
            className="relative flex h-9 w-9 items-center justify-center rounded-full"
          >
            {active === "home" && <Highlight />}
            <span
              className={`relative block h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
                active === "home" ? "bg-black" : "bg-neutral-500"
              }`}
            />
          </Link>
        </li>

        {LINKS.map(({ label, id, href }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <Link
                href={href}
                onClick={id === "foundry" ? onFoundryClick : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`relative block rounded-full px-4 py-2 text-sm tracking-tight transition-colors duration-500 md:px-5 ${
                  isActive ? "text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                {isActive && <Highlight />}
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}