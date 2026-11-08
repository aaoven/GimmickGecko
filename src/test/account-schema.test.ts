import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema, profileSchema } from "@/lib/account-schema";

describe("Account requirements", () => {
  it("requires username, email and password to sign up", () => {
    const account = { username: "owen_math", email: "owen@example.com", password: "long-password", display_name: "Owen" };
    expect(signupSchema.safeParse(account).success).toBe(true);
    for (const field of ["username", "email", "password"]) expect(signupSchema.safeParse({ ...account, [field]: "" }).success).toBe(false);
  });
  it("uses an email rather than a bare username for login", () => {
    expect(loginSchema.safeParse({ email: "owen@example.com", password: "long-password" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "owen_math", password: "long-password" }).success).toBe(false);
  });
  it("attributes signup errors to the field that failed", () => {
    const badUsername = signupSchema.safeParse({ username: "owen yang", email: "owen@example.com", password: "long-password", display_name: "" });
    expect(badUsername.success).toBe(false);
    if (!badUsername.success) expect(badUsername.error.issues[0]?.path[0]).toBe("username");
    const shortPassword = signupSchema.safeParse({ username: "owen", email: "owen@example.com", password: "short", display_name: "" });
    expect(shortPassword.success).toBe(false);
    if (!shortPassword.success) {
      expect(shortPassword.error.issues[0]?.path[0]).toBe("password");
      expect(shortPassword.error.issues[0]?.message).toBe("Use at least 8 characters.");
    }
  });
  it("supports additional editable profile details", () => {
    expect(profileSchema.parse({ username: "Owen_Math", display_name: "Owen", bio: "Practicing AIME" })).toEqual({ username: "owen_math", display_name: "Owen", bio: "Practicing AIME" });
    expect(profileSchema.safeParse({ username: "owen_math", display_name: "Owen", bio: "a".repeat(501) }).success).toBe(false);
  });
});