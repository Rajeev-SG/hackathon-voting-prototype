import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL ?? ""
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const transientDatabaseMessages = [
  "Failed to connect to upstream database",
  "Can't reach database server",
  "Timed out during query execution"
];

function isTransientDatabaseError(error: unknown) {
  return (
    error instanceof Error &&
    transientDatabaseMessages.some((message) => error.message.includes(message))
  );
}

export async function withPrismaRetry<T>(operation: () => Promise<T>, attempts = 5) {
  let attempt = 0;

  while (attempt < attempts) {
    attempt += 1;

    try {
      return await operation();
    } catch (error) {
      if (!isTransientDatabaseError(error) || attempt >= attempts) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 100 * 2 ** (attempt - 1));
      });
    }
  }

  throw new Error("Database retry loop exited unexpectedly.");
}
