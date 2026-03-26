"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDbError =
    error.message?.includes("database") ||
    error.message?.includes("prisma") ||
    error.message?.includes("PrismaClient");

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-white">Something went wrong</h1>
      <p className="mt-4 max-w-md text-neutral-400">
        {isDbError
          ? "Unable to connect to the database. Please ensure PostgreSQL is running."
          : "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-white px-6 py-3 font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
      >
        Try again
      </button>
    </div>
  );
}
