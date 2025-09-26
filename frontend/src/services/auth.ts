import type { Role, AuthSession, AuthUser } from "../types/auth";
import { api } from "./api";

type LoginPayload = {
  role: Role;
  identifier: string;
  passcode: string;
};

export async function login(role: Role, identifier: string, passcode: string) {
  return api.authLogin({ role, identifier, passcode } satisfies LoginPayload);
}

export type { Role, AuthSession, AuthUser };
