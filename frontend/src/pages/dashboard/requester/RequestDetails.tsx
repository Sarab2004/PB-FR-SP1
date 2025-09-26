import { useEffect } from "react";
import type { WarehouseRequest } from "../../../types/requests";
import { formatJalali } from "../../../utils/date";
import styles from "./RequestDetails.module.css";

export type RequestDetailsProps = {
  open: boolean;
  request: WarehouseRequest | null;
  onClose: () => void;
  title?: string;
  readOnly?: boolean;
};

const priorityLabels: Record<string, string> = {
  HIGH: "زیاد",
  MEDIUM: "متوسط",
  LOW: "کم",
};

export function RequestDetails({ open, request, onClose, title, readOnly = true }: RequestDetailsProps) {
  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !request) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h2>{title ?? "جزئیات درخواست"}</h2>
            <p>وضعیت: {statusBadge(request.status)}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            بستن
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3>اطلاعات درخواست</h3>
            <div className={styles.metaGrid}>
              <Field label="عنوان" value={request.title} />
              <Field label="اولویت" value={priorityLabels[request.priority ?? ""] ?? request.priority ?? "-"} />
              <Field label="محل مصرف" value={request.usage_location?.trim() || "-"} />
              <Field label="تاریخ نیاز" value={request.required_date ? formatJalali(request.required_date) : "-"} />
            </div>

            <Field label="توضیحات" value={request.description?.trim() || "-"} multiline />
            <Field label="مشخصات فنی" value={request.specs?.trim() || "-"} multiline />
          </section>

          <section className={styles.section}>
            <h3>آیتم‌ها</h3>
            <div className={styles.items}>
              {request.items.map((item, index) => (
                <div key={`${item.sku}-${index}`} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <span className={styles.itemLabel}>SKU</span>
                    <span>{item.sku}</span>
                  </div>
                  <div className={styles.itemRow}>
                    <span className={styles.itemLabel}>نام کالا</span>
                    <span>{item.name}</span>
                  </div>
                  <div className={styles.itemRow}>
                    <span className={styles.itemLabel}>تعداد</span>
                    <span>{item.qty}</span>
                  </div>
                  <div className={styles.itemRow}>
                    <span className={styles.itemLabel}>واحد</span>
                    <span>{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {!readOnly && (
          <footer className={styles.footer}>
            <button type="button" className="btn-outline" onClick={onClose}>
              بستن
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const labels: Record<string, string> = {
    SUBMITTED: "ثبت شده",
    APPROVED: "تأیید شده",
    REJECTED: "رد شده",
    CONVERTED: "تبدیل شده",
  };

  return labels[status] ?? status;
}

type FieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
};

function Field({ label, value, multiline }: FieldProps) {
  return (
    <div className={`${styles.field} ${multiline ? styles.fieldMultiline : ""}`.trim()}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}
