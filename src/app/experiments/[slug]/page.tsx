import { notFound } from "next/navigation";
import { ExperimentWorkspace } from "@/components/ExperimentWorkspace";
import { experimentBySlug, experiments } from "@/lib/experiments/registry";
import { toPublicExperiment } from "@/lib/experiments/types";

export function generateStaticParams() {
  return experiments.map(({ slug }) => ({ slug }));
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const experiment = experimentBySlug.get(slug);
  if (!experiment) notFound();
  return <ExperimentWorkspace experiment={toPublicExperiment(experiment)} />;
}
