import { describe, expect, it } from "vitest";
import { runExperiment } from "@/lib/ai/runner";
import type { ExperimentProvider } from "@/lib/ai/provider";
import { InputError } from "@/lib/ai/errors";
import { experimentBySlug } from "@/lib/experiments/registry";

const diagnosis = {
  summary: "Import fails during worker startup.",
  rootCause: "A dependency is missing from the runtime image.",
  severity: "high" as const,
  steps: ["Declare the dependency", "Rebuild the image"],
  verification: ["Run the boot check"],
  confidence: 0.9,
};

const fakeProvider: ExperimentProvider = {
  runStructured: async () => diagnosis,
  runVision: async () => ({ componentCode: "export default function View() {}", stylesCode: ".view {}", notes: [], accessibility: [] }),
  runWithTools: async () => ({ summary: "Reviewed packages.", packages: [], nextSteps: [] }),
};

describe("experiment runner", () => {
  it("validates input and output around a provider call", async () => {
    const experiment = experimentBySlug.get("explain-stacktrace");
    if (!experiment) throw new Error("fixture missing");
    const result = await runExperiment(experiment, { source: "Error: boom" }, { provider: fakeProvider });
    expect(result).toEqual(diagnosis);
  });

  it("blocks malformed OpenAPI before provider invocation", async () => {
    const experiment = experimentBySlug.get("openapi-to-sdk");
    if (!experiment) throw new Error("fixture missing");
    await expect(runExperiment(experiment, { source: "{broken", language: "TypeScript" }, { provider: fakeProvider })).rejects.toBeInstanceOf(InputError);
  });

  it("blocks malformed package manifests before tool calling", async () => {
    const experiment = experimentBySlug.get("dependency-risk-map");
    if (!experiment) throw new Error("fixture missing");
    await expect(runExperiment(experiment, { source: "[]" }, { provider: fakeProvider })).rejects.toBeInstanceOf(InputError);
  });

  it("requires an image for the vision path", async () => {
    const experiment = experimentBySlug.get("screenshot-to-react");
    if (!experiment) throw new Error("fixture missing");
    await expect(runExperiment(experiment, { context: "Use semantic HTML" }, { provider: fakeProvider })).rejects.toBeInstanceOf(InputError);
  });
});
