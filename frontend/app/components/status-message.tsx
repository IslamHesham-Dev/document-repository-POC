type StatusTone = "info" | "success" | "error";

const toneClasses: Record<StatusTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export function StatusMessage({
  message,
  tone = "info",
}: {
  message: string;
  tone?: StatusTone;
}) {
  // Errors use alert semantics for immediate announcement; ordinary progress
  // and success messages use the less disruptive status role.
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${toneClasses[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
