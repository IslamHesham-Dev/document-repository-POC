import type { ReactNode } from "react";

// Shared label/hint wrapper keeps form controls accessible and visually
// consistent without repeating markup in upload and search forms.
export function FormField({
  children,
  hint,
  label,
}: {
  children: ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="form-label">
      <span>{label}</span>
      {children}
      {hint ? <span className="font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}
