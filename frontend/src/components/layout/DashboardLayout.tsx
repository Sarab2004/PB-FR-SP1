import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types/auth";
import { Logo } from "../ui/Logo";
import styles from "./DashboardLayout.module.css";

type SidebarItem = {
  label: string;
  to: string;
};

type TabItem = {
  key: string;
  label: string;
};

type DashboardLayoutProps = {
  title: string;
  subtitle?: string;
  sidebarItems: SidebarItem[];
  tabs?: TabItem[];
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  actions?: ReactNode;
  children: ReactNode;
};

const ROLE_TITLES: Record<Role, string> = {
  REQUESTER: "درخواست‌کننده",
  MANAGER: "انباردار",
};

export function DashboardLayout({
  title,
  subtitle,
  sidebarItems,
  tabs,
  currentTab,
  onTabChange,
  actions,
  children,
}: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const roleLabel = ROLE_TITLES[user?.role ?? "REQUESTER"];
  const emailLabel = user?.email ?? "کاربر سیستم";

  async function handleCopyId() {
    if (!user?.id) return;
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      window.prompt("شناسه کاربر", user.id);
      return;
    }
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("clipboard copy failed", error);
      setCopied(false);
    }
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav} aria-label="ناوبری داشبورد">
          {sidebarItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const linkClassName = [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ");
            return (
              <Link key={item.to} to={item.to} className={linkClassName}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.header}>
          <Logo className={styles.headerLogo} />
          <div className={styles.headerMain}>
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
          <div className={styles.profile}>
            <div className={styles.profileInfo}>
              <span className={styles.profileEmail}>{emailLabel}</span>
              <span className={styles.profileRole}>{roleLabel}</span>
            </div>
            <div className={styles.profileActions}>
              <button
                type="button"
                className="btn-tertiary"
                onClick={handleCopyId}
                disabled={!user?.id}
              >
                {copied ? "کپی شد" : "کپی شناسه"}
              </button>
              <button type="button" className="btn-outline" onClick={signOut}>
                خروج
              </button>
            </div>
          </div>
        </header>

        {tabs && tabs.length > 0 && (
          <div className={styles.tabs} role="tablist">
            {tabs.map((tab) => {
              const active = tab.key === currentTab;
              const tabClassName = [styles.tabButton, active ? styles.tabButtonActive : ""].filter(Boolean).join(" ");
              return (
                <button
                  key={tab.key}
                  className={tabClassName}
                  onClick={() => onTabChange?.(tab.key)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <section className={styles.content}>{children}</section>
      </div>
    </div>
  );
}
