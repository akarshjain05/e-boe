import { z } from "zod"

export const loginSchema = z.object({
  gstNumber: z.string().min(1, { message: "GST Number is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  rememberMe: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
      message: "Password must contain uppercase, lowercase, number and special character"
    }),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  ownerPan: z.string().min(10, { message: "Invalid PAN format" }),
  
  // Company details
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  organizationType: z.string().min(1, { message: "Organization type is required" }),
  companyEmail: z.string().email({ message: "Invalid company email address" }),
  companyPan: z.string().min(10, { message: "Invalid PAN format" }),
  companyPhone: z.string().min(1, { message: "Company phone is required" }),
  companyWebsite: z.string().optional(),
  gstNumber: z.string().min(1, { message: "GST Number is required" }),
  
  // Address details
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type RegisterFormValues = z.infer<typeof registerSchema>
