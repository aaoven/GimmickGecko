import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(254);
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128);
export const profileSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/, "Use 3–24 letters, numbers, or underscores."),
  display_name: z.string().trim().max(80),
  bio: z.string().trim().max(500),
});
export const signupSchema = profileSchema.pick({ username: true, display_name: true }).extend({ email: emailSchema, password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(128) });