import { z } from "zod";

function formatSchemaIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function logSchemaMismatch(scope: string, error: z.ZodError) {
  console.warn(`[${scope}] Invalid data`, formatSchemaIssues(error));
}

export function parseExternalValue<T>(value: unknown, schema: z.ZodType<T>, scope: string) {
  const result = schema.safeParse(value);

  if (!result.success) {
    logSchemaMismatch(scope, result.error);
    return null;
  }

  return result.data;
}

export function parseExternalArray<T>(value: unknown, schema: z.ZodType<T>, scope: string) {
  if (!Array.isArray(value)) {
    console.warn(`[${scope}] Invalid data`, [{ path: "", message: "Expected array" }]);
    return [] as T[];
  }

  return value.flatMap((item, index) => {
    const parsed = parseExternalValue(item, schema, `${scope}[${index}]`);
    return parsed ? [parsed] : [];
  });
}

export function firstIssueMessage(error: z.ZodError, fallback: string) {
  return error.issues[0]?.message ?? fallback;
}
