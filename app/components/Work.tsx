"use client";

import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Project } from "../lib/work";

const EASE = [0.22, 1, 0.36, 1] as const;
const TITLE = "WORK";

export default function Work({ projects }: { projects: Project[] }) {
  const reduce = useReducedMotion();

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

        <div className="mt-16 space-y-24 md:mt-24 md:space-y-40">
          {projects.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={reduce ? false : { opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 1.1, ease: EASE }}
            >
              <div className="relative h-[75svh] w-full overflow-hidden rounded-[4px] bg-neutral-900 md:h-[85svh]">
                {p.cover ? (
                  <img
                    src={p.cover}
                    alt={p.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-950" />
                )}
              </div>

              <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-[1fr_2fr] md:gap-10">
                <div>
                  <p className="text-xs tracking-[0.3em] text-neutral-600">
                    {String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 text-3xl font-medium tracking-tight text-neutral-100 md:text-5xl">
                    {p.title}
                  </h2>
                  <p className="mt-3 text-sm tracking-tight text-neutral-500">
                    {[p.category, p.year].filter(Boolean).join("  ·  ")}
                  </p>
                </div>

                <div className="max-w-2xl">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-5 text-lg leading-snug tracking-tight text-neutral-300 md:text-2xl">
                          {children}
                        </p>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-100 underline underline-offset-4 transition-colors hover:text-white"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-medium text-neutral-100">{children}</strong>,
                    }}
                  >
                    {p.body}
                  </ReactMarkdown>

                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm uppercase tracking-[0.25em] text-neutral-400 transition-colors hover:text-white"
                    >
                      View project ↗
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}