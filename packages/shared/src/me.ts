export type UserRoles = {
  member: boolean;
  reviewer: boolean;
  admin: boolean;
};

export type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  roles: UserRoles;
};
