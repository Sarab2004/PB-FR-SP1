import { useEffect, useMemo, useState } from "react";
import { HttpError } from "../../../services/http";
import { requests } from "../../../services/requests";
import type { WarehouseRequest, WRequestStatus } from "../../../types/requests";
import { RequestDetails } from "./RequestDetails";
import { formatJalali } from "../../../utils/date";
import styles from "./MyRequests.module.css";

type MyRequestsProps = {
  refreshKey: number;
};

const statusOptions: { value: "" | WRequestStatus; label: string }[] = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "SUBMITTED", label: "ثبت شده" },
  { value: "APPROVED", label: "تأیید شده" },
  { value: "REJECTED", label: "رد شده" },
  { value: "CONVERTED", label: "تبدیل به خرید" },
];

const statusLabels: Record<WRequestStatus, string> = {
  SUBMITTED: "ثبت شده",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  CONVERTED: "تبدیل شده",
};

const priorityLabels: Record<string, string> = {
  HIGH: "زیاد",
  MEDIUM: "متوسط",
  LOW: "کم",
};

export function MyRequests({ refreshKey }: MyRequestsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WarehouseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | WRequestStatus>("");
  const [selected, setSelected] = useState<WarehouseRequest | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    requests
      .listMine()
      .then((items) => {
        if (!isMounted) return;
        setData(items);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof HttpError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("دریافت لیست درخواست‌ها با خطا مواجه شد.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <h2>درخواست‌های ثبت‌شده من</h2>
        <select
          className={styles.filter}
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

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <table className={styles.table}>
          <tbody>
            {Array.from({ length: 4 }).map((_, index) => (
              <tr key={index}>
                <td colSpan={6} className={styles.skeletonRow} />
              </tr>
            ))}
          </tbody>
        </table>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>درخواستی مطابق فیلتر فعلی وجود ندارد.</strong>
          پس از ثبت یا تغییر وضعیت درخواست، اینجا نمایش داده می‌شود.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>عنوان</th>
              <th>اولویت</th>
              <th>محل مصرف</th>
              <th>تاریخ نیاز</th>
              <th>وضعیت</th>
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const statusClass = styles[`status${item.status}` as keyof typeof styles] ?? "";
              return (
                <tr key={item.id}>
                  <td>
                    <div>{item.title}</div>
                    <div className={styles.meta}>ثبت در {formatJalali(item.created_at)}</div>
                  </td>
                  <td>{priorityLabels[item.priority ?? ""] ?? item.priority ?? "-"}</td>
                  <td>{item.usage_location || "-"}</td>
                  <td>{item.required_date ? formatJalali(item.required_date) : "-"}</td>
                  <td>
                    <span className={`${styles.badge} ${statusClass}`.trim()}>{statusLabels[item.status]}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => setSelected(item)}
                    >
                      مشاهده
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <RequestDetails
        open={Boolean(selected)}
        request={selected}
        onClose={() => setSelected(null)}
        title="جزئیات درخواست"
      />
    </div>
  );
}
