import type { Metadata } from "next";

import { DocumentDetailsWorkspace } from "@/app/components/document-details-workspace";

export const metadata: Metadata = { title: "Document details" };

export default async function DocumentDetailsPage({
  params,
}: PageProps<"/documents/[id]">) {
  const { id } = await params;

  return (
    <main className="page-shell">
      <DocumentDetailsWorkspace documentId={id} />
    </main>
  );
}
