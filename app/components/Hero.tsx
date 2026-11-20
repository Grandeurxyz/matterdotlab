"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import MetalText from "./MetalText";

const EASE = [0.22, 1, 0.36, 1] as const;
const BRAND = "ByGrandeur";
const INTRO = "An independent creative studio making things at the intersection of art, design and code.";

export default function Hero() {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 800], [1, 0.92]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0.2]);

  return (
    <section id="home" className="sticky top-0 z-0 h-[100svh] w-full overflow-hidden bg-black">
      <motion.div
        style={{ scale, opacity }}
        className="flex h-full w-full flex-col justify-between px-3 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6"
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        >
          <MetalText text={BRAND} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.5 }}
          className="max-w-[34rem] px-1 text-base leading-snug tracking-tight text-neutral-100 md:text-2xl"
        >
          {INTRO}
        </motion.p>
      </motion.div>
    </section>
  );
}