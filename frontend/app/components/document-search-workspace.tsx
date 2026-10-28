"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { useCurrentUser } from "@/app/context/current-user-context";
import { ApiClientError, searchDocuments } from "@/app/lib/api";
import type { DocumentSearchResponse } from "@/app/types/api";
import { FormField } from "./form-field";
import { StatusMessage } from "./status-message";

type SearchFilters = {
  title: string;
  tag: string;
  uploaderId: string;
};

const emptyFilters: SearchFilters = {
  title: "",
  tag: "",
  uploaderId: "",
};
const pageSize = 6;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DocumentSearchWorkspace() {
  const { currentUser, isLoading: isUserLoading, users } = useCurrentUser();
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<DocumentSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy: "updatedAt",
      sortOrder: "desc",
    });

    if (appliedFilters.title) query.set("title", appliedFilters.title);
    if (appliedFilters.tag) query.set("tag", appliedFilters.tag);
    if (appliedFilters.uploaderId) {
      query.set("uploaderId", appliedFilters.uploaderId);
    }

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      // Next: app/lib/api.ts adds X-User-Id and calls the permission-aware
      // GET /documents backend workflow with these filters and page settings.
      searchDocuments(currentUser.id, query)
        .then((response) => {
          if (active) setResults(response);
        })
        .catch((searchError: unknown) => {
          if (!active) return;
          setResults(null);
          setError(
            searchError instanceof ApiClientError
              ? `${searchError.code}: ${searchError.message}`
              : "Documents could not be loaded.",
          );
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [appliedFilters, currentUser, page]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({
      title: draftFilters.title.trim(),
      tag: draftFilters.tag.trim(),
      uploaderId: draftFilters.uploaderId,
    });
    setPage(1);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  return (
    <div className="grid gap-6">
      <section className="card">
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end" onSubmit={applyFilters}>
          <FormField label="Title contains">
            <input
              className="form-control"
              onChange={(event) =>
                setDraftFilters((filters) => ({
                  ...filters,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. policy"
              type="search"
              value={draftFilters.title}
            />
          </FormField>
          <FormField label="Tag">
            <input
              className="form-control"
              onChange={(event) =>
                setDraftFilters((filters) => ({
                  ...filters,
                  tag: event.target.value,
                }))
              }
              placeholder="e.g. finance"
              type="search"
              value={draftFilters.tag}
            />
          </FormField>
          <FormField label="Uploader">
            <select
              className="form-control"
              onChange={(event) =>
                setDraftFilters((filters) => ({
                  ...filters,
                  uploaderId: event.target.value,
                }))
              }
              value={draftFilters.uploaderId}
            >
              <option value="">Any uploader</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex gap-2">
            <button
              className="button bg-teal-700 text-white hover:bg-teal-800"
              disabled={!currentUser || isUserLoading}
              type="submit"
            >
              Search
            </button>
            <button
              className="button border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {isUserLoading || isLoading ? (
        <StatusMessage message="Loading permission-aware documents…" />
      ) : error ? (
        <StatusMessage message={error} tone="error" />
      ) : results && results.documents.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-xl font-bold text-slate-900">No documents found</p>
          <p className="mt-2 text-slate-500">
            Try clearing a filter or searching with a broader title or tag.
          </p>
        </div>
      ) : results ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-600">
              {results.pagination.totalItems} document
              {results.pagination.totalItems === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-slate-500">Newest updates first</p>
          </div>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.documents.map((document) => (
              <article className="card flex min-h-72 flex-col" key={document.id}>
                <div className="flex flex-wrap gap-2">
                  {document.tags.length > 0 ? (
                    document.tags.map((tag) => (
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800" key={tag}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">No tags</span>
                  )}
                </div>
                <h2 className="mt-5 text-xl font-bold tracking-[-0.025em] text-slate-950">
                  {document.title}
                </h2>
                <dl className="mt-5 grid gap-2 text-sm text-slate-600">
                  <div className="flex justify-between gap-4">
                    <dt>Uploader</dt>
                    <dd className="font-semibold text-slate-800">{document.uploader.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Current version</dt>
                    <dd className="font-semibold text-slate-800">
                      {document.currentVersion
                        ? `v${document.currentVersion.versionNumber}`
                        : "Unavailable"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Last updated</dt>
                    <dd className="text-right font-semibold text-slate-800">
                      {formatDate(document.updatedAt)}
                    </dd>
                  </div>
                </dl>
                <Link
                  className="mt-auto pt-6 font-bold text-teal-700 hover:text-teal-900"
                  href={`/documents/${document.id}`}
                >
                  Open document →
                </Link>
              </article>
            ))}
          </section>
          <nav aria-label="Search result pages" className="flex items-center justify-center gap-4">
            <button
              className="button border border-slate-300 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!results.pagination.hasPreviousPage || isLoading}
              onClick={() => setPage((current) => current - 1)}
              type="button"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-slate-700">
              Page {results.pagination.page} of {Math.max(results.pagination.totalPages, 1)}
            </span>
            <button
              className="button border border-slate-300 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!results.pagination.hasNextPage || isLoading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Next
            </button>
          </nav>
        </>
      ) : null}
    </div>
  );
}
