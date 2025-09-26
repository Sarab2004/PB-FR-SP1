import { useEffect, useState } from "react";
import type { LandingResp } from "../../services/landing";
import { fetchLanding } from "../../services/landing"; // ✅ مسیر درست

export default function LandingPage() {
  const [data, setData] = useState<LandingResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchLanding()
      .then(setData)
      .catch((e) => setErr(e?.message || "خطا در دریافت لندینگ"));
  }, []);

  if (err) return <pre>خطا: {err}</pre>;
  if (!data) return <div>در حال بارگذاری…</div>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif", direction: "rtl" }}>
      <h1>{data.title}</h1>
      {data.subtitle && <p>{data.subtitle}</p>}

      <h3>نقش‌ها</h3>
      <ul>
        {data.roles.map((r) => (
          <li key={r.key}>
            <a href={r.authUrl}>ورود به عنوان {r.label}</a>
          </li>
        ))}
      </ul>

      {data.ctas?.primary && (
        <p>
          <a href={data.ctas.primary.href}>{data.ctas.primary.label}</a>
        </p>
      )}
      {data.ctas?.support && (
        <p>
          <a href={data.ctas.support.href}>{data.ctas.support.label}</a>
        </p>
      )}
    </div>
  );
}
