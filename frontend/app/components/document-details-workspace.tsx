"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useCurrentUser } from "@/app/context/current-user-context";
import {
  ApiClientError,
  downloadDocumentVersion,
  getDocument,
  getVersionHistory,
} from "@/app/lib/api";
import type {
  DocumentDetailsResponse,
  VersionHistoryResponse,
} from "@/app/types/api";
import { NewVersionForm } from "./new-version-form";
import { StatusMessage } from "./status-message";

type PageError = {
  status: number;
  message: string;
};

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

function DownloadButton({
  documentId,
  filename,
  label,
  userId,
  versionId,
}: {
  documentId: string;
  filename: string;
  label: string;
  userId: string;
  versionId: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);

    try {
      const download = await downloadDocumentVersion(
        userId,
        documentId,
        versionId,
        filename,
      );
      const objectUrl = URL.createObjectURL(download.blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = download.filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError: unknown) {
      setError(
        downloadError instanceof ApiClientError
          ? downloadError.message
          : "The file could not be downloaded.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="grid justify-items-end gap-1">
      <button
        className="button border border-teal-700 bg-white text-sm text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDownloading}
        onClick={() => void handleDownload()}
        type="button"
      >
        {isDownloading ? "Preparing…" : label}
      </button>
      {error ? (
        <p className="max-w-56 text-right text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DocumentDetailsWorkspace({ documentId }: { documentId: string }) {
  const { currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [details, setDetails] = useState<DocumentDetailsResponse | null>(null);
  const [history, setHistory] = useState<VersionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PageError | null>(null);
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
      setError({
        status: loadError instanceof ApiClientError ? loadError.status : 0,
        message:
          loadError instanceof ApiClientError
            ? loadError.message
            : "The document could not be loaded.",
      });
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
    const message =
      error?.status === 403
        ? "You do not have permission to view this document. Try another POC user or return to search."
        : error?.status === 404
          ? "This document could not be found. It may have been removed or the link may be incorrect."
          : error?.message ?? "Select a POC user to open this document.";

    return (
      <div className="grid gap-4">
        <StatusMessage message={message} tone="error" />
          <Link className="button button-back w-fit" href="/documents">
          Back to document search
        </Link>
      </div>
    );
  }

  const document = details.document;
  const canModify =
    currentUser.role === "ADMIN" || document.uploader.id === currentUser.id;

  return (
    <div className="grid gap-6">
      <Link className="button button-back w-fit" href="/documents">
        ← Back to document search
      </Link>
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
        <dl className="grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Uploader</dt>
            <dd className="mt-1 font-semibold text-slate-900">{document.uploader.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Permitted departments</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {document.accessScope === "ALL_DEPARTMENTS"
                ? "All departments"
                : document.permittedDepartments.length > 0
                  ? document.permittedDepartments.map((department) => department.name).join(", ")
                  : "Uploader and administrators only"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Current version</dt>
            <dd className="mt-1 font-semibold text-slate-900">Version {document.currentVersion.versionNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Created</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(document.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(document.updatedAt)}</dd>
          </div>
          <div className="flex items-end">
            {document.download?.versionId ? (
              <DownloadButton
                documentId={document.id}
                filename={document.download.filename}
                label="Download current version"
                userId={currentUser.id}
                versionId={document.download.versionId}
              />
            ) : null}
          </div>
        </dl>
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
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-slate-500">
                    <p>{version.uploader.name}</p>
                    <p>{formatDate(version.uploadedAt)}</p>
                  </div>
                  <DownloadButton
                    documentId={document.id}
                    filename={version.originalFilename}
                    label={`Download version ${version.versionNumber}`}
                    userId={currentUser.id}
                    versionId={version.id}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
