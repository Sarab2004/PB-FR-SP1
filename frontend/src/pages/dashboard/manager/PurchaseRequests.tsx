import { useEffect, useMemo, useState } from "react";
import { HttpError } from "../../../services/http";
import { purchases, type PurchaseUpdatePayload } from "../../../services/purchases";
import type { PurchaseRequest, PurchaseStatus, PurchaseItem } from "../../../types/purchases";
import styles from "./PurchaseRequests.module.css";

type PurchaseRequestsProps = {
  focusId?: string | null;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type EditablePurchase = {
  id: string;
  vendor: string;
  total: string;
  usage_location: string;
  priority: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
};

const statusOptions: PurchaseStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

const statusLabels: Record<PurchaseStatus, string> = {
  DRAFT: "پیش‌نویس",
  SUBMITTED: "ارسال شده",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
};

const priorityLabels: Record<string, string> = {
  HIGH: "زیاد",
  MEDIUM: "متوسط",
  LOW: "کم",
};

export function PurchaseRequests({ focusId }: PurchaseRequestsProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PurchaseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | PurchaseStatus>("");
  const [toast, setToast] = useState<ToastState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<string, PurchaseRequest>>({});
  const [editable, setEditable] = useState<EditablePurchase | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!focusId) return;
    if (items.some((item) => item.id === focusId)) {
      openDetails(focusId);
    }
  }, [focusId, items]);

  const filtered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  function showToast(next: ToastState) {
    setToast(next);
    if (next) {
      setTimeout(() => setToast(null), 5000);
    }
  }

  async function reload() {
    setLoading(true);
    try {
      const data = await purchases.list();
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
    setErrors({});

    if (detailsCache[id]) {
      setEditable(toEditable(detailsCache[id]));
      return;
    }

    setDetailsLoading(true);
    try {
      const detail = await purchases.get(id);
      setDetailsCache((prev) => ({ ...prev, [id]: detail }));
      setEditable(toEditable(detail));
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
          ? error.message
          : "دریافت جزئیات درخواست با خطا مواجه شد.";
      showToast({ type: "error", message });
      setSelectedId(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  function toEditable(purchase: PurchaseRequest): EditablePurchase {
    return {
      id: purchase.id,
      vendor: purchase.vendor ?? "",
      total: purchase.total != null ? String(purchase.total) : "",
      usage_location: purchase.usage_location ?? "",
      priority: purchase.priority ?? "",
      status: purchase.status,
      items: purchase.items ?? [],
    };
  }

  function handleEditableChange<K extends keyof EditablePurchase>(key: K, value: EditablePurchase[K]) {
    if (!editable) return;
    setEditable({ ...editable, [key]: value });
  }

  function updateItem(index: number, key: keyof PurchaseItem, value: string | number) {
    if (!editable) return;
    const updatedItems = editable.items.map((item, i) =>
      i === index ? { ...item, [key]: key === "qty" ? Number(value) : String(value) } : item
    );
    setEditable({ ...editable, items: updatedItems });
  }

  function removeItem(index: number) {
    if (!editable) return;
    const updatedItems = editable.items.filter((_, i) => i !== index);
    setEditable({ ...editable, items: updatedItems });
  }

  function addItem() {
    if (!editable) return;
    setEditable({ ...editable, items: [...editable.items, { ...EMPTY_PURCHASE_ITEM }] });
  }

  const EMPTY_PURCHASE_ITEM: PurchaseItem = { sku: "", name: "", qty: 1, unit: "" };

  function validate(current: EditablePurchase) {
    const nextErrors: Record<string, string> = {};

    if (current.vendor.length > 120) {
      nextErrors.vendor = "حداکثر ۱۲۰ کاراکتر.";
    }

    if (current.usage_location.length > 120) {
      nextErrors.usage_location = "حداکثر ۱۲۰ کاراکتر.";
    }

    if (current.priority && !["LOW", "MEDIUM", "HIGH"].includes(current.priority)) {
      nextErrors.priority = "اولویت انتخاب‌شده معتبر نیست.";
    }

    if (!statusOptions.includes(current.status)) {
      nextErrors.status = "وضعیت انتخاب‌شده معتبر نیست.";
    }

    if (current.total.trim()) {
      const totalNumber = Number(current.total);
      if (!Number.isFinite(totalNumber) || totalNumber < 0) {
        nextErrors.total = "مبلغ باید عددی بزرگ‌تر یا مساوی صفر باشد.";
      }
    }

    if (!current.items.length) {
      nextErrors.items = "حداقل یک آیتم لازم است.";
    }

    current.items.forEach((item, index) => {
      if (!item.sku.trim()) {
        nextErrors[`items[${index}].sku`] = "شناسه کالا الزامی است.";
      } else if (item.sku.trim().length > 40) {
        nextErrors[`items[${index}].sku`] = "حداکثر ۴۰ کاراکتر.";
      }

      if (!item.name.trim()) {
        nextErrors[`items[${index}].name`] = "نام کالا الزامی است.";
      } else if (item.name.trim().length > 120) {
        nextErrors[`items[${index}].name`] = "حداکثر ۱۲۰ کاراکتر.";
      }

      const qtyNumber = Number(item.qty);
      if (!Number.isFinite(qtyNumber) || qtyNumber < 1 || qtyNumber > 99999) {
        nextErrors[`items[${index}].qty`] = "تعداد باید بین ۱ تا ۹۹۹۹۹ باشد.";
      }

      if (!item.unit.trim()) {
        nextErrors[`items[${index}].unit`] = "واحد الزامی است.";
      } else if (item.unit.trim().length > 16) {
        nextErrors[`items[${index}].unit`] = "حداکثر ۱۶ کاراکتر.";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!editable) return;
    if (!validate(editable)) return;

    setSaving(true);
    try {
      const payload: PurchaseUpdatePayload = {
        vendor: editable.vendor.trim() || null,
        total: editable.total.trim() ? Number(editable.total) : null,
        usage_location: editable.usage_location.trim() || null,
        priority: editable.priority || null,
        status: editable.status,
        items: (editable.items ?? []).map((item) => ({
          ...item,
          qty: Number(item.qty),
        })),
      };

      const updated = await purchases.patch(editable.id, payload);
      setDetailsCache((prev) => ({ ...prev, [updated.id]: updated }));
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast({ type: "success", message: "درخواست خرید با موفقیت به‌روزرسانی شد." });
      setEditable(toEditable(updated));
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

  function closeDetails() {
    setSelectedId(null);
    setEditable(null);
    setErrors({});
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <h2>فرم‌های درخواست خرید</h2>
        <select
          className={styles.filter}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as PurchaseStatus | "")}
        >
          <option value="">همه وضعیت‌ها</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
      </div>

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
          <strong>درخواستی برای نمایش وجود ندارد.</strong>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>وضعیت</th>
              <th>اولویت</th>
              <th>محل مصرف</th>
              <th>مبلغ</th>
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className={styles.idCell}>{item.id.slice(0, 8)}...</td>
                <td>
                  <span className={`${styles.badge} ${styles[`status${item.status}` as keyof typeof styles] ?? ""}`.trim()}>
                    {statusLabels[item.status]}
                  </span>
                </td>
                <td>{priorityLabels[item.priority ?? ""] ?? item.priority ?? "-"}</td>
                <td>{item.usage_location || "-"}</td>
                <td>{item.total != null ? item.total.toLocaleString("fa-IR") : "-"}</td>
                <td>
                  <button type="button" className="btn-tertiary" onClick={() => openDetails(item.id)}>
                    مشاهده / ویرایش
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedId && editable && (
        <div className={styles.backdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <header className={styles.header}>
              <div>
                <h2>ویرایش درخواست خرید</h2>
                <p>کد درخواست: {editable.id}</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeDetails}>
                بستن
              </button>
            </header>

            {detailsLoading ? (
              <div className={styles.loading}>در حال بارگذاری...</div>
            ) : (
              <div className={styles.body}>
                <div className={styles.section}>
                  <div className={styles.field}>
                    <label>وضعیت *</label>
                    <select
                      value={editable.status}
                      onChange={(event) => handleEditableChange("status", event.target.value as PurchaseStatus)}
                      className={errors.status ? styles.inputError : ""}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {statusLabels[option]}
                        </option>
                      ))}
                    </select>
                    {errors.status && <span className={styles.errorText}>{errors.status}</span>}
                  </div>

                  <div className={styles.field}>
                    <label>تامین‌کننده</label>
                    <input
                      maxLength={120}
                      value={editable.vendor}
                      onChange={(event) => handleEditableChange("vendor", event.target.value)}
                      className={errors.vendor ? styles.inputError : ""}
                      placeholder="حداکثر ۱۲۰ کاراکتر"
                    />
                    {errors.vendor && <span className={styles.errorText}>{errors.vendor}</span>}
                  </div>

                  <div className={styles.field}>
                    <label>مبلغ کل</label>
                    <input
                      value={editable.total}
                      onChange={(event) => handleEditableChange("total", event.target.value.replace(/[^0-9.]/g, ""))}
                      className={errors.total ? styles.inputError : ""}
                      inputMode="decimal"
                      placeholder="مثال: 1500000"
                    />
                    {errors.total && <span className={styles.errorText}>{errors.total}</span>}
                  </div>

                  <div className={styles.field}>
                    <label>محل مصرف</label>
                    <input
                      maxLength={120}
                      value={editable.usage_location}
                      onChange={(event) => handleEditableChange("usage_location", event.target.value)}
                      className={errors.usage_location ? styles.inputError : ""}
                      placeholder="مثال: واحد فنی"
                    />
                    {errors.usage_location && (
                      <span className={styles.errorText}>{errors.usage_location}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label>اولویت</label>
                    <select
                      value={editable.priority}
                      onChange={(event) => handleEditableChange("priority", event.target.value)}
                      className={errors.priority ? styles.inputError : ""}
                    >
                      <option value="">انتخاب کنید</option>
                      <option value="LOW">کم</option>
                      <option value="MEDIUM">متوسط</option>
                      <option value="HIGH">زیاد</option>
                    </select>
                    {errors.priority && <span className={styles.errorText}>{errors.priority}</span>}
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.itemsHeader}>
                    <h3>آیتم‌ها</h3>
                    <button type="button" className={styles.addButton} onClick={addItem}>
                      افزودن آیتم
                    </button>
                  </div>
                  {errors.items && <span className={styles.errorText}>{errors.items}</span>}

                  <div className={styles.items}>
                    {editable.items.map((item, index) => {
                      const skuHintId = `pr-item-${index}-sku-hint`;
                      const skuErrorId = `pr-item-${index}-sku-error`;
                      const nameHintId = `pr-item-${index}-name-hint`;
                      const nameErrorId = `pr-item-${index}-name-error`;
                      const qtyHintId = `pr-item-${index}-qty-hint`;
                      const qtyErrorId = `pr-item-${index}-qty-error`;
                      const unitHintId = `pr-item-${index}-unit-hint`;
                      const unitErrorId = `pr-item-${index}-unit-error`;

                      return (
                        <div key={`${item.sku}-${index}`} className={styles.itemCard}>
                          <div className={styles.itemRow}>
                            <label htmlFor={`pr-item-${index}-sku`}>SKU *</label>
                            <input
                              id={`pr-item-${index}-sku`}
                              value={item.sku}
                              maxLength={40}
                              placeholder="حداکثر ۴۰ کاراکتر (حروف/عدد/خط تیره)"
                              onChange={(event) => updateItem(index, "sku", event.target.value)}
                              className={`${styles.itemInput} ${styles.ltrInput} ${errors[`items[${index}].sku`] ? styles.inputError : ""}`.trim()}
                              aria-describedby={`${skuHintId}${errors[`items[${index}].sku`] ? ` ${skuErrorId}` : ""}`.trim()}
                            />
                            <small id={skuHintId} className={styles.hintMuted}>
                              حروف، عدد یا خط تیره – حداکثر ۴۰ کاراکتر
                            </small>
                            {errors[`items[${index}].sku`] && (
                              <span id={skuErrorId} className={styles.errorText}>
                                {errors[`items[${index}].sku`]}
                              </span>
                            )}
                          </div>

                          <div className={styles.itemRow}>
                            <label htmlFor={`pr-item-${index}-name`}>نام کالا *</label>
                            <input
                              id={`pr-item-${index}-name`}
                              value={item.name}
                              maxLength={120}
                              placeholder="حداکثر ۱۲۰ کاراکتر"
                              onChange={(event) => updateItem(index, "name", event.target.value)}
                              className={`${styles.itemInput} ${errors[`items[${index}].name`] ? styles.inputError : ""}`.trim()}
                              aria-describedby={`${nameHintId}${errors[`items[${index}].name`] ? ` ${nameErrorId}` : ""}`.trim()}
                            />
                            <small id={nameHintId} className={styles.hintMuted}>
                              نام کالا را کامل و خوانا وارد کنید (حداکثر ۱۲۰ کاراکتر)
                            </small>
                            {errors[`items[${index}].name`] && (
                              <span id={nameErrorId} className={styles.errorText}>
                                {errors[`items[${index}].name`]}
                              </span>
                            )}
                          </div>

                          <div className={styles.itemRow}>
                            <label htmlFor={`pr-item-${index}-qty`}>تعداد *</label>
                            <input
                              id={`pr-item-${index}-qty`}
                              type="number"
                              min={1}
                              max={99999}
                              step={1}
                              value={item.qty}
                              placeholder="بین ۱ تا ۹۹۹۹۹"
                              onChange={(event) => updateItem(index, "qty", Number(event.target.value))}
                              className={`${styles.itemInput} ${errors[`items[${index}].qty`] ? styles.inputError : ""}`.trim()}
                              aria-describedby={`${qtyHintId}${errors[`items[${index}].qty`] ? ` ${qtyErrorId}` : ""}`.trim()}
                            />
                            <small id={qtyHintId} className={styles.hintMuted}>
                              فقط اعداد صحیح بین ۱ تا ۹۹۹۹۹
                            </small>
                            {errors[`items[${index}].qty`] && (
                              <span id={qtyErrorId} className={styles.errorText}>
                                {errors[`items[${index}].qty`]}
                              </span>
                            )}
                          </div>

                          <div className={styles.itemRow}>
                            <label htmlFor={`pr-item-${index}-unit`}>واحد *</label>
                            <input
                              id={`pr-item-${index}-unit`}
                              value={item.unit}
                              maxLength={16}
                              placeholder="مثال: pack — حداکثر ۱۶ کاراکتر"
                              onChange={(event) => updateItem(index, "unit", event.target.value)}
                              className={`${styles.itemInput} ${errors[`items[${index}].unit`] ? styles.inputError : ""}`.trim()}
                              aria-describedby={`${unitHintId}${errors[`items[${index}].unit`] ? ` ${unitErrorId}` : ""}`.trim()}
                            />
                            <small id={unitHintId} className={styles.hintMuted}>
                              حداکثر ۱۶ کاراکتر (مثلاً pack، carton، box)
                            </small>
                            {errors[`items[${index}].unit`] && (
                              <span id={unitErrorId} className={styles.errorText}>
                                {errors[`items[${index}].unit`]}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => removeItem(index)}
                            disabled={editable.items.length === 1}
                          >
                            حذف آیتم
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <footer className={styles.footer}>
              <button type="button" className="btn-outline" onClick={closeDetails}>
                بستن
              </button>
              <button
                type="button"
                className="btn-brand"
                onClick={handleSave}
                disabled={saving || detailsLoading}
              >
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type}` as keyof typeof styles] ?? ""}`.trim()}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

