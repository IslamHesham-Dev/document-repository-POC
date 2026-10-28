import type { Metadata } from "next";

import { DocumentSearchWorkspace } from "@/app/components/document-search-workspace";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  // Next: DocumentSearchWorkspace owns filter state and calls app/lib/api.ts.
  return (
    <main className="page-shell">
      <p className="eyebrow">Repository</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-slate-950">
        Find documents
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        Results automatically follow the selected POC user&apos;s uploader,
        department, and administrator permissions.
      </p>
      <div className="mt-8">
        <DocumentSearchWorkspace />
      </div>
    </main>
  );
}
