export const maximumFileSize = 10 * 1024 * 1024;
export const acceptedFileTypes =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const allowedExtensions = new Set(["pdf", "docx", "txt"]);

export function validateUploadFile(file: File): string | null {
  // These checks provide immediate feedback only. The backend independently
  // verifies size, filename, and actual bytes because browser input is untrusted.
  if (file.size === 0) return "Choose a non-empty file.";
  if (file.size > maximumFileSize) return "The file must be 10 MB or smaller.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.has(extension)) {
    return "Choose a PDF, DOCX, or TXT file.";
  }
  return null;
}
