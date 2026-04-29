import { z } from "zod";

export const AUTH_DIALOG_MODES = ["sign-in", "sign-up"] as const;
export const authDialogModeSchema = z.enum(AUTH_DIALOG_MODES);

export const pendingAuthDialogQuerySchema = z.object({
  auth: z.literal("1"),
  next: z.string().optional(),
  mode: z.string().optional(),
  error: z.string().optional(),
});
