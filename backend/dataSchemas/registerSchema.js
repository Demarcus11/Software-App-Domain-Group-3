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
  address: z.string().min(1, {
    message: "Address is required",
  }),
  dateOfBirth: z
    .string()
    .min(1, {
      message: "Date of birth is required",
    })
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, {
      message:
        "Invalid date format. Use ISO 8601 format (e.g. 2000-01-01T00:00:00Z)",
    }),
});

export default registerSchema;
