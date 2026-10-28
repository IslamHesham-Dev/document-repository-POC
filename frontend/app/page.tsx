import Link from "next/link";

import { StatusMessage } from "@/app/components/status-message";
import { apiBaseUrl } from "@/app/lib/config";

const features = [
  "Permission-aware document search",
  "Immutable file version history",
  "Department-based access",
  "Safe streamed downloads",
];

export default function HomePage() {
  // This server-rendered landing page only links to the two interactive feature
  // routes; their client components own API calls and state.
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Document repository POC</p>
          <h1 className="hero-title">One place for every controlled document.</h1>
          <p className="hero-copy">
            Upload, find, version, and download documents while keeping access
            tied to the people and departments that should see them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="button button-primary" href="/upload">
            Upload a document
          </Link>
          <Link className="button button-secondary" href="/documents">
            Browse documents
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card">
          <p className="eyebrow">Foundation ready</p>
          <h2 className="section-title">Frontend routes and shared modules</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li className="feature-item" key={feature}>
                <span aria-hidden="true" className="feature-dot" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <p className="eyebrow">Backend connection</p>
          <h2 className="section-title">API base URL</h2>
          <code className="mt-5 block overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-sm text-cyan-200">
            {apiBaseUrl}
          </code>
          <div className="mt-5">
            <StatusMessage
              tone="info"
              message="The API client is configured. User selection will use the POC X-User-Id header."
            />
          </div>
        </div>
      </section>
    </main>
  );
}
