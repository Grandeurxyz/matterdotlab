"use client";

import { useState } from "react";
import MetalPlate3D from "./components/MetalPlate3D";

export default function Page() {
  const [text, setText] = useState("ByGrandeur");

  return (
    <main className="relative min-h-screen bg-black">
      <MetalPlate3D text={text} className="h-screen w-full" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="absolute bottom-8 left-1/2 w-72 -translate-x-1/2 resize-none rounded-md border border-neutral-700 bg-neutral-900 p-3 text-center text-sm uppercase tracking-widest text-neutral-200 outline-none focus:border-neutral-400"
      />
    </main>
  );
}