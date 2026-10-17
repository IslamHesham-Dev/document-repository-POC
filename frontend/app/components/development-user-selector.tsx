"use client";

import { useCurrentUser } from "@/app/context/current-user-context";

export function DevelopmentUserSelector() {
  const { currentUser, error, isLoading, selectUser, users } = useCurrentUser();

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-extrabold uppercase tracking-[0.12em]">
          POC identity
        </span>
        {isLoading ? (
          <span>Loading seeded users…</span>
        ) : error ? (
          <span role="alert">{error}</span>
        ) : (
          <select
            aria-label="Current development user"
            className="max-w-52 rounded-md border border-amber-300 bg-white px-2 py-1 font-semibold"
            onChange={(event) => selectUser(event.target.value)}
            value={currentUser?.id ?? ""}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {currentUser ? (
        <p className="mt-1 text-amber-800">
          {currentUser.role} · {currentUser.department.name} · X-User-Id
        </p>
      ) : null}
      <p className="mt-1 text-amber-700">Development only — this is not authentication.</p>
    </div>
  );
}
