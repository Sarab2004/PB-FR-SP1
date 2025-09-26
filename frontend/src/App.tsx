import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing";
import AuthPage from "./pages/auth";
import RequesterDashboard from "./pages/dashboard/requester";
import ManagerDashboard from "./pages/dashboard/manager";
import { RequireRole } from "./components/guards/RequireRole";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<RequireRole role="REQUESTER" />}>
        <Route path="/dashboard/requester" element={<RequesterDashboard />} />
      </Route>

      <Route element={<RequireRole role="MANAGER" />}>
        <Route path="/dashboard/manager" element={<ManagerDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}