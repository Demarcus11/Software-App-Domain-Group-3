import * as z from "zod";

const registerSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z
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
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  roleId: z.number({
    message: "Role is required",
  }),
  profilePicture: z.string().url().optional(),
  securityQuestion: z.object({
    id: z.number(),
    answer: z.string(),
  }),
});

export default registerSchema;
