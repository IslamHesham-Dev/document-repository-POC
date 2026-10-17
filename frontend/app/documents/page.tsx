import type { Metadata } from "next";

import { StatusMessage } from "@/app/components/status-message";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">Repository</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-slate-950">
        Documents
      </h1>
      <div className="mt-8 max-w-2xl">
        <StatusMessage
          message="The document route is ready. Search controls and result cards can now be added using the shared API client and response types."
          tone="info"
        />
      </div>
    </main>
  );
}
