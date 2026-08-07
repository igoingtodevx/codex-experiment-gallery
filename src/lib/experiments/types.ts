import type { ZodTypeAny } from "zod";

export const categoryIds = ["debug", "transform", "review", "generate", "multimodal"] as const;
export type CategoryId = (typeof categoryIds)[number];

export const categoryLabels: Record<CategoryId, string> = {
  debug: "Debug & diagnose",
  transform: "Transform code",
  review: "Review & harden",
  generate: "Generate artifacts",
  multimodal: "Multimodal",
};

export const capabilityIds = [
  "structured-output",
  "code-generation",
  "markdown",
  "file-input",
  "vision",
  "tool-calling",
] as const;
export type CapabilityId = (typeof capabilityIds)[number];

export type InputField = {
  id: string;
  label: string;
  type: "textarea" | "code" | "text" | "select" | "file";
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: readonly { value: string; label: string }[];
  accept?: string;
  maxLength?: number;
  rows?: number;
};

export type Example = {
  id: string;
  label: string;
  description: string;
  values: Record<string, string>;
};

export type RendererId =
  | "diagnosis"
  | "findings"
  | "code"
  | "files"
  | "markdown"
  | "dependencies";

export type ExperimentDefinition = {
  id: string;
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  category: CategoryId;
  capabilities: readonly CapabilityId[];
  accent: string;
  inputFields: readonly InputField[];
  examples: readonly Example[];
  inputSchema: ZodTypeAny;
  outputSchema: ZodTypeAny;
  renderer: RendererId;
  modelRequirements: string;
  instructionStrategy: string;
  serverKind: "structured" | "vision" | "tools";
};

export type PublicExperiment = Omit<
  ExperimentDefinition,
  "inputSchema" | "outputSchema" | "instructionStrategy"
>;

export type ExperimentInput = Record<string, string>;

export type Finding = {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  evidence: string;
  recommendation: string;
};

export function toPublicExperiment(
  experiment: ExperimentDefinition,
): PublicExperiment {
  const { inputSchema: _inputSchema, outputSchema: _outputSchema, instructionStrategy: _instructionStrategy, ...publicExperiment } = experiment;
  return publicExperiment;
}
