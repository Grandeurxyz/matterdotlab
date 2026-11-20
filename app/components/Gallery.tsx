"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const TITLE = "Fragment";

export default function Gallery({ images }: { images: string[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const [shared, setShared] = useState<number | null>(null);
  const [dir, setDir] = useState(1);

  const open = (i: number) => {
    setShared(i);
    setDir(1);
    setActive(i);
  };

  const close = useCallback(() => setActive(null), []);

  const go = useCallback(
    (d: number) => {
      setDir(d);
      setShared(null);
      setActive((i) => (i === null ? i : (i + d + images.length) % images.length));
    },
    [images.length]
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, go]);

  if (images.length === 0) return null;

  return (
    <section id="foundry" className="relative z-10 rounded-t-[2.5rem] bg-black px-4 pb-24 pt-32 shadow-[0_-30px_80px_rgba(0,0,0,0.9)] md:px-10">
      <div className="mx-auto mb-16 max-w-6xl md:mb-24">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500"
        >
          <span>Selected work</span>
          <span>{String(images.length).padStart(2, "0")} pieces</span>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.6 }}
          transition={{ staggerChildren: 0.05 }}
          aria-label={TITLE}
          className="flex overflow-hidden font-[family-name:var(--font-display)] text-6xl font-semibold leading-[1.05] tracking-wide text-neutral-200 md:text-8xl"
        >
          {TITLE.split("").map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              variants={{
                hidden: reduce ? {} : { y: "110%", opacity: 0 },
                show: { y: "0%", opacity: 1 },
              }}
              transition={{ duration: 0.9, ease: EASE }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
          style={{ transformOrigin: "left" }}
          className="mt-6 h-px w-full bg-gradient-to-r from-neutral-400 via-neutral-700 to-transparent"
        />
      </div>

      <div className="mx-auto max-w-6xl columns-2 gap-4 md:columns-3">
        {images.map((src, i) => (
          <motion.div
            key={src}
            className="mb-4 break-inside-avoid"
            initial={reduce ? false : { opacity: 0, y: 60, scale: 0.96, filter: "blur(5px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 1, ease: EASE, delay: (i % 3) * 0.08 }}
          >
            <motion.div
              whileHover={reduce ? undefined : { y: -6 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="group relative"
            >
              <button
                type="button"
                onClick={() => open(i)}
                className="relative block w-full cursor-zoom-in overflow-hidden rounded-[4px] bg-neutral-900 transition-[border-radius] duration-700 ease-out group-hover:rounded-[32px]"
              >
                <motion.img
                  layoutId={`g-${i}`}
                  src={src}
                  alt=""
                  draggable={false}
                  style={{ borderRadius: 4 }}
                  className="block h-auto w-full brightness-75 transition-[filter] duration-700 group-hover:brightness-105"
                />

                <span className="pointer-events-none absolute bottom-3 left-3 translate-y-2 text-[10px] uppercase tracking-[0.3em] text-white/0 transition-all duration-500 group-hover:translate-y-0 group-hover:text-white/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div onClick={close} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

            <motion.img
              key={active}
              layoutId={active === shared ? `g-${active}` : undefined}
              src={images[active]}
              alt=""
              draggable={false}
              initial={active === shared ? undefined : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={active === shared ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ borderRadius: 4 }}
              className="relative h-auto max-h-[80vh] w-auto max-w-[90vw] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="pointer-events-none absolute inset-0 text-sm uppercase tracking-[0.25em] text-neutral-300"
            >
              <button
                type="button"
                onClick={close}
                className="pointer-events-auto absolute right-6 top-6 px-2 py-1 transition-colors hover:text-white"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => go(-1)}
                className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 px-3 py-2 transition-colors hover:text-white md:left-8"
              >
                ← Prev
              </button>

              <button
                type="button"
                onClick={() => go(1)}
                className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 px-3 py-2 transition-colors hover:text-white md:right-8"
              >
                Next →
              </button>

              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-400">
                {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}