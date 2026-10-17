"use client";

import { useCallback, useEffect, useState } from "react";

import { useCurrentUser } from "@/app/context/current-user-context";
import {
  ApiClientError,
  getDocument,
  getVersionHistory,
} from "@/app/lib/api";
import type {
  DocumentDetailsResponse,
  VersionHistoryResponse,
} from "@/app/types/api";
import { NewVersionForm } from "./new-version-form";
import { StatusMessage } from "./status-message";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetailsWorkspace({ documentId }: { documentId: string }) {
  const { currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [details, setDetails] = useState<DocumentDetailsResponse | null>(null);
  const [history, setHistory] = useState<VersionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVersionForm, setShowVersionForm] = useState(false);

  const loadDocument = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);

    try {
      const [nextDetails, nextHistory] = await Promise.all([
        getDocument(currentUser.id, documentId),
        getVersionHistory(currentUser.id, documentId),
      ]);
      setDetails(nextDetails);
      setHistory(nextHistory);
    } catch (loadError: unknown) {
      setDetails(null);
      setHistory(null);
      setError(
        loadError instanceof ApiClientError
          ? `${loadError.code}: ${loadError.message}`
          : "The document could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, documentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocument();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDocument]);

  if (isUserLoading || (isLoading && !details)) {
    return <StatusMessage message="Loading document and version history…" />;
  }

  if (error || !details || !history || !currentUser) {
    return (
      <StatusMessage
        message={error ?? "Select a POC user to open this document."}
        tone="error"
      />
    );
  }

  const document = details.document;
  const canModify =
    currentUser.role === "ADMIN" || document.uploader.id === currentUser.id;

  return (
    <div className="grid gap-6">
      <section className="card grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Document details</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-slate-950">
              {document.title}
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Uploaded by {document.uploader.name} · Updated {formatDate(document.updatedAt)}
            </p>
          </div>
          {canModify ? (
            <button
              className="button bg-teal-700 text-white hover:bg-teal-800"
              onClick={() => setShowVersionForm((visible) => !visible)}
              type="button"
            >
              {showVersionForm ? "Close version form" : "Upload new version"}
            </button>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Read-only access
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {document.tags.length > 0 ? (
            document.tags.map((tag) => (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800" key={tag}>
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No tags</span>
          )}
        </div>
        {showVersionForm && canModify ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <NewVersionForm documentId={documentId} onUploaded={loadDocument} />
          </div>
        ) : null}
      </section>

      <section className="card">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Immutable history</p>
            <h2 className="section-title">Versions</h2>
          </div>
          <span className="text-sm font-semibold text-slate-500">
            {history.versions.length} total
          </span>
        </div>
        <ol className="mt-6 grid gap-3">
          {history.versions.map((version) => (
            <li className="rounded-xl border border-slate-200 p-4" key={version.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    Version {version.versionNumber}
                    {version.isCurrent ? (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {version.originalFilename} · {formatBytes(version.fileSize)}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{version.uploader.name}</p>
                  <p>{formatDate(version.uploadedAt)}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
