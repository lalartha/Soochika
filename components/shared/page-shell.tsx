import Link from "next/link";
import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
  children: ReactNode;
};

export function PageShell({ title, description, action, children }: PageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-zinc-400">{description}</p>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-zinc-900 ${className}`}>
      {children}
    </section>
  );
}
