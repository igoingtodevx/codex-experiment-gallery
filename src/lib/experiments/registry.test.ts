import { describe, expect, it } from "vitest";
import { experimentBySlug, experiments } from "./registry";
import { toPublicExperiment } from "./types";

describe("experiment registry", () => {
  it("contains unique, runnable experiments with examples", () => {
    expect(experiments.length).toBe(10);
    expect(new Set(experiments.map((experiment) => experiment.slug)).size).toBe(experiments.length);
    for (const experiment of experiments) {
      expect(experimentBySlug.get(experiment.slug)).toBe(experiment);
      expect(experiment.inputFields.length).toBeGreaterThan(0);
      expect(experiment.examples.length).toBeGreaterThan(0);
      expect(experiment.capabilities.length).toBeGreaterThan(0);
      expect(experiment.outputSchema).toBeDefined();
      expect(experiment.inputSchema).toBeDefined();
    }
  });

  it("exposes UI metadata without server instructions or schemas", () => {
    const publicExperiment = toPublicExperiment(experiments[0]);
    expect(publicExperiment.slug).toBe("explain-stacktrace");
    expect("instructionStrategy" in publicExperiment).toBe(false);
    expect("inputSchema" in publicExperiment).toBe(false);
    expect("outputSchema" in publicExperiment).toBe(false);
  });

  it("keeps the dependency manifest server limit aligned with the 35k UI contract", () => {
    const experiment = experimentBySlug.get("dependency-risk-map");
    if (!experiment) throw new Error("fixture missing");
    const source = JSON.stringify({
      dependencies: { react: "^19.0.0" },
      note: "x".repeat(30_500),
    });
    expect(source.length).toBeGreaterThan(30_000);
    expect(source.length).toBeLessThanOrEqual(35_000);
    expect(experiment.inputSchema.safeParse({ source }).success).toBe(true);
  });
});
