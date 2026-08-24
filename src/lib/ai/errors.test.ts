import { describe, expect, it } from "vitest";
import { isAbortError } from "./errors";

describe("provider abort detection", () => {
  it("recognizes browser and OpenAI abort shapes", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    const openAiAbort = new Error("request aborted");
    openAiAbort.name = "APIUserAbortError";
    const cancelled = Object.assign(new Error("cancelled"), { code: "ERR_CANCELED" });

    expect(isAbortError(abort)).toBe(true);
    expect(isAbortError(openAiAbort)).toBe(true);
    expect(isAbortError(cancelled)).toBe(true);
    expect(isAbortError(new Error("provider rejected the request"))).toBe(false);
  });
});
