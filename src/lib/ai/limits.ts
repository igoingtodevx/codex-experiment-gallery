import { InputError } from "./errors";

export const MAX_REQUEST_BYTES = Number(process.env.MAX_REQUEST_BYTES || 1_500_000);
export const MAX_IMAGE_BYTES = 1_000_000;
const allowedImages = new Set(["image/png", "image/jpeg", "image/webp"]);

export function assertRequestSize(request: Request): void {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_REQUEST_BYTES) {
    throw new InputError("Request is too large. Keep text under 45,000 characters and images under 1 MB.");
  }
}

export function validateImage(file: File): void {
  if (!allowedImages.has(file.type)) throw new InputError("Only PNG, JPEG, and WebP screenshots are accepted.");
  if (file.size > MAX_IMAGE_BYTES) throw new InputError("Screenshot is too large. The limit is 1 MB.");
}

export async function readFileBytes(file: File): Promise<Buffer> {
  validateImage(file);
  return Buffer.from(await file.arrayBuffer());
}
