import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function ManagerDashboard() {
    const [wr, setWr] = useState<any[]>([]);
    const [pr, setPr] = useState<any[]>([]);
    const [msg, setMsg] = useState("");

    async function load() {
        setMsg("");
        try {
            const w = await api.listWR();
            setWr(w.items ?? []);
            const p = await api.listPR();
            setPr(p.items ?? []);
        } catch (e: any) {
            setMsg(e.message || "خطا در دریافت لیست‌ها");
        }
    }

    async function approve(id: string) {
        try { await api.approveWR(id); await load(); }
        catch (e: any) { setMsg(e.message); }
    }
    async function reject(id: string) {
        try { await api.rejectWR(id); await load(); }
        catch (e: any) { setMsg(e.message); }
    }
    async function convert(id: string) {
        try { await api.convertWR(id); await load(); }
        catch (e: any) { setMsg(e.message); }
    }

    useEffect(() => { load(); }, []);

    return (
        <div style={{ padding: 20, direction: "rtl", fontFamily: "sans-serif" }}>
            <h2>داشبورد مدیر انبار</h2>
            {msg && <p style={{ color: "crimson" }}>{msg}</p>}

            <h3>Warehouse Requests</h3>
            <ul>
                {wr.map((x: any) => (
                    <li key={x.id} style={{ marginBottom: 8 }}>
                        <b>{x.title}</b> — {x.status}
                        {" "}
                        <button onClick={() => approve(x.id)}>تایید</button>
                        <button onClick={() => reject(x.id)}>رد</button>
                        <button onClick={() => convert(x.id)}>تبدیل به PR</button>
                    </li>
                ))}
            </ul>

            <h3 style={{ marginTop: 24 }}>Purchase Requests</h3>
            <ul>
                {pr.map((p: any) => (
                    <li key={p.id}>
                        <b>{p.id.slice(0, 8)}</b> — وضعیت: {p.status} — اولویت: {p.priority ?? "-"}
                    </li>
                ))}
            </ul>
        </div>
    );
}
