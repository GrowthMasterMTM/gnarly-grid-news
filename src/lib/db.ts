import { PrismaClient } from "@prisma/client";

function validateDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please configure it in .env or your deployment environment."
    );
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  validateDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Safely execute a database query, returning null on connection errors
 * instead of throwing. Use for pages that should degrade gracefully.
 */
export async function safeQuery<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (isDatabaseError(err)) {
      console.error("[DB] Error:", (err as Error).message?.slice(0, 120));
      return null;
    }
    throw err;
  }
}

function isDatabaseError(err: unknown): boolean {
  if (err instanceof TypeError) {
    // Prisma client not generated or model missing
    const msg = err.message.toLowerCase();
    return msg.includes("cannot read properties of undefined");
  }
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("can't reach database") ||
    msg.includes("connection refused") ||
    msg.includes("econnrefused") ||
    msg.includes("p1001") ||
    msg.includes("p1003") ||
    msg.includes("p2021") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("database_url") ||
    msg.includes("prismaclient")
  );
}
