import { headers } from "next/headers";
import { originFromHeaders } from "@/lib/url";

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const origin = originFromHeaders(requestHeaders);

  if (!origin) {
    throw new Error("Request origin is unavailable.");
  }

  return origin;
}
