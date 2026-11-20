"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Media, Project } from "../lib/work";

const EASE = [0.22, 1, 0.36, 1] as const;

function Video({ item, className }: { item: Media; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={item.src}
      poster={item.poster}
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    />
  );
}

export default function CaseStudy({
  project: p,
  next,
}: {
  project: Project;
  next?: { slug: string; title: string };
}) {
  const reduce = useReducedMotion();
  const paragraphs = p.description.split(/\n\s*\n/).filter(Boolean);
  const details = [
    ...(p.category ? [{ label: "Type", value: p.category }] : []),
    ...(p.year ? [{ label: "Year", value: p.year }] : []),
    ...p.details,
  ];

  return (
    <article className="min-h-screen bg-black pb-40 pt-8 md:pt-10">
      <div className="mx-auto max-w-[1400px] px-4 md:px-10">
        <Link
          href="/work"
          className="text-xs uppercase tracking-[0.3em] text-neutral-500 transition-colors hover:text-white"
        >
          ← All work
        </Link>

        <motion.h1
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
          aria-label={p.title}
          className="mt-10 flex flex-wrap overflow-hidden text-5xl font-semibold leading-[0.95] tracking-tighter text-neutral-100 md:mt-16 md:text-[9rem]"
        >
          {p.title.split(" ").map((w, i) => (
            <span key={i} aria-hidden="true" className="mr-[0.25em] inline-block overflow-hidden pb-[0.08em]">
              <motion.span
                variants={{
                  hidden: reduce ? {} : { y: "110%" },
                  show: { y: "0%" },
                }}
                transition={{ duration: 1, ease: EASE }}
                className="inline-block"
              >
                {w}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
          style={{ transformOrigin: "left" }}
          className="mt-8 h-px w-full bg-gradient-to-r from-neutral-500 via-neutral-800 to-transparent md:mt-12"
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.4 }}
          className="mt-8 grid gap-10 md:mt-12 md:grid-cols-[2fr_1fr] md:gap-16"
        >
          <div className="max-w-3xl space-y-5">
            {paragraphs.map((t, i) => (
              <p key={i} className="text-xl leading-snug tracking-tight text-neutral-200 md:text-3xl">
                {t}
              </p>
            ))}
          </div>

          <dl className="space-y-4 text-sm tracking-tight md:text-base">
            {details.map((d) => (
              <div key={d.label} className="border-b border-neutral-900 pb-3">
                <dt className="text-xs uppercase tracking-[0.3em] text-neutral-600">{d.label}</dt>
                <dd className="mt-1 text-neutral-200">{d.value}</dd>
              </div>
            ))}
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noreferrer"
                className="inline-block pt-1 text-xs uppercase tracking-[0.25em] text-neutral-300 transition-colors hover:text-white"
              >
                View live ↗
              </a>
            )}
          </dl>
        </motion.div>
      </div>

      <div className="mx-auto mt-16 grid max-w-[1400px] grid-cols-1 gap-2 px-4 md:mt-28 md:grid-cols-2 md:gap-3 md:px-10">
        {p.media.map((m, i) => {
          const half = m.layout === "half";
          const screen = m.layout === "screen";
          const cls = half
            ? "aspect-[4/5] w-full object-cover"
            : screen
            ? "h-[100svh] w-full object-cover"
            : "h-auto w-full";

          return (
            <motion.figure
              key={`${m.src}-${i}`}
              initial={reduce ? false : { opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 1.1, ease: EASE }}
              className={half ? "md:col-span-1" : "md:col-span-2"}
            >
              <div className="overflow-hidden bg-neutral-950">
                <motion.div
                  initial={reduce ? false : { scale: 1.05 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 1.6, ease: EASE }}
                >
                  {m.type === "video" ? (
                    <Video item={m} className={`block ${cls}`} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.src}
                      alt={m.alt ?? m.caption ?? p.title}
                      loading={i < 2 ? "eager" : "lazy"}
                      draggable={false}
                      className={`block ${cls}`}
                    />
                  )}
                </motion.div>
              </div>
              {m.caption && (
                <figcaption className="pt-3 text-xs tracking-tight text-neutral-500">
                  {m.caption}
                </figcaption>
              )}
            </motion.figure>
          );
        })}
      </div>

      {next && (
        <div className="mx-auto mt-24 max-w-[1400px] px-4 md:mt-40 md:px-10">
          <div className="h-px w-full bg-gradient-to-r from-neutral-500 via-neutral-800 to-transparent" />
          <Link href={`/work/${next.slug}`} className="group mt-8 block">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-600">Next project</p>
            <p className="mt-3 text-4xl font-semibold tracking-tighter text-neutral-100 transition-transform duration-700 ease-out group-hover:translate-x-3 md:text-8xl">
              {next.title} →
            </p>
          </Link>
        </div>
      )}
    </article>
  );
}