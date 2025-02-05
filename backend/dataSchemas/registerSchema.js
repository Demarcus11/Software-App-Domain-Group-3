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
  roleId: z.string({
    message: "Role is required",
  }),
  profilePicture: z.string().optional(),
  securityQuestions: z
    .array(
      z.object({
        questionId: z
          .string()
          .min(1, { message: "Security question ID is required" }),
        answer: z.string().min(1, { message: "Answer is required" }),
      })
    )
    .min(1, { message: "At least one security question is required" })
    .max(3, { message: "Maximum of 3 security questions allowed" }),
  address: z.string().min(1, {
    message: "Address is required",
  }),
  dateOfBirth: z
    .string()
    .min(1, { message: "Date of birth is required" })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date of birth must be in the format YYYY-MM-DD"
    )
    .transform((val) => new Date(val)),
});

export default registerSchema;
