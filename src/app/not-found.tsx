import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-neutral-400">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-white px-6 py-3 font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
      >
        Back to home
      </Link>
    </div>
  );
}
