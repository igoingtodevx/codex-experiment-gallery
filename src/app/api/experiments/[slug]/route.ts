import { NextResponse } from "next/server";
import { getExperiment, runExperiment } from "@/lib/ai/runner";
import { AppError, InputError } from "@/lib/ai/errors";
import { assertRateLimit, getClientKey } from "@/lib/ai/rate-limit";
import { assertRequestSize, readFileBytes } from "@/lib/ai/limits";

export const runtime = "nodejs";
export const maxDuration = 30;

function jsonError(error: unknown, durationMs: number) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message }, meta: { durationMs } },
      { status: error.status },
    );
  }
  console.error("experiment_run_failed", error instanceof Error ? error.message : "unknown error");
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "The run could not be completed. Try again." }, meta: { durationMs } },
    { status: 500 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const startedAt = Date.now();
  try {
    assertRequestSize(request);
    assertRateLimit(getClientKey(request));
    const { slug } = await params;
    const experiment = getExperiment(slug);
    const form = await request.formData();
    const payload = form.get("payload");
    if (typeof payload !== "string") throw new InputError("A JSON payload is required.");

    let input: Record<string, string>;
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      input = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value ?? "")]));
    } catch {
      throw new InputError("The submitted input is not valid JSON.");
    }

    const fileValue = form.get("file");
    let file: { bytes: Buffer; mimeType: string; name: string } | undefined;
    if (experiment.serverKind === "vision") {
      if (!(fileValue instanceof File) || fileValue.size === 0) throw new InputError("A screenshot file is required.");
      file = { bytes: await readFileBytes(fileValue), mimeType: fileValue.type, name: fileValue.name.slice(0, 180) };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 27_000);
    try {
      const result = await runExperiment(experiment, input, { file, signal: controller.signal });
      return NextResponse.json({
        ok: true,
        result,
        meta: {
          durationMs: Date.now() - startedAt,
          model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
          capabilities: experiment.capabilities,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return jsonError(error, Date.now() - startedAt);
  }
}
