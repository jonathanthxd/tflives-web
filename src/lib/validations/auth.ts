import { z } from "zod";

const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

export const usernameSchema = z
  .string()
  .min(3, "El username debe tener al menos 3 caracteres")
  .max(20, "El username no puede superar los 20 caracteres")
  .regex(
    USERNAME_REGEX,
    "Solo minúsculas, números y guion bajo. Debe empezar con una letra."
  );

export const emailSchema = z.string().email("Ingresá un email válido");

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "El nombre es obligatorio"),
    lastName: z.string().trim().min(1, "El apellido es obligatorio"),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
