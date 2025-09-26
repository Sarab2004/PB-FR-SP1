export type Role = "REQUESTER" | "MANAGER";

export type AuthUser = {
  id: string;
  role: Role;
  email?: string | null;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};