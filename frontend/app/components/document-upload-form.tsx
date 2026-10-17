"use client";

import { useState, type FormEvent } from "react";

import { ApiClientError, createDocument } from "@/app/lib/api";
import { FormField } from "./form-field";
import { StatusMessage } from "./status-message";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function commaSeparated(value: FormDataEntryValue | null): string[] {
  return typeof value === "string"
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

export function DocumentUploadForm() {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const file = values.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setSubmission({ status: "error", message: "Choose a file before uploading." });
      return;
    }

    setSubmission({ status: "submitting" });

    try {
      const result = await createDocument({
        userId: String(values.get("userId") ?? "").trim(),
        title: String(values.get("title") ?? ""),
        file,
        tags: commaSeparated(values.get("tags")),
        permittedDepartmentIds: commaSeparated(values.get("departments")),
      });
      form.reset();
      setSubmission({
        status: "success",
        message: `Created “${result.document.title}” as version 1.`,
      });
    } catch (error: unknown) {
      setSubmission({
        status: "error",
        message:
          error instanceof ApiClientError
            ? error.message
            : "The upload could not be completed.",
      });
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <FormField label="Current user ID" hint="Use a seeded user UUID for the POC X-User-Id header.">
        <input className="form-control" name="userId" required type="text" />
      </FormField>
      <FormField label="Document title">
        <input className="form-control" maxLength={255} name="title" required type="text" />
      </FormField>
      <FormField label="File" hint="PDF, DOCX, or UTF-8 text; maximum 10 MB.">
        <input className="form-control" name="file" required type="file" />
      </FormField>
      <FormField label="Tags" hint="Optional, separated with commas.">
        <input className="form-control" name="tags" placeholder="policy, finance" type="text" />
      </FormField>
      <FormField label="Permitted department IDs" hint="Optional UUIDs separated with commas.">
        <input className="form-control" name="departments" type="text" />
      </FormField>
      <button
        className="button w-fit bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
        disabled={submission.status === "submitting"}
        type="submit"
      >
        {submission.status === "submitting" ? "Uploading…" : "Upload document"}
      </button>
      {submission.status === "success" || submission.status === "error" ? (
        <StatusMessage message={submission.message} tone={submission.status} />
      ) : null}
    </form>
  );
}
