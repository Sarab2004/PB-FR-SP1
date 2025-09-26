import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function RequesterDashboard() {
    const [list, setList] = useState<any[]>([]);
    const [msg, setMsg] = useState("");

    async function load() {
        setMsg("");
        try {
            const res = await api.listWR();
            setList(res.items ?? []);
        } catch (e: any) {
            setMsg(e.message || "خطا در دریافت لیست");
        }
    }

    async function createSample() {
        try {
            await api.createWR({
                title: "A4 Paper (from UI)",
                items: [{ sku: "A4", name: "Paper", qty: 5, unit: "pack" }],
                priority: "HIGH",
            });
            await load();
        } catch (e: any) {
            setMsg(e.message || "خطا در ایجاد");
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <div style={{ padding: 20, direction: "rtl", fontFamily: "sans-serif" }}>
            <h2>داشبورد درخواست‌کننده</h2>
            <button onClick={createSample}>ایجاد WR نمونه</button>
            {msg && <p style={{ color: "crimson" }}>{msg}</p>}
            <ul>
                {list.map((x: any) => (
                    <li key={x.id}>
                        <b>{x.title}</b> — وضعیت: {x.status} — تاریخ: {new Date(x.created_at).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
}
