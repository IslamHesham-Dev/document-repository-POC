import type { ReactNode } from "react";

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
