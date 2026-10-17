export type PocContextResponse = {
  identityMechanism: "POC_X_USER_ID";
  warning: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "EMPLOYEE" | "ADMIN";
    department: {
      id: string;
      name: string;
    };
  }>;
  departments: Array<{
    id: string;
    name: string;
  }>;
};
