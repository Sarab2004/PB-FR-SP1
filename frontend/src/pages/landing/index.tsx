import { useEffect, useMemo, useState } from "react";
import { Logo } from "../../components/ui/Logo";
import type { LandingResp, LandingRole } from "../../services/landing";
import { fetchLanding } from "../../services/landing";
import styles from "./LandingPage.module.css";

type State = {
  data: LandingResp | null;
  error: string | null;
};

const fallbackLanding: LandingResp = {
  title: "سیستم درخواست کالا/خرید (MVP)",
  subtitle: "برای شروع نقش‌تان را انتخاب کنید و وارد داشبورد شوید.",
  roles: [
    { key: "REQUESTER", label: "ورود به عنوان درخواست‌کننده", authUrl: "/auth?role=requester" },
    { key: "MANAGER", label: "ورود به عنوان انباردار", authUrl: "/auth?role=manager" },
  ],
  ctas: {
    primary: { href: "/auth", label: "ورود به داشبورد" },
    support: { href: "/support", label: "تماس با پشتیبانی" },
  },
};

const ROLE_HINTS: Record<LandingRole["key"], string> = {
  REQUESTER: "ثبت و پیگیری درخواست‌های کالا از انبار توسط واحدهای سازمان",
  MANAGER: "بررسی، تأیید یا تبدیل درخواست‌ها و مدیریت خرید توسط انبار",
};

export default function LandingPage() {
  const [{ data, error }, setState] = useState<State>({ data: null, error: null });

  useEffect(() => {
    fetchLanding()
      .then((payload) => setState({ data: payload, error: null }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات";
        setState({ data: null, error: message });
      });
  }, []);

  const landing = useMemo(() => ({ ...fallbackLanding, ...data }), [data]);

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <Logo />
        </header>
        <main className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>{fallbackLanding.title}</h1>
            <p className={styles.heroSubtitle}>{error}</p>
          </div>
          <div className={styles.primaryCta}>
            <a className="btn-brand" href={fallbackLanding.ctas?.primary?.href ?? "/auth"}>
              {fallbackLanding.ctas?.primary?.label ?? "ورود"}
            </a>
            {fallbackLanding.ctas?.support && (
              <a className={styles.supportLink} href={fallbackLanding.ctas.support.href}>
                {fallbackLanding.ctas.support.label}
              </a>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
      </header>
      <main className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>{landing.title}</h1>
          {landing.subtitle && <p className={styles.heroSubtitle}>{landing.subtitle}</p>}
        </div>

        <div className={styles.roles}>
          {(landing.roles ?? fallbackLanding.roles).map((role) => (
            <article key={role.key} className={styles.roleCard}>
              <span className={styles.roleLabel}>{role.label}</span>
              <p className={styles.roleHint}>{ROLE_HINTS[role.key] ?? "ورود به این نقش"}</p>
              <div className={styles.roleActions}>
                <a className="btn-outline" href={role.authUrl}>
                  ورود به {role.label}
                </a>
              </div>
            </article>
          ))}
        </div>

        {landing.ctas?.primary && (
          <div className={styles.primaryCta}>
            <a className="btn-brand" href={landing.ctas.primary.href}>
              {landing.ctas.primary.label}
            </a>
            {landing.ctas.support && (
              <a className={styles.supportLink} href={landing.ctas.support.href}>
                {landing.ctas.support.label}
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
