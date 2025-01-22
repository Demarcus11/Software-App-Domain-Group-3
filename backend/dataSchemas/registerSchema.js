import * as z from "zod";

const RoleEnum = z.enum(["Admin", "User", "Manager"]);

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
  role: RoleEnum.refine((val) => ["Admin", "User", "Manager"].includes(val), {
    message: "Invalid role. Please select either Admin, User, or Manager",
  }),
  profilePicture: z.string().url().optional(),
  securityQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

export default registerSchema;
