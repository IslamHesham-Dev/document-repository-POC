"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getPocContext } from "@/app/lib/api";
import type {
  DepartmentSummary,
  DevelopmentUser,
} from "@/app/types/api";

type CurrentUserContextValue = {
  users: DevelopmentUser[];
  departments: DepartmentSummary[];
  currentUser: DevelopmentUser | null;
  isLoading: boolean;
  error: string | null;
  selectUser: (userId: string) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined,
);
const storageKey = "document-repository-poc-user";

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<DevelopmentUser[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // First frontend step: load seeded identities and departments from the public
    // POC endpoint. API helpers later send the selected ID as X-User-Id.
    getPocContext()
      .then((context) => {
        if (!active) return;
        const savedUserId = window.localStorage.getItem(storageKey);
        const defaultUser =
          context.users.find((user) => user.id === savedUserId) ??
          context.users.find((user) => user.email === "engineer@example.com") ??
          context.users[0] ??
          null;
        setUsers(context.users);
        setDepartments(context.departments);
        setSelectedUserId(defaultUser?.id ?? null);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The POC users could not be loaded",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  function selectUser(userId: string) {
    setSelectedUserId(userId);
    window.localStorage.setItem(storageKey, userId);
  }

  return (
    <CurrentUserContext.Provider
      value={{
        users,
        departments,
        currentUser,
        isLoading,
        error,
        selectUser,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used inside CurrentUserProvider");
  }

  return context;
}
