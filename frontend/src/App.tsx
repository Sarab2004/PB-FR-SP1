import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/landing";         // که قبلاً ساختی
import AuthPage from "./pages/auth";
import RequesterDashboard from "./pages/dashboard/requester";
import ManagerDashboard from "./pages/dashboard/manager";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard/requester" element={<RequesterDashboard />} />
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
