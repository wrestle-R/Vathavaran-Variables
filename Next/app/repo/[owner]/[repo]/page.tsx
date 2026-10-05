import { RepositoryView } from "@/components/repository";
import { notFound } from "next/navigation";
import { validRepository } from "@/lib/contracts";
export default async function Repo({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const name = `${owner}/${repo}`;
  if (!validRepository(name)) notFound();
  return <RepositoryView name={name} />;
}
