"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINKS = [
  { label: "Home", id: "home" },
  { label: "Work", id: "work" },
  { label: "Foundry", id: "foundry" },
  { label: "About", id: "about" },
  { label: "Contact", id: "contact" },
];

export default function Nav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.5;
      let current = "home";
      for (const { id } of LINKS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (id: string) => {
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}
      aria-label="Primary"
      className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
    >
      <ul className="flex items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-md">
        {LINKS.map(({ label, id }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 md:px-4 md:text-xs ${
                  isActive ? "text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ duration: 0.6, ease: EASE }}
                    className="absolute inset-0 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-400"
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}