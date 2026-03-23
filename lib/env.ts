import { z } from "zod";

const environmentSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1, "Missing CLERK_SECRET_KEY").optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
    .optional(),
  DATABASE_URL: z.string().min(1, "Missing DATABASE_URL").optional(),
  NEXT_PUBLIC_FLOWS_ORGANIZATION_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FLOWS_ENVIRONMENT: z.string().default("production")
});

export const env = environmentSchema.parse({
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_FLOWS_ORGANIZATION_ID: process.env.NEXT_PUBLIC_FLOWS_ORGANIZATION_ID,
  NEXT_PUBLIC_FLOWS_ENVIRONMENT: process.env.NEXT_PUBLIC_FLOWS_ENVIRONMENT
});
