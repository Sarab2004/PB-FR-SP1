import { useEffect, useMemo, useState } from "react";
import { HttpError } from "../../../services/http";
import {
  purchases,
  type PurchaseListParams,
  type PurchaseUpdatePayload,
} from "../../../services/purchases";
import type { PurchaseRequest, PurchaseStatus } from "../../../types/purchases";
import { formatJalali } from "../../../utils/date";
import styles from "./PurchaseRequests.module.css";
import { PurchaseEditDialog } from "./PurchaseEditDialog";
import {
  PRIORITY_LABELS,
  PURCHASE_STATUS_LABELS,
} from "./purchaseConstants";

type PurchaseRequestsProps = {
  focusId?: string | null;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const statusFilterOptions: { value: "" | PurchaseStatus; label: string }[] = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "DRAFT", label: PURCHASE_STATUS_LABELS.DRAFT },
  { value: "SUBMITTED", label: PURCHASE_STATUS_LABELS.SUBMITTED },
  { value: "APPROVED", label: PURCHASE_STATUS_LABELS.APPROVED },
  { value: "REJECTED", label: PURCHASE_STATUS_LABELS.REJECTED },
];

export function PurchaseRequests({ focusId }: PurchaseRequestsProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PurchaseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | PurchaseStatus>("");
  const [toast, setToast] = useState<ToastState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadPurchases(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (!focusId || !items.length) return;
    const match = items.find((item) => item.id === focusId);
    if (match) {
      void openDetails(match.id);
    }
  }, [focusId, items]);

  const filtered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  function showToast(next: ToastState) {
    setToast(next);
    if (next) {
      window.setTimeout(() => setToast(null), 4000);
    }
  }

  async function loadPurchases(filter: "" | PurchaseStatus) {
    const params: PurchaseListParams | undefined = filter ? { status: filter } : undefined;
    setLoading(true);
    try {
      const data = await purchases.list(params);
      setItems(data);
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
          ? error.message
          : "دریافت درخواست‌های خرید با خطا مواجه شد.";
      showToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(id: string) {
    setSelectedId(id);
    setDetailsLoading(true);
    try {
      const detail = await purchases.get(id);
      setSelected(detail);
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
          ? error.message
          : "دریافت جزئیات درخواست با خطا مواجه شد.";
      showToast({ type: "error", message });
      setSelectedId(null);
      setSelected(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleSubmit(payload: PurchaseUpdatePayload) {
    if (!selectedId || !selected) return;
    setSaving(true);
    try {
      const updated = await purchases.patch(selectedId, payload);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(updated);
      setSelectedId(null);
      setSelected(null);
      showToast({ type: "success", message: "درخواست خرید با موفقیت ذخیره شد." });
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
          ? error.message
          : "ذخیره تغییرات با خطا مواجه شد.";
      showToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    setSelectedId(null);
    setSelected(null);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <div className={styles.headingBlock}>
          <h2>فرم‌های درخواست خرید</h2>
          <p>مدیریت درخواست‌های خرید تبدیل‌شده یا ایجادشده توسط انباردار.</p>
        </div>
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PurchaseStatus | "")}
            aria-label="فیلتر وضعیت"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>وضعیت</th>
              <th>اولویت</th>
              <th>محل مصرف</th>
              <th>جمع کل</th>
              <th>تاریخ ایجاد</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td colSpan={7} className={styles.skeletonRow} />
                </tr>
              ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <h3>درخواستی برای نمایش وجود ندارد</h3>
                    <p>فیلتر وضعیت را تغییر دهید یا منتظر ثبت درخواست‌های جدید بمانید.</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((item) => (
                <tr key={item.id}>
                  <td className={styles.idCell}>{item.id.slice(0, 8)}...</td>
                  <td>
                    <span
                      className={`${styles.badge} ${styles[`status${item.status}` as keyof typeof styles] ?? ""}`.trim()}
                    >
                      {PURCHASE_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td>{PRIORITY_LABELS[item.priority ?? ""] ?? item.priority ?? "-"}</td>
                  <td>{item.usage_location || "-"}</td>
                  <td>{item.total != null ? item.total.toLocaleString("fa-IR") : "-"}</td>
                  <td>{formatJalali(item.created_at) || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-tertiary"
                      onClick={() => openDetails(item.id)}
                      disabled={saving && selectedId === item.id}
                    >
                      {saving && selectedId === item.id ? (
                        <span className={styles.spinner} aria-hidden="true" />
                      ) : (
                        "مشاهده / ویرایش"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <PurchaseEditDialog
        open={Boolean(selectedId)}
        purchase={selected}
        loading={detailsLoading}
        saving={saving}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />

      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type}` as keyof typeof styles] ?? ""}`.trim()}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
