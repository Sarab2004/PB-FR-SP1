import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types/auth";
import { DASHBOARD_ROUTES } from "../../services/config";

function roleToQuery(role: Role) {
  return role.toLowerCase();
}

type RequireRoleProps = {
  role: Role;
};

export function RequireRole({ role }: RequireRoleProps) {
  const { session, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <main style={{ padding: "80px 24px", textAlign: "center" }}>
        در حال بارگذاری...
      </main>
    );
  }

  if (!session) {
    return (
      <Navigate
        to={`/auth?role=${roleToQuery(role)}`}
        replace
        state={{ redirectFrom: location.pathname }}
      />
    );
  }

  if (session.user.role !== role) {
    const target = DASHBOARD_ROUTES[session.user.role];
    return (
      <Navigate
        to={target}
        replace
        state={{ forbidden: location.pathname }}
      />
    );
  }

  return <Outlet />;
}