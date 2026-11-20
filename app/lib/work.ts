import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  cover?: string;
  link?: string;
  body: string;
};

const DIR = path.join(process.cwd(), "content", "work");

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
          body: content.trim(),
        } as Project;
      })
      .filter((p): p is Project => p !== null);
  } catch {
    return [];
  }
}