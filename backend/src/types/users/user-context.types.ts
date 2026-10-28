// Minimal verified identity attached to Express requests and used by permission
// policies. It comes from PostgreSQL, not directly from an untrusted header.
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  departmentId: string;
};
