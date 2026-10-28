// Safe subset returned by /api/me after user-context middleware succeeds.
export type CurrentUserResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "EMPLOYEE" | "ADMIN";
    departmentId: string;
  };
};
