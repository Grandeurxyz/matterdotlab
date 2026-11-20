import fs from "node:fs";
import path from "node:path";
import Hero from "./components/Hero";
import Gallery from "./components/Gallery";

function getGalleryImages(): string[] {
  const dir = path.join(process.cwd(), "public", "gallery");
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(png|jpe?g|webp|avif|gif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/gallery/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export default function Page() {
  const images = getGalleryImages();

  return (
    <main className="bg-black">
      <Hero />
      <Gallery images={images} />
    </main>
  );
}