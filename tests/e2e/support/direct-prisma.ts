import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrls } from "@/lib/database-config";

export function createDirectPrismaClient() {
  const { runtimeUrl } = resolveDatabaseUrls({
    DATABASE_URL: process.env.DATABASE_URL,
    HOTFIX_DATABASE_URL: process.env.HOTFIX_DATABASE_URL,
    HOTFIX_DATABASE_URL_UNPOOLED: process.env.HOTFIX_DATABASE_URL_UNPOOLED
  });

  if (!runtimeUrl) {
    throw new Error("Missing DATABASE_URL or HOTFIX_DATABASE_URL for direct Prisma access.");
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: runtimeUrl
      }
    }
  });
}
