"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useCurrentUser } from "@/app/context/current-user-context";
import { ApiClientError, createDocument } from "@/app/lib/api";
import {
  acceptedFileTypes,
  validateUploadFile,
} from "@/app/lib/file-validation";
import { FormField } from "./form-field";
import { StatusMessage } from "./status-message";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting"; progress: number }
  | { status: "success"; documentId: string; title: string }
  | { status: "error"; message: string };

function commaSeparated(value: FormDataEntryValue | null): string[] {
  return typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

export function DocumentUploadForm() {
  const { currentUser, departments, isLoading } = useCurrentUser();
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("title") ?? "").trim();
    const file = values.get("file");

    if (!currentUser) {
      setSubmission({ status: "error", message: "Select a POC user before uploading." });
      return;
    }
    if (!title) {
      setSubmission({ status: "error", message: "Document title is required." });
      return;
    }
    if (!(file instanceof File)) {
      setSubmission({ status: "error", message: "Choose a file before uploading." });
      return;
    }
    const fileError = validateUploadFile(file);
    if (fileError) {
      setSubmission({ status: "error", message: fileError });
      return;
    }

    setSubmission({ status: "submitting", progress: 0 });

    try {
      // Next: app/lib/api.ts converts these values to multipart form data and
      // sends them to POST /documents with the selected POC identity.
      const result = await createDocument(
        {
          userId: currentUser.id,
          title,
          file,
          tags: commaSeparated(values.get("tags")),
          permittedDepartmentIds: values
            .getAll("permittedDepartmentIds")
            .map(String),
        },
        (progress) => setSubmission({ status: "submitting", progress }),
      );
      form.reset();
      setSubmission({
        status: "success",
        documentId: result.document.id,
        title: result.document.title,
      });
    } catch (error: unknown) {
      setSubmission({
        status: "error",
        message:
          error instanceof ApiClientError
            ? `${error.code}: ${error.message}`
            : "The upload could not be completed.",
      });
    }
  }

  const isSubmitting = submission.status === "submitting";

  return (
    <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
      <StatusMessage
        tone="info"
        message={
          currentUser
            ? `Uploading as ${currentUser.name} (${currentUser.role}, ${currentUser.department.name}). The API receives this identity through X-User-Id.`
            : "Waiting for the POC user selector."
        }
      />

      <FormField label="Document title" hint="Required; up to 255 characters.">
        <input
          className="form-control"
          disabled={isSubmitting}
          maxLength={255}
          name="title"
          required
          type="text"
        />
      </FormField>

      <FormField
        label="File"
        hint="Required. PDF, DOCX, or UTF-8 text; maximum 10 MB. The server verifies the actual content."
      >
        <input
          accept={acceptedFileTypes}
          className="form-control"
          disabled={isSubmitting}
          name="file"
          required
          type="file"
        />
      </FormField>

      <FormField label="Tags" hint="Optional tags separated with commas.">
        <input
          className="form-control"
          disabled={isSubmitting}
          name="tags"
          placeholder="policy, finance, confidential"
          type="text"
        />
      </FormField>

      <fieldset className="grid gap-3" disabled={isSubmitting || isLoading}>
        <legend className="text-sm font-bold text-slate-700">
          Permitted departments
        </legend>
        <p className="text-sm text-slate-500">
          Optional. Leaving every department clear keeps the document private to
          its uploader and administrators.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {departments.map((department) => (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              key={department.id}
            >
              <input
                className="size-4 accent-teal-700"
                name="permittedDepartmentIds"
                type="checkbox"
                value={department.id}
              />
              {department.name}
            </label>
          ))}
        </div>
      </fieldset>

      {isSubmitting ? (
        <div aria-live="polite" className="grid gap-2">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>Uploading…</span>
            <span>{submission.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-[width]"
              style={{ width: `${submission.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <button
        className="button w-fit bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || isLoading || !currentUser}
        type="submit"
      >
        {isSubmitting ? "Uploading…" : "Upload document"}
      </button>

      {submission.status === "error" ? (
        <StatusMessage message={submission.message} tone="error" />
      ) : null}
      {submission.status === "success" ? (
        <div className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-950" role="status">
          <p>
            <strong>Upload complete.</strong> “{submission.title}” was created as
            version 1.
          </p>
          <Link
            className="w-fit font-bold text-emerald-800 underline underline-offset-4"
            href={`/documents/${submission.documentId}`}
          >
            Open the created document
          </Link>
        </div>
      ) : null}
    </form>
  );
}
