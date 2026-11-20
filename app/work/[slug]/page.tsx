import { notFound } from "next/navigation";
import CaseStudy from "../../components/CaseStudy";
import { getProject, getProjects } from "../../lib/work";

export function generateStaticParams() {
  return getProjects()
    .filter((p) => p.ready)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  return { title: p ? `${p.title} | ByGrandeur` : "Work | ByGrandeur" };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p || !p.ready) notFound();

  const ready = getProjects().filter((x) => x.ready);
  const i = ready.findIndex((x) => x.slug === slug);
  const n = ready.length > 1 ? ready[(i + 1) % ready.length] : undefined;

  return (
    <main className="min-h-screen bg-black">
      <CaseStudy project={p} next={n ? { slug: n.slug, title: n.title } : undefined} />
    </main>
  );
}