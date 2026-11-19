"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import MetalPlate3D from "./MetalPlate3D";

const PLATE_TEXT = "ByGrandeur";

export default function Hero() {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 800], [1, 0.9]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0.25]);

  return (
    <section className="sticky top-0 z-0 h-screen w-full overflow-hidden bg-black">
      <motion.div style={{ scale, opacity }} className="h-full w-full">
        <MetalPlate3D text={PLATE_TEXT} className="h-full w-full" />
      </motion.div>
    </section>
  );
}