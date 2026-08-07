import { z } from "zod";

const text = (max = 40_000) => z.string().trim().min(1, "Input is required").max(max);
const optionalText = (max = 4_000) => z.string().trim().max(max).optional().default("");

export const explainStacktraceInputSchema = z.object({ source: text(24_000) });
export const fixSqlInputSchema = z.object({
  source: text(24_000),
  dialect: z.enum(["PostgreSQL", "MySQL", "SQLite", "SQL Server"]),
});
export const refactorInputSchema = z.object({
  source: text(30_000),
  language: z.enum(["TypeScript", "JavaScript", "Python", "Go", "Rust"]),
  goal: text(1_000),
});
export const testsInputSchema = z.object({
  source: text(30_000),
  language: z.enum(["TypeScript", "JavaScript", "Python", "Go"]),
  framework: z.enum(["Vitest", "Jest", "pytest", "Go test"]),
});
export const reviewInputSchema = z.object({ source: text(30_000) });
export const openApiInputSchema = z.object({
  source: text(45_000),
  language: z.enum(["TypeScript", "Python", "Go"]),
});
export const readmeInputSchema = z.object({
  source: text(30_000),
  projectName: text(120),
  audience: text(400),
});
export const dependencyInputSchema = z.object({ source: text(35_000) });
export const screenshotInputSchema = z.object({ context: optionalText(2_000) });

const severity = z.enum(["critical", "high", "medium", "low", "info"]);
const finding = z.object({
  id: z.string().min(1).max(32),
  severity,
  title: z.string().min(1).max(140),
  evidence: z.string().min(1).max(600),
  recommendation: z.string().min(1).max(800),
});

export const diagnosisOutputSchema = z.object({
  summary: z.string().min(1).max(500),
  rootCause: z.string().min(1).max(900),
  severity,
  steps: z.array(z.string().min(1).max(400)).min(1).max(8),
  verification: z.array(z.string().min(1).max(400)).max(6),
  confidence: z.number().min(0).max(1),
});

export const sqlOutputSchema = z.object({
  rewrittenQuery: z.string().min(1).max(30_000),
  explanation: z.string().min(1).max(1_200),
  issues: z.array(finding).max(8),
  assumptions: z.array(z.string().min(1).max(400)).max(8),
});

export const refactorOutputSchema = z.object({
  refactoredCode: z.string().min(1).max(35_000),
  changes: z.array(z.string().min(1).max(400)).min(1).max(10),
  tradeoffs: z.array(z.string().min(1).max(400)).max(8),
  notes: z.string().max(1_000),
});

export const testsOutputSchema = z.object({
  testCode: z.string().min(1).max(35_000),
  cases: z.array(z.string().min(1).max(300)).min(1).max(12),
  notes: z.string().max(1_000),
});

export const findingsOutputSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1).max(1_200),
  findings: z.array(finding).max(12),
  passes: z.array(z.string().min(1).max(400)).max(10),
});

export const filesOutputSchema = z.object({
  files: z.array(
    z.object({
      path: z.string().min(1).max(180),
      content: z.string().min(1).max(30_000),
      description: z.string().min(1).max(500),
    }),
  ).min(1).max(8),
  installNotes: z.array(z.string().min(1).max(500)).max(8),
  assumptions: z.array(z.string().min(1).max(500)).max(8),
});

export const markdownOutputSchema = z.object({
  markdown: z.string().min(1).max(35_000),
  sections: z.array(z.string().min(1).max(120)).min(1).max(12),
  notes: z.string().max(1_000),
});

export const dependenciesOutputSchema = z.object({
  summary: z.string().min(1).max(1_000),
  packages: z.array(
    z.object({
      name: z.string().min(1).max(180),
      requested: z.string().max(80),
      latest: z.string().max(80),
      risk: z.enum(["critical", "high", "medium", "low", "unknown"]),
      reason: z.string().min(1).max(600),
      recommendation: z.string().min(1).max(600),
    }),
  ).max(12),
  nextSteps: z.array(z.string().min(1).max(400)).max(8),
});

export const screenshotOutputSchema = z.object({
  componentCode: z.string().min(1).max(35_000),
  stylesCode: z.string().min(1).max(35_000),
  notes: z.array(z.string().min(1).max(500)).max(10),
  accessibility: z.array(z.string().min(1).max(500)).max(8),
});

export const outputSchemas = {
  diagnosis: diagnosisOutputSchema,
  sql: sqlOutputSchema,
  refactor: refactorOutputSchema,
  tests: testsOutputSchema,
  findings: findingsOutputSchema,
  files: filesOutputSchema,
  markdown: markdownOutputSchema,
  dependencies: dependenciesOutputSchema,
  screenshot: screenshotOutputSchema,
} as const;
