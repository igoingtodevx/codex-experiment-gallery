export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class InputError extends AppError {
  constructor(message: string) {
    super(message, "INVALID_INPUT", 400);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Demo limit reached. Try again in a minute.", "RATE_LIMITED", 429);
  }
}

export class ProviderConfigError extends AppError {
  constructor() {
    super("The AI provider is not configured for this demo.", "PROVIDER_NOT_CONFIGURED", 503);
  }
}

export class ProviderRequestError extends AppError {
  constructor(message = "The AI provider could not complete this run.", status = 502) {
    super(message, "PROVIDER_REQUEST_FAILED", status);
  }
}

export class ProviderOutputError extends AppError {
  constructor(message = "The provider returned an unusable structured result.") {
    super(message, "INVALID_PROVIDER_OUTPUT", 502);
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}
