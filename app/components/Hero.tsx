"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import MetalPlate3D from "./MetalPlate3D";

const EASE = [0.22, 1, 0.36, 1] as const;
const PLATE_TEXT = "ByGrandeur";

const INTRO = "An independent creative studio making things at the intersection of art, design and code.";

const FOCUS = ["Visual & Graphic Design", "Art & Illustration", "3D", "Code & Digital Interactions"];

export default function Hero() {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 800], [1, 0.92]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0.2]);

  return (
    <section id="home" className="sticky top-0 z-0 h-[100svh] w-full overflow-hidden bg-black">
      <motion.div
        style={{ scale, opacity }}
        className="flex h-full w-full flex-col px-5 pb-24 pt-6 md:px-10 md:pb-28 md:pt-8"
      >
        <div className="relative min-h-0 flex-1">
          <MetalPlate3D text={PLATE_TEXT} className="absolute inset-0" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.5 }}
          className="mx-auto mt-4 grid w-full max-w-[1400px] grid-cols-[1.2fr_1fr] gap-5 md:mt-8 md:flex md:items-start md:justify-between md:gap-10"
        >
          <p className="max-w-[34rem] text-base leading-snug tracking-tight text-neutral-100 md:text-2xl">
            {INTRO}
          </p>

          <div className="text-xs leading-relaxed tracking-tight text-neutral-300 md:text-lg md:leading-snug">
            <p className="mb-1 text-neutral-100">Focus</p>
            <ul>
              {FOCUS.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}