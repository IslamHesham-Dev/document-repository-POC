import type { Metadata } from "next";

import { DocumentUploadForm } from "@/app/components/document-upload-form";

export const metadata: Metadata = { title: "Upload" };

export default function UploadPage() {
  // Next: DocumentUploadForm gathers values, validates for quick feedback, and
  // passes the multipart workflow to app/lib/api.ts.
  return (
    <main className="page-shell max-w-3xl">
      <p className="eyebrow">New document</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-slate-950">
        Upload a controlled file
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        The backend validates the actual file contents, stores the file safely,
        and creates version 1 together with its metadata.
      </p>
      <section className="card mt-8">
        <DocumentUploadForm />
      </section>
    </main>
  );
}
