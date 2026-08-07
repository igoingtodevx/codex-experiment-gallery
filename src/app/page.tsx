import { GalleryApp } from "@/components/GalleryApp";
import { experiments } from "@/lib/experiments/registry";
import { toPublicExperiment } from "@/lib/experiments/types";

export default function HomePage() {
  return <GalleryApp experiments={experiments.map(toPublicExperiment)} />;
}
