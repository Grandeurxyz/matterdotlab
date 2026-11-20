"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const TITLE = "INFO";

const INTRO =
  "Grandeur is built around the simple joy of making things. A space to explore ideas, experiment across mediums and bring interesting things to life.";

const OPEN = "Open to collaborations, commissions and good ideas.";

const FOCUS = ["Visual & Graphic Design", "Art & Illustration", "3D", "Code & Digital Interactions"];

const EMAIL = "0badofinadedapo123@gmail.com";

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 1, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{children}</p>;
}

function Line() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: false, amount: 1 }}
      transition={{ duration: 1.2, ease: EASE }}
      style={{ transformOrigin: "left" }}
      className="h-px w-full bg-gradient-to-r from-neutral-500 via-neutral-800 to-transparent"
    />
  );
}

export default function Info() {
  const reduce = useReducedMotion();

  return (
    <section id="info" className="relative z-10 bg-black px-4 pb-10 pt-32 md:px-10 md:pt-48">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
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
          <motion.span
            aria-hidden="true"
            variants={{
              hidden: reduce ? {} : { y: "110%", opacity: 0 },
              show: { y: "0%", opacity: 1 },
            }}
            transition={{ duration: 1, ease: EASE }}
            className="ml-[0.08em] inline-block text-neutral-600"
          >
            ///
          </motion.span>
        </motion.h2>

        <div className="mt-16 md:mt-24">
          <Line />
          <div className="grid gap-6 py-10 md:grid-cols-[1fr_2fr] md:gap-10 md:py-14">
            <Reveal>
              <Label>About</Label>
            </Reveal>
            <Reveal delay={0.1} className="max-w-2xl space-y-6">
              <p className="text-2xl leading-snug tracking-tight text-neutral-200 md:text-4xl">{INTRO}</p>
              <p className="text-lg leading-snug tracking-tight text-neutral-500 md:text-2xl">{OPEN}</p>
            </Reveal>
          </div>

          <Line />
          <div className="grid gap-6 py-10 md:grid-cols-[1fr_2fr] md:gap-10 md:py-14">
            <Reveal>
              <Label>Focus</Label>
            </Reveal>
            <ul className="max-w-2xl">
              {FOCUS.map((s, i) => (
                <li key={s}>
                  <Reveal delay={i * 0.08}>
                    <motion.div
                      whileHover={reduce ? undefined : { x: 10 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="flex items-baseline gap-5 border-b border-neutral-900 py-4 text-2xl tracking-tight text-neutral-200 md:text-4xl"
                    >
                      <span className="w-8 text-xs tracking-[0.3em] text-neutral-600">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s}</span>
                    </motion.div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>

          <Line />
          <div className="grid gap-6 py-10 md:grid-cols-[1fr_2fr] md:gap-10 md:py-14">
            <Reveal>
              <Label>Contact</Label>
            </Reveal>
            <Reveal delay={0.1} className="max-w-2xl">
              <a
                href={`mailto:${EMAIL}`}
                className="group inline-block text-xl tracking-tight text-neutral-100 sm:text-3xl md:text-5xl"
              >
                <span className="break-all">{EMAIL}</span>
                <span className="mt-2 block h-px origin-left scale-x-0 bg-neutral-200 transition-transform duration-700 ease-out group-hover:scale-x-100" />
              </a>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between pb-28 text-xs tracking-tight text-neutral-600 md:mt-24">
          <span>© {new Date().getFullYear()} ByGrandeur</span>
          <span>Independent studio</span>
        </div>
      </div>
    </section>
  );
}