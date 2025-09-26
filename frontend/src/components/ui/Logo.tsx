import { Link } from "react-router-dom";
import styles from "./Logo.module.css";

type LogoProps = {
  to?: string;
  className?: string;
};

export function Logo({ to = "/", className }: LogoProps) {
  return (
    <Link to={to} className={`${styles.logoLink} ${className ?? ""}`.trim()} aria-label="پرچم‌بار">
      <img
        src="/brand/logo.png"
        alt="پرچم‌بار"
        width={143}
        height={60}
        loading="eager"
        decoding="async"
        className={styles.logoImage}
      />
    </Link>
  );
}
