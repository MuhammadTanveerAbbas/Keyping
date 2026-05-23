import { z } from "zod";

export const apiKeyTestSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  apiKey: z.string().min(1, "API key is required"),
  customEndpoint: z.string().url().optional().or(z.literal("")),
  customAuthHeader: z.string().optional(),
});

export const nicknameSchema = z.string().max(100, "Nickname too long").optional();
export const notesSchema = z.string().max(1000, "Notes too long").optional();

export const saveKeyTestSchema = z.object({
  provider: z.string().min(1),
  key_preview: z.string().min(1),
  nickname: nicknameSchema,
  notes: notesSchema,
  status: z.enum(["valid", "invalid", "limited"]),
  scopes: z.any().optional(),
  rate_limit_info: z.any().optional(),
  health_score: z.number().min(0).max(100).nullable().optional(),
  latency_ms: z.number().min(0).nullable().optional(),
  user_id: z.string().uuid(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long"),
  owner_id: z.string().uuid(),
});

export const createAlertSchema = z.object({
  key_nickname: z.string().min(1, "Key nickname is required").max(200),
  expiry_date: z.string().min(1, "Expiry date is required"),
  reminder_days: z.coerce.number().min(1).max(365),
  user_id: z.string().uuid(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
});

export type ApiKeyTestInput = z.infer<typeof apiKeyTestSchema>;
export type SaveKeyTestInput = z.infer<typeof saveKeyTestSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
