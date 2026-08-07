import { parse } from "yaml";
import type { ZodTypeAny } from "zod";
import { experimentBySlug } from "@/lib/experiments/registry";
import type { ExperimentDefinition } from "@/lib/experiments/types";
import { InputError } from "./errors";
import { OpenAIProvider, type ExperimentProvider } from "./provider";

export type RunOptions = {
  file?: { bytes: Buffer; mimeType: string; name: string };
  signal?: AbortSignal;
  provider?: ExperimentProvider;
};

function assertDocument(source: string, label: string): void {
  try {
    const parsed = parse(source) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
  } catch {
    throw new InputError(`${label} must be valid JSON or YAML.`);
  }
}

function assertPackageManifest(source: string): void {
  try {
    const parsed = JSON.parse(source) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    const manifest = parsed as Record<string, unknown>;
    if (!manifest.dependencies && !manifest.devDependencies && !manifest.optionalDependencies) {
      throw new Error("no dependencies");
    }
  } catch {
    throw new InputError("package.json must be valid JSON with at least one dependency block.");
  }
}

function schemaName(experiment: ExperimentDefinition): string {
  return experiment.slug.replace(/[^a-zA-Z0-9]/g, "_");
}

function formatInput(input: Record<string, string>): string {
  return Object.entries(input)
    .map(([key, value]) => `### ${key}\n${value}`)
    .join("\n\n");
}

function parseInput(experiment: ExperimentDefinition, rawInput: Record<string, string>) {
  const parsed = experiment.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path.join(".");
    throw new InputError(field ? `${field}: ${first.message}` : first?.message || "Input is invalid.");
  }
  return parsed.data as Record<string, string>;
}

export async function runExperiment(
  experiment: ExperimentDefinition,
  rawInput: Record<string, string>,
  options: RunOptions = {},
): Promise<unknown> {
  const input = parseInput(experiment, rawInput);
  if (experiment.slug === "openapi-to-sdk") assertDocument(input.source, "OpenAPI input");
  if (experiment.slug === "dependency-risk-map") assertPackageManifest(input.source);

  const provider = options.provider ?? new OpenAIProvider();
  const formatted = formatInput(input);
  let result: unknown;

  if (experiment.serverKind === "vision") {
    if (!options.file) throw new InputError("A PNG, JPEG, or WebP screenshot is required.");
    result = await provider.runVision({
      instructions: experiment.instructionStrategy,
      context: formatted,
      image: { bytes: options.file.bytes, mimeType: options.file.mimeType },
      schema: experiment.outputSchema as ZodTypeAny,
      schemaName: schemaName(experiment),
      signal: options.signal,
    });
  } else if (experiment.serverKind === "tools") {
    result = await provider.runWithTools({
      instructions: experiment.instructionStrategy,
      input: formatted,
      schema: experiment.outputSchema as ZodTypeAny,
      schemaName: schemaName(experiment),
      signal: options.signal,
    });
  } else {
    result = await provider.runStructured({
      instructions: experiment.instructionStrategy,
      input: formatted,
      schema: experiment.outputSchema as ZodTypeAny,
      schemaName: schemaName(experiment),
      signal: options.signal,
    });
  }

  const validated = experiment.outputSchema.safeParse(result);
  if (!validated.success) throw new InputError("The provider result did not match the experiment schema.");
  return validated.data;
}

export function getExperiment(slug: string): ExperimentDefinition {
  const experiment = experimentBySlug.get(slug);
  if (!experiment) throw new InputError("Unknown experiment.");
  return experiment;
}
