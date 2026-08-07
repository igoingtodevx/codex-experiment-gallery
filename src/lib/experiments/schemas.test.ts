import { describe, expect, it } from "vitest";
import { diagnosisOutputSchema, filesOutputSchema, explainStacktraceInputSchema, openApiInputSchema } from "./schemas";

const validDiagnosis = {
  summary: "The worker cannot import a declared module.",
  rootCause: "decimal128 is not installed in the runtime environment.",
  severity: "high" as const,
  steps: ["Add the dependency to the lockfile.", "Rebuild the worker image."],
  verification: ["Run the worker boot check."],
  confidence: 0.96,
};

describe("experiment schemas", () => {
  it("accepts a valid structured diagnosis", () => {
    expect(diagnosisOutputSchema.safeParse(validDiagnosis).success).toBe(true);
  });

  it("rejects empty input and invalid output severity", () => {
    expect(explainStacktraceInputSchema.safeParse({ source: " " }).success).toBe(false);
    expect(diagnosisOutputSchema.safeParse({ ...validDiagnosis, severity: "urgent" }).success).toBe(false);
  });

  it("keeps generated files bounded and typed", () => {
    const valid = filesOutputSchema.safeParse({
      files: [{ path: "src/client.ts", content: "export const client = {};", description: "Client entry point" }],
      installNotes: ["npm install"],
      assumptions: [],
    });
    expect(valid.success).toBe(true);
    expect(filesOutputSchema.safeParse({ files: [], installNotes: [], assumptions: [] }).success).toBe(false);
  });

  it("accepts JSON and YAML-shaped OpenAPI text at the input boundary", () => {
    expect(openApiInputSchema.safeParse({ source: "openapi: 3.1.0", language: "TypeScript" }).success).toBe(true);
  });
});
