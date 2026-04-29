import { NextResponse } from "next/server";
import { z } from "zod";

type SearchParamsInput = Request | URLSearchParams | Record<string, string | string[] | undefined>;

export function jsonOk<T extends object>(payload?: T) {
  return NextResponse.json(payload ?? ({ ok: true } as T));
}

export function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json(code ? { error: message, code } : { error: message }, { status });
}

export function parseWithSchema<T>(value: unknown, schema: z.ZodType<T>) {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

export async function readRouteParams<T>(input: Promise<unknown> | unknown, schema: z.ZodType<T>) {
  return parseWithSchema(await input, schema);
}

export async function readJsonBody<T>(request: Request, schema?: z.ZodType<T>): Promise<T | null> {
  try {
    const parsed = await request.json();
    return schema ? parseWithSchema(parsed, schema) : (parsed as T);
  } catch {
    return null;
  }
}

function searchParamsToRecord(searchParams: URLSearchParams) {
  const record: Record<string, string | string[]> = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    record[key] = values.length <= 1 ? (values[0] ?? "") : values;
  }

  return record;
}

function resolveSearchParams(input: SearchParamsInput) {
  if (input instanceof Request) {
    return new URL(input.url).searchParams;
  }

  if (input instanceof URLSearchParams) {
    return input;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

export function readSearchParams<T>(input: SearchParamsInput, schema: z.ZodType<T>) {
  return parseWithSchema(searchParamsToRecord(resolveSearchParams(input)), schema);
}

export function trimmedSearchParam(request: Request, key: string) {
  return new URL(request.url).searchParams.get(key)?.trim() ?? "";
}

function formDataToRecord(formData: FormData) {
  const record: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};

  for (const [key, value] of formData.entries()) {
    const current = record[key];

    if (current === undefined) {
      record[key] = value;
      continue;
    }

    record[key] = Array.isArray(current) ? [...current, value] : [current, value];
  }

  return record;
}

export async function readFormData<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  try {
    return parseWithSchema(formDataToRecord(await request.formData()), schema);
  } catch {
    return null;
  }
}

export function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

export function jsonFromKnownError(
  error: unknown,
  knownErrors: Record<string, { message: string; status: number }>,
  fallback: { message: string; status: number }
) {
  const code = errorMessage(error);
  const known = knownErrors[code];
  return jsonError(known?.message ?? fallback.message, known?.status ?? fallback.status, known ? code : undefined);
}

export function jsonFromAuthError(
  error: unknown,
  messages = {
    unauthorized: "请先登录。",
    forbidden: "没有访问权限。",
  }
) {
  return jsonFromKnownError(
    error,
    {
      UNAUTHORIZED: { message: messages.unauthorized, status: 401 },
      FORBIDDEN: { message: messages.forbidden, status: 403 },
    },
    { message: messages.forbidden, status: 403 }
  );
}
