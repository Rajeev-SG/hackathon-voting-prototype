import { z } from "zod";

const environmentSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1, "Missing CLERK_SECRET_KEY").optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
    .optional(),
  DATABASE_URL: z.string().min(1, "Missing DATABASE_URL").optional(),
  HOTFIX_DATABASE_URL: z.string().min(1, "Missing HOTFIX_DATABASE_URL").optional(),
  HOTFIX_DATABASE_URL_UNPOOLED: z.string().min(1, "Missing HOTFIX_DATABASE_URL_UNPOOLED").optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_GTM_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_GTM_SCRIPT_ORIGIN: z.string().min(1).optional(),
  NEXT_PUBLIC_SERVER_CONTAINER_URL: z.string().url().optional(),
  SGTM_UPSTREAM_ORIGIN: z.string().url().optional(),
  NEXT_PUBLIC_FLOWS_ORGANIZATION_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FLOWS_ENVIRONMENT: z.string().default("production")
});

export const env = environmentSchema.parse({
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  HOTFIX_DATABASE_URL: process.env.HOTFIX_DATABASE_URL,
  HOTFIX_DATABASE_URL_UNPOOLED: process.env.HOTFIX_DATABASE_URL_UNPOOLED,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_GTM_SCRIPT_ORIGIN: process.env.NEXT_PUBLIC_GTM_SCRIPT_ORIGIN,
  NEXT_PUBLIC_SERVER_CONTAINER_URL: process.env.NEXT_PUBLIC_SERVER_CONTAINER_URL,
  SGTM_UPSTREAM_ORIGIN: process.env.SGTM_UPSTREAM_ORIGIN,
  NEXT_PUBLIC_FLOWS_ORGANIZATION_ID: process.env.NEXT_PUBLIC_FLOWS_ORGANIZATION_ID,
  NEXT_PUBLIC_FLOWS_ENVIRONMENT: process.env.NEXT_PUBLIC_FLOWS_ENVIRONMENT
});
