import type { Metadata } from "next";

import { StatusMessage } from "@/app/components/status-message";

export const metadata: Metadata = { title: "Document details" };

export default async function DocumentDetailsPage({
  params,
}: PageProps<"/documents/[id]">) {
  const { id } = await params;

  return (
    <main className="page-shell">
      <p className="eyebrow">Document details</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-slate-950">
        Document workspace
      </h1>
      <p className="mt-3 font-mono text-sm text-slate-500">{id}</p>
      <div className="mt-8 max-w-2xl">
        <StatusMessage
          message="This dynamic route is ready for document metadata, version history, and download actions."
          tone="info"
        />
      </div>
    </main>
  );
}
