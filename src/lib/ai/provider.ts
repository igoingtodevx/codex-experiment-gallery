import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodTypeAny } from "zod";
import { ProviderConfigError, ProviderOutputError, ProviderRequestError, isAbortError } from "./errors";

type StructuredRequest = {
  instructions: string;
  input: string;
  schema: ZodTypeAny;
  schemaName: string;
  signal?: AbortSignal;
};

type VisionRequest = {
  instructions: string;
  context: string;
  image: { bytes: Buffer; mimeType: string };
  schema: ZodTypeAny;
  schemaName: string;
  signal?: AbortSignal;
};

type ToolRequest = StructuredRequest;

export interface ExperimentProvider {
  runStructured(request: StructuredRequest): Promise<unknown>;
  runVision(request: VisionRequest): Promise<unknown>;
  runWithTools(request: ToolRequest): Promise<unknown>;
}

type PackageLookup = {
  name: string;
  version: string;
  description: string;
  modified: string;
  deprecated: string | null;
  registry: string;
};

const packageNamePattern = /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i;
const MAX_LOOKUPS = 6;

async function lookupNpmPackage(name: string, signal?: AbortSignal): Promise<PackageLookup> {
  if (!packageNamePattern.test(name) || name.length > 180) {
    return { name, version: "unknown", description: "Rejected: invalid package name", modified: "", deprecated: null, registry: "npm" };
  }

  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { accept: "application/json" },
      signal: signal ?? AbortSignal.timeout(4_000),
    });
    if (!response.ok) {
      return { name, version: "unknown", description: `Registry returned HTTP ${response.status}`, modified: "", deprecated: null, registry: "npm" };
    }
    const data = (await response.json()) as {
      description?: unknown;
      "dist-tags"?: { latest?: unknown };
      time?: { modified?: unknown };
      deprecated?: unknown;
    };
    return {
      name,
      version: typeof data["dist-tags"]?.latest === "string" ? data["dist-tags"].latest : "unknown",
      description: typeof data.description === "string" ? data.description.slice(0, 300) : "",
      modified: typeof data.time?.modified === "string" ? data.time.modified : "",
      deprecated: typeof data.deprecated === "string" ? data.deprecated.slice(0, 300) : null,
      registry: "npm",
    };
  } catch (error) {
    return {
      name,
      version: "unknown",
      description: isAbortError(error) ? "Registry lookup timed out" : "Registry lookup failed",
      modified: "",
      deprecated: null,
      registry: "npm",
    };
  }
}

export class OpenAIProvider implements ExperimentProvider {
  private readonly client: OpenAI;
  readonly model: string;

  constructor(
    apiKey = process.env.OPENAI_API_KEY,
    model = process.env.OPENAI_MODEL || "gpt-5.6-luna",
  ) {
    if (!apiKey) throw new ProviderConfigError();
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async runStructured({ instructions, input, schema, schemaName, signal }: StructuredRequest): Promise<unknown> {
    try {
      const response = await this.client.responses.parse(
        {
          model: this.model,
          instructions,
          input,
          text: { format: zodTextFormat(schema, schemaName) },
        },
        { signal },
      );
      if (!response.output_parsed) throw new ProviderOutputError();
      return response.output_parsed;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async runVision({ instructions, context, image, schema, schemaName, signal }: VisionRequest): Promise<unknown> {
    try {
      const response = await this.client.responses.parse(
        {
          model: this.model,
          instructions,
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: context || "Inspect the supplied interface screenshot." },
                {
                  type: "input_image",
                  image_url: `data:${image.mimeType};base64,${image.bytes.toString("base64")}`,
                  detail: "high",
                },
              ],
            },
          ],
          text: { format: zodTextFormat(schema, schemaName) },
        },
        { signal },
      );
      if (!response.output_parsed) throw new ProviderOutputError();
      return response.output_parsed;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async runWithTools({ instructions, input, schema, schemaName, signal }: ToolRequest): Promise<unknown> {
    try {
      const first = await this.client.responses.create(
        {
          model: this.model,
          instructions,
          input,
          tools: [
            {
              type: "function",
              name: "lookup_npm_package",
              description: "Look up current public metadata for one npm package named in the supplied package.json.",
              parameters: {
                type: "object",
                properties: { name: { type: "string", description: "An exact npm package name" } },
                required: ["name"],
                additionalProperties: false,
              },
              strict: true,
            },
          ],
        },
        { signal },
      );

      const calls = first.output.filter((item) => item.type === "function_call").slice(0, MAX_LOOKUPS);
      const toolOutputs = await Promise.all(calls.map(async (call) => {
        let name = "unknown";
        try {
          const args = JSON.parse(call.arguments) as { name?: unknown };
          if (typeof args.name === "string") name = args.name;
        } catch {
          // The follow-up receives an explicit malformed-call result.
        }
        const result = await lookupNpmPackage(name, signal);
        return { type: "function_call_output" as const, call_id: call.call_id, output: JSON.stringify(result) };
      }));

      const followupInput = [
        { role: "user" as const, content: [{ type: "input_text" as const, text: input }] },
        ...first.output,
        ...toolOutputs,
      ] as never;
      const final = await this.client.responses.parse(
        {
          model: this.model,
          instructions,
          input: followupInput,
          text: { format: zodTextFormat(schema, schemaName) },
        },
        { signal },
      );
      if (!final.output_parsed) throw new ProviderOutputError();
      return final.output_parsed;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof ProviderConfigError || error instanceof ProviderOutputError) return error;
    if (isAbortError(error)) return new ProviderRequestError("The AI provider timed out. Try a smaller input.", 504);
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) return new ProviderRequestError("The AI provider rate limit was reached. Try again shortly.", 429);
      if (error.status === 401 || error.status === 403) return new ProviderRequestError("The AI provider rejected the server configuration.", 502);
      return new ProviderRequestError("The AI provider returned an error. Try again or use a smaller input.", error.status && error.status >= 500 ? 502 : 400);
    }
    if (error instanceof Error && error.message.includes("schema")) return new ProviderOutputError();
    return new ProviderRequestError();
  }
}
