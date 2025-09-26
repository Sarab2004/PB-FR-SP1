import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, token } from "../../services/api";

export default function AuthPage() {
    const nav = useNavigate();
    const q = new URLSearchParams(useLocation().search);
    const roleFromURL = (q.get("role") || "").toUpperCase() as "REQUESTER" | "MANAGER";
    const [role, setRole] = useState<"REQUESTER" | "MANAGER">(roleFromURL === "MANAGER" ? "MANAGER" : "REQUESTER");
    const [identifier, setIdentifier] = useState("");
    const [passcode, setPasscode] = useState("");
    const [msg, setMsg] = useState("");

    const dashboard = useMemo(() => ({
        REQUESTER: "/dashboard/requester",
        MANAGER: "/dashboard/manager",
    }), []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsg("");
        try {
            const res = await api.authLogin({ role, identifier, passcode });
            token.set(res.accessToken);
            nav(dashboard[role]);
        } catch (e: any) {
            setMsg(e.message || "خطا در ورود");
        }
    }

    useEffect(() => { /* اگر قبلاً لاگین شده بود */
        if (token.get()) nav(dashboard[role], { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "sans-serif", direction: "rtl" }}>
            <h2>ورود</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                <label>نقش:
                    <select value={role} onChange={e => setRole(e.target.value as any)}>
                        <option value="REQUESTER">Requester</option>
                        <option value="MANAGER">Warehouse Manager</option>
                    </select>
                </label>
                <label>شناسه (ایمیل/تلفن/کدملی):
                    <input value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                </label>
                <label>کد عبور:
                    <input value={passcode} onChange={e => setPasscode(e.target.value)} required type="password" />
                </label>
                <button type="submit">ورود</button>
            </form>
            {msg && <p style={{ color: "crimson" }}>{msg}</p>}
            <p style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
                تست سریع: <code>manager@test.com / 123456</code> یا <code>requester1@test.com / 123456</code>
            </p>
        </div>
    );
}
