import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-[min(1120px,calc(100%-2rem))] items-center justify-between gap-5">
          <Link className="font-extrabold tracking-[-0.03em] text-slate-900" href="/">
            Doc<span className="text-teal-700">Vault</span>
          </Link>
          <nav aria-label="Primary navigation" className="flex gap-1 text-sm font-semibold text-slate-600">
            <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/documents">
              Documents
            </Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/upload">
              Upload
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
