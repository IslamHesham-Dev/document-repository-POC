import Link from "next/link";
import type { ReactNode } from "react";
import { DevelopmentUserSelector } from "./development-user-selector";

// Shared visual frame for every route. Business/API state remains in the page
// workspaces and CurrentUserProvider rather than this layout component.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-[min(1120px,calc(100%-2rem))] flex-wrap items-center justify-between gap-4 py-3">
          <Link
            className="text-2xl font-extrabold leading-none tracking-[-0.04em] text-slate-900 sm:text-3xl"
            href="/"
          >
            Doc<span className="text-teal-700">Vault</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <nav aria-label="Primary navigation" className="flex gap-1 text-sm font-semibold text-slate-600">
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/documents">
                Documents
              </Link>
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/upload">
                Upload
              </Link>
            </nav>
            <DevelopmentUserSelector />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
