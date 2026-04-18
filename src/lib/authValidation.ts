import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Enter a valid email address" })
  .max(255, { message: "Email is too long" });

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password is too long" })
  .regex(/[A-Z]/, { message: "Include at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Include at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Include at least one number" });

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Name must be at least 2 characters" })
  .max(100, { message: "Name is too long" });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }).max(72),
});

export const signUpSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Map raw Supabase auth errors to user-friendly messages. */
export const friendlyAuthError = (message?: string | null): string => {
  if (!message) return "Something went wrong. Please try again.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return "Please verify your email before signing in. Check your inbox for the verification link.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("password")) return message;
  if (m.includes("network")) return "Network error. Check your connection and try again.";
  return message;
};
