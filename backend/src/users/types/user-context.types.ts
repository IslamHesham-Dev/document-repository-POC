export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  departmentId: string;
};
