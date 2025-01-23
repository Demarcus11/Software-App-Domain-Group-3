import * as z from "zod";

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^[A-Za-z]/, {
      message: "Password must start with a letter",
    })
    .regex(/[A-Za-z]/, {
      message: "Password must contain at least one letter",
    })
    .regex(/\d/, {
      message: "Password must contain at least one number",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

export default resetPasswordSchema;
