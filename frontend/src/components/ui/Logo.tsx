import { Link } from "react-router-dom";
import styles from "./Logo.module.css";

type LogoProps = {
  to?: string;
  className?: string;
};

export function Logo({ to = "/", className }: LogoProps) {
  return (
    <Link to={to} className={`${styles.logoLink} ${className ?? ""}`.trim()} aria-label="پرچمبر">
      <img
        src="/brand/perchambar_logo.png"
        alt="پرچمبر"
        width={132}
        height={44}
        loading="eager"
        decoding="async"
        className={styles.logoImage}
      />
    </Link>
  );
}
