import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-3 text-base text-slate-600">
          This page is not available in the Soochika portal yet.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-md bg-teal-700 px-4 py-2 font-semibold text-white">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
