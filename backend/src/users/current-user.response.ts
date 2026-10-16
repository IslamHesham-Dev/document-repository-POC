export type CurrentUserResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "EMPLOYEE" | "ADMIN";
    departmentId: string;
  };
};
