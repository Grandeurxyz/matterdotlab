import Work from "../components/Work";
import { getProjects } from "../lib/work";

export const metadata = {
  title: "Work | ByGrandeur",
};

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-black">
      <Work projects={getProjects()} />
    </main>
  );
}