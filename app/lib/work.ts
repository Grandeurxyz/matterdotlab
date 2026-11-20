import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Media = {
  src: string;
  type: "image" | "video";
  layout: "full" | "half" | "screen";
  caption?: string;
  alt?: string;
  poster?: string;
};

export type Detail = { label: string; value: string };

export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  cover?: string;
  link?: string;
  ready: boolean;
  description: string;
  details: Detail[];
  media: Media[];
};

const DIR = path.join(process.cwd(), "content", "work");

function toMedia(raw: unknown): Media[] {
  if (!Array.isArray(raw)) return [];
  const out: Media[] = [];
  for (const item of raw) {
    const o = (typeof item === "string" ? { src: item } : item) as Record<string, unknown> | null;
    const src = o?.src ? String(o.src) : "";
    if (!o || !src) continue;
    out.push({
      src,
      type: /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src) ? "video" : "image",
      layout: o.layout === "half" || o.layout === "screen" ? o.layout : "full",
      caption: o.caption ? String(o.caption) : undefined,
      alt: o.alt ? String(o.alt) : undefined,
      poster: o.poster ? String(o.poster) : undefined,
    });
  }
  return out;
}

function toDetails(raw: unknown): Detail[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>).map(([label, value]) => ({
    label,
    value: String(value),
  }));
}

export function getProjects(): Project[] {
  try {
    return fs
      .readdirSync(DIR)
      .filter((f) => /\.mdx?$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => {
        const raw = fs.readFileSync(path.join(DIR, file), "utf8");
        const { data, content } = matter(raw);
        if (data.draft) return null;
        return {
          slug: file.replace(/\.mdx?$/i, ""),
          title: String(data.title ?? "Untitled"),
          category: String(data.category ?? ""),
          year: String(data.year ?? ""),
          cover: data.cover ? String(data.cover) : undefined,
          link: data.link ? String(data.link) : undefined,
          ready: data.ready === true || data.ready === "true",
          description: String(data.description ?? content).trim(),
          details: toDetails(data.details),
          media: toMedia(data.media),
        } as Project;
      })
      .filter((p): p is Project => p !== null);
  } catch {
    return [];
  }
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}