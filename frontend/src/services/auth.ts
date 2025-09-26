// src/services/auth.ts
import { api } from "./http";

export type Role = "REQUESTER" | "MANAGER";

type LoginBody = {
    role: Role;
    identifier: string;
    passcode: string;
};

export async function login(role: Role, identifier: string, passcode: string) {
    return api<{
        accessToken: string;
        user: { id: string; role: Role; email?: string | null };
    }>("/auth", {
        method: "POST",
        body: JSON.stringify({ role, identifier, passcode } satisfies LoginBody),
    });
}
