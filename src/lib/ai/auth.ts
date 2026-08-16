import { createHash, timingSafeEqual } from "node:crypto";
import { AppError } from "./errors";

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized.", "UNAUTHORIZED", 401);
  }
}

/**
 * Optional bearer guard for the public demo.
 *
 * If PROVIDER_API_KEY is set, the request must carry
 * `Authorization: Bearer <key>` (constant-time comparison, 401 otherwise).
 * If the env var is unset, the route behaves exactly as before — no auth.
 */
export function assertBearerAuth(request: Request): void {
  const expected = process.env.PROVIDER_API_KEY;
  if (!expected) return;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const provided = match ? match[1] : "";
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) throw new UnauthorizedError();
}
