"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project } from "../lib/work";

const EASE = [0.22, 1, 0.36, 1] as const;
const TITLE = "WORK";

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function Work({ projects }: { projects: Project[] }) {
  const reduce = useReducedMotion();
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (slug: string) => {
    setNotice(slug);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotice(null), 2200);
  };

  return (
    <section className="relative min-h-screen bg-black px-4 pb-40 pt-24 md:px-10 md:pt-32">
      <div className="mx-auto max-w-[1400px]">
        <motion.h1
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.07 }}
          aria-label={TITLE}
          className="flex overflow-hidden text-[26vw] font-semibold leading-[0.9] tracking-tighter text-neutral-100 md:text-[17rem]"
        >
          {TITLE.split("").map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              variants={{
                hidden: reduce ? {} : { y: "110%", opacity: 0 },
                show: { y: "0%", opacity: 1 },
              }}
              transition={{ duration: 1, ease: EASE }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
          <span>Selected projects</span>
          <span>{String(projects.length).padStart(2, "0")}</span>
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-neutral-500 via-neutral-800 to-transparent" />

        <div className="mt-16 space-y-20 md:mt-24 md:space-y-32">
          {projects.map((p, i) => {
            const card = (
              <>
                <div className="relative h-[75svh] w-full overflow-hidden rounded-[4px] bg-neutral-900 md:h-[85svh]">
                  {p.cover ? (
                    <img
                      src={p.cover}
                      alt={p.title}
                      loading={i === 0 ? "eager" : "lazy"}
                      draggable={false}
                      className={`h-full w-full object-cover transition-all duration-1000 ease-out group-hover:scale-[1.03] ${
                        p.ready ? "" : "brightness-50"
                      }`}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-950" />
                  )}

                  {!p.ready && (
                    <>
                      <div className="pointer-events-none absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-neutral-200 md:right-6 md:top-6 md:h-14 md:w-14">
                        <Lock className="h-5 w-5 md:h-6 md:w-6" />
                      </div>

                      <AnimatePresence>
                        {notice === p.slug && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4, ease: EASE }}
                            className="pointer-events-none absolute inset-0 flex items-center justify-center"
                          >
                            <div className="flex items-center gap-3 rounded-full bg-black px-6 py-3 text-sm tracking-tight text-neutral-100 md:text-base">
                              <Lock className="h-4 w-4" />
                              Case study not ready
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                <div className="mt-5 flex items-start justify-between gap-6 md:mt-6">
                  <div>
                    <h2 className="text-3xl font-medium tracking-tight text-neutral-100 md:text-5xl">{p.title}</h2>
                    <p className="mt-2 text-sm tracking-tight text-neutral-500 md:text-base">
                      {[p.category, p.year].filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                  <span className="pt-1 text-xs tracking-[0.3em] text-neutral-600">
                    {String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
                  </span>
                </div>
              </>
            );

            return (
              <motion.article
                key={p.slug}
                initial={reduce ? false : { opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 1.1, ease: EASE }}
              >
                {p.ready ? (
                  <Link href={`/work/${p.slug}`} className="group block cursor-pointer">
                    {card}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => flash(p.slug)}
                    aria-label={`${p.title}: case study not ready`}
                    className="group block w-full cursor-not-allowed text-left"
                  >
                    {card}
                  </button>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}