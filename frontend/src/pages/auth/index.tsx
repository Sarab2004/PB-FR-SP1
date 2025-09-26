import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../../services/auth";
import { Logo } from "../../components/ui/Logo";
import { DASHBOARD_ROUTES, SUPPORT_URL } from "../../services/config";
import { HttpError } from "../../services/http";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types/auth";
import styles from "./AuthPage.module.css";

const steps = [
  { id: 1, label: "انتخاب نقش" },
  { id: 2, label: "ورود" },
];

const ROLE_CONTENT: Record<Role, { title: string; caption: string; badge: string }> = {
  REQUESTER: {
    title: "درخواست‌کننده از انبار",
    caption: "ثبت و پیگیری درخواست‌های تأمین کالا",
    badge: "Request",
  },
  MANAGER: {
    title: "انباردار / مدیر",
    caption: "بررسی، تأیید و تبدیل درخواست‌ها",
    badge: "Manage",
  },
};

function toRole(value: string | null): Role | null {
  if (!value) return null;
  const norm = value.toUpperCase();
  return norm === "MANAGER" ? "MANAGER" : norm === "REQUESTER" ? "REQUESTER" : null;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const roleParam = toRole(params.get("role"));
  const [role, setRole] = useState<Role>(roleParam ?? "REQUESTER");
  const [step, setStep] = useState<number>(roleParam ? 2 : 1);
  const [identifier, setIdentifier] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, session, isReady } = useAuth();

  useEffect(() => {
    if (isReady && session) {
      navigate(DASHBOARD_ROUTES[session.user.role], { replace: true });
    }
  }, [isReady, session, navigate]);

  useEffect(() => {
    setError(null);
  }, [role, step]);

  const supportLink = SUPPORT_URL;

  const handleRoleContinue = () => {
    setStep(2);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const payload = await login(role, identifier.trim(), passcode.trim());
      signIn(payload);
      navigate(DASHBOARD_ROUTES[payload.user.role], { replace: true });
    } catch (err) {
      let message = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
      if (err instanceof HttpError) {
        if (err.status === 401) {
          message = "نقش انتخابی صحیح نیست یا حساب کاربر غیرفعال است.";
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <div className={styles.logoBar}>
          <Logo />
        </div>
        <div className={styles.stepper}>
          {steps.map((item, index) => {
            const active = step === item.id;
            return (
              <span
                key={item.id}
                className={`${styles.step} ${active ? styles.stepActive : ""}`.trim()}
              >
                <span
                  className={`${styles.stepCircle} ${active ? styles.stepCircleActive : ""}`.trim()}
                >
                  {item.id}
                </span>
                {item.label}
                {index < steps.length - 1 && <span aria-hidden="true">›</span>}
              </span>
            );
          })}
        </div>

        <header className={styles.heading}>
          <h1 id="auth-title">ورود به داشبورد</h1>
          <p>برای شروع نقش خود را انتخاب کنید و سپس شناسه و کد عبور را وارد نمایید.</p>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            <div>
              <strong>ورود ناموفق:</strong> {error}
              {supportLink && (
                <>
                  {" "}
                  <a href={supportLink} target="_blank" rel="noreferrer">
                    تماس با پشتیبانی
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {step === 1 ? (
          <div className={styles.roles}>
            {(Object.keys(ROLE_CONTENT) as Role[]).map((item) => {
              const content = ROLE_CONTENT[item];
              const isActive = role === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`${styles.roleCard} ${isActive ? styles.roleCardActive : ""}`.trim()}
                  aria-pressed={isActive}
                >
                  <div className={styles.roleHeader}>
                    <span className={styles.roleTitle}>{content.title}</span>
                    <span className={styles.badge}>{content.badge}</span>
                  </div>
                  <p className={styles.roleHint}>{content.caption}</p>
                </button>
              );
            })}
            <div className={styles.actions}>
              <button type="button" className="btn-brand" onClick={handleRoleContinue}>
                ادامه و ورود
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <span className={styles.label}>نقش انتخابی</span>
              <div className={styles.roles}>
                {(Object.keys(ROLE_CONTENT) as Role[]).map((item) => {
                  const content = ROLE_CONTENT[item];
                  const isActive = role === item;
                  return (
                    <button
                      key={`role-${item}`}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`${styles.roleCard} ${isActive ? styles.roleCardActive : ""}`.trim()}
                      aria-pressed={isActive}
                    >
                      <div className={styles.roleHeader}>
                        <span className={styles.roleTitle}>{content.title}</span>
                        <span className={styles.badge}>{content.badge}</span>
                      </div>
                      <p className={styles.roleHint}>{content.caption}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="identifier">
                شناسه (ایمیل، تلفن یا کد ملی)
              </label>
              <input
                id="identifier"
                className={styles.input}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="passcode">
                کد عبور
              </label>
              <input
                id="passcode"
                className={styles.input}
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                بازگشت
              </button>
              <button type="submit" className="btn-brand" disabled={loading}>
                {loading ? "در حال ورود..." : "ورود"}
              </button>
            </div>

            <p className={styles.supportHint}>
              در صورت بروز مشکل، با پشتیبانی در ارتباط باشید.
            </p>

            <div className={styles.testBox}>
              manager@test.com / 123456
              <br />
              requester1@test.com / 123456
            </div>
          </form>
        )}
      </section>
    </main>
  );
}





