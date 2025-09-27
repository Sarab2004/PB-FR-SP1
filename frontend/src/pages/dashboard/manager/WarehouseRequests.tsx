import { useCallback, useEffect, useMemo, useState } from "react";
import { HttpError } from "../../../services/http";
import {
  requests,
  type ManagerRequestsListParams,
  type WarehouseRequest,
  type WRequestStatus,
} from "../../../services/requests";
import { RequestDetails } from "../requester/RequestDetails";
import { formatJalali } from "../../../utils/date";
import styles from "./WarehouseRequests.module.css";

type WarehouseRequestsProps = {
  onConverted?: (purchaseId?: string) => void;
};

type ToastState = {
  type: "success" | "error";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
} | null;

const statusOptions: { value: "" | WRequestStatus; label: string }[] = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "SUBMITTED", label: "ثبت شده" },
  { value: "APPROVED", label: "تأیید شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "CONVERTED", label: "تبدیل شده" },
];

const priorityLabels: Record<string, string> = {
  HIGH: "زیاد",
  MEDIUM: "متوسط",
  LOW: "کم",
};

export function WarehouseRequests({ onConverted }: WarehouseRequestsProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WarehouseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | WRequestStatus>("");
  const [selected, setSelected] = useState<WarehouseRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const loadRequests = useCallback(
    async (currentFilter: "" | WRequestStatus = statusFilter) => {
      const params: ManagerRequestsListParams = {
        status: currentFilter || undefined,
      };

      setLoading(true);
      try {
        const data = await requests.listAllForManager(params);
        setItems(data);
      } catch (error) {
        const message =
          error instanceof HttpError
            ? error.message
            : error instanceof Error
            ? error.message
            : "بازیابی درخواست‌ها با خطا مواجه شد.";
        showToast({ type: "error", message });
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    void loadRequests(statusFilter);
  }, [statusFilter, loadRequests]);

  const filtered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  function showToast(next: ToastState) {
    setToast(next);
    if (next) {
      window.setTimeout(() => setToast(null), 5000);
    }
  }

  function optimisticUpdate(id: string, status: WRequestStatus) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function handleAction(id: string, type: "approve" | "reject" | "convert") {
    const loadingKey = `${id}-${type}`;
    setActionLoading(loadingKey);

    let previous: WarehouseRequest | undefined;
    if (type !== "convert") {
      previous = items.find((item) => item.id === id);
      const nextStatus = type === "approve" ? "APPROVED" : "REJECTED";
      if (previous) optimisticUpdate(id, nextStatus as WRequestStatus);
    }

    try {
      if (type === "approve") {
        await requests.approve(id);
        showToast({ type: "success", message: "درخواست با موفقیت تأیید شد." });
      } else if (type === "reject") {
        await requests.reject(id);
        showToast({ type: "success", message: "درخواست با موفقیت رد شد." });
      } else {
        const response = await requests.convert(id);
        await loadRequests(statusFilter);
        const purchaseId = response?.purchase_request_id;
        showToast({
          type: "success",
          message: "درخواست به فرم خرید تبدیل شد.",
          actionLabel: purchaseId ? "مشاهده PR" : undefined,
          onAction: purchaseId
            ? () => {
                onConverted?.(purchaseId);
                setToast(null);
              }
            : undefined,
        });
        onConverted?.(purchaseId);
        return;
      }
    } catch (error) {
      if (previous) {
        setItems((prev) => prev.map((item) => (item.id === previous!.id ? previous! : item)));
      }
      const message =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
          ? error.message
          : "اجرای عملیات با خطا مواجه شد.";
      showToast({ type: "error", message });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <div className={styles.headingBlock}>
          <h2>فرم‌های درخواست کالا</h2>
          <p>مشاهده و مدیریت درخواست‌های ارسال‌شده توسط درخواست‌کننده‌ها.</p>
        </div>
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as WRequestStatus | "")}
          >
            {statusOptions.map((option) => (
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
              <th>عنوان</th>
              <th>اولویت</th>
              <th>محل مصرف</th>
              <th>درخواست‌کننده</th>
              <th>وضعیت</th>
              <th>تاریخ ایجاد</th>
              <th>اقدامات</th>
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
              filtered.map((item) => {
                const statusClass = styles[`status${item.status}` as keyof typeof styles] ?? "";
                const isSubmitted = item.status === "SUBMITTED";

                return (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.titleCell}>
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td>{priorityLabels[item.priority ?? ""] ?? item.priority ?? "-"}</td>
                    <td>{item.usage_location || "-"}</td>
                    <td className={styles.userCell}>{item.requester_id.slice(0, 8)}...</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass}`.trim()}>{statusLabel(item.status)}</span>
                    </td>
                    <td>{formatJalali(item.created_at)}</td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className="btn-tertiary"
                          onClick={() => setSelected(item)}
                        >
                          مشاهده
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          disabled={!isSubmitted || actionLoading !== null}
                          onClick={() => handleAction(item.id, "approve")}
                        >
                          {actionLoading === `${item.id}-approve` ? <span className={styles.spinner} /> : "تأیید"}
                        </button>
                        <button
                          type="button"
                          className={`btn-outline ${styles.dangerButton}`.trim()}
                          disabled={!isSubmitted || actionLoading !== null}
                          onClick={() => handleAction(item.id, "reject")}
                        >
                          {actionLoading === `${item.id}-reject` ? <span className={styles.spinner} /> : "رد"}
                        </button>
                        <button
                          type="button"
                          className="btn-brand"
                          disabled={actionLoading !== null}
                          onClick={() => handleAction(item.id, "convert")}
                        >
                          {actionLoading === `${item.id}-convert` ? (
                            <span className={styles.spinner} />
                          ) : (
                            "تبدیل به خرید"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <RequestDetails
        open={Boolean(selected)}
        request={selected}
        onClose={() => setSelected(null)}
        title="جزئیات درخواست"
        readOnly
      />

      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type}` as keyof typeof styles] ?? ""}`.trim()}>
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button type="button" onClick={toast.onAction}>
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function statusLabel(status: WRequestStatus) {
  const labels: Record<WRequestStatus, string> = {
    SUBMITTED: "ثبت شده",
    APPROVED: "تأیید شده",
    REJECTED: "رد شده",
    CONVERTED: "تبدیل شده",
  };
  return labels[status] ?? status;
}
