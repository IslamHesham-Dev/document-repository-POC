"use client";

import { useState, type FormEvent } from "react";

import { useCurrentUser } from "@/app/context/current-user-context";
import { ApiClientError, createDocumentVersion } from "@/app/lib/api";
import {
  acceptedFileTypes,
  validateUploadFile,
} from "@/app/lib/file-validation";
import { FormField } from "./form-field";
import { StatusMessage } from "./status-message";

type VersionUploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "success"; versionNumber: number }
  | { status: "error"; message: string };

export function NewVersionForm({
  documentId,
  onUploaded,
}: {
  documentId: string;
  onUploaded: () => Promise<void>;
}) {
  const { currentUser } = useCurrentUser();
  const [state, setState] = useState<VersionUploadState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");

    if (!currentUser) {
      setState({ status: "error", message: "Select a POC user first." });
      return;
    }
    if (!(file instanceof File)) {
      setState({ status: "error", message: "Choose a replacement file." });
      return;
    }
    const fileError = validateUploadFile(file);
    if (fileError) {
      setState({ status: "error", message: fileError });
      return;
    }

    setState({ status: "uploading", progress: 0 });

    try {
      // Next: app/lib/api.ts sends the file to the version endpoint; on success,
      // the parent detail workspace reloads both details and immutable history.
      const result = await createDocumentVersion(
        { documentId, file, userId: currentUser.id },
        (progress) => setState({ status: "uploading", progress }),
      );
      form.reset();
      setState({
        status: "success",
        versionNumber: result.version.versionNumber,
      });
      await onUploaded();
    } catch (error: unknown) {
      setState({
        status: "error",
        message:
          error instanceof ApiClientError
            ? `${error.code}: ${error.message}`
            : "The new version could not be uploaded.",
      });
    }
  }

  const isUploading = state.status === "uploading";

  return (
    <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
      <StatusMessage
        tone="info"
        message="Uploading creates a new immutable version. Every previous version and its download remain available."
      />
      <FormField
        label="Replacement file"
        hint="PDF, DOCX, or UTF-8 text; maximum 10 MB. The original filename is preserved as metadata."
      >
        <input
          accept={acceptedFileTypes}
          className="form-control"
          disabled={isUploading}
          name="file"
          required
          type="file"
        />
      </FormField>
      {isUploading ? (
        <div aria-live="polite" className="grid gap-2">
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>Uploading new version…</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-[width]"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      ) : null}
      <button
        className="button w-fit bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isUploading || !currentUser}
        type="submit"
      >
        {isUploading ? "Uploading…" : "Upload new version"}
      </button>
      {state.status === "error" ? (
        <StatusMessage message={state.message} tone="error" />
      ) : null}
      {state.status === "success" ? (
        <StatusMessage
          message={`Version ${state.versionNumber} uploaded. Version history has been refreshed.`}
          tone="success"
        />
      ) : null}
    </form>
  );
}
