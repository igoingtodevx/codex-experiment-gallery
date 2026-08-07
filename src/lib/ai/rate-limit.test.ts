import { describe, expect, it, beforeEach } from "vitest";
import { assertRateLimit, resetRateLimitForTests } from "./rate-limit";
import { RateLimitError } from "./errors";

describe("demo rate limit", () => {
  beforeEach(() => resetRateLimitForTests());

  it("allows the first eight runs and rejects the ninth in a window", () => {
    for (let index = 0; index < 8; index += 1) assertRateLimit("test-ip", 1_000);
    expect(() => assertRateLimit("test-ip", 1_000)).toThrow(RateLimitError);
  });

  it("resets after the window", () => {
    for (let index = 0; index < 8; index += 1) assertRateLimit("test-ip", 1_000);
    expect(() => assertRateLimit("test-ip", 61_001)).not.toThrow();
  });
});
