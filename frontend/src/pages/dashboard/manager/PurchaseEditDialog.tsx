import { useCallback, useEffect, useMemo, useState } from "react";
import type { PurchaseRequest, PurchaseStatus } from "../../../types/purchases";
import type { PurchaseUpdatePayload } from "../../../services/purchases";
import { formatJalali } from "../../../utils/date";
import {
  PRIORITY_OPTIONS,
  PURCHASE_STATUS_LABELS,
} from "./purchaseConstants";
import styles from "./PurchaseEditDialog.module.css";

type PurchaseEditDialogProps = {
  open: boolean;
  purchase: PurchaseRequest | null;
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: PurchaseUpdatePayload) => Promise<void>;
};

type FormItem = {
  sku: string;
  name: string;
  qty: string;
  unit: string;
};

type FormState = {
  status: PurchaseStatus | "";
  vendor: string;
  total: string;
  usage_location: string;
  priority: string;
  created_at: string;
  items: FormItem[];
};

type ErrorBag = Record<string, string>;

const STATUS_OPTIONS: PurchaseStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

function createEmptyItem(): FormItem {
  return { sku: "", name: "", qty: "1", unit: "" };
}

function createInitialForm(purchase: PurchaseRequest | null): FormState {
  if (!purchase) {
    return {
      status: "",
      vendor: "",
      total: "",
      usage_location: "",
      priority: "",
      created_at: "",
      items: [createEmptyItem()],
    };
  }

  const normalizedItems = Array.isArray(purchase.items) && purchase.items.length
    ? purchase.items.map((item) => ({
        sku: item.sku ?? "",
        name: item.name ?? "",
        qty: item.qty != null ? String(item.qty) : "1",
        unit: item.unit ?? "",
      }))
    : [createEmptyItem()];

  return {
    status: purchase.status,
    vendor: purchase.vendor ?? "",
    total: purchase.total != null ? String(purchase.total) : "",
    usage_location: purchase.usage_location ?? "",
    priority: purchase.priority ?? "",
    created_at: purchase.created_at,
    items: normalizedItems,
  };
}

function snapshot(form: FormState) {
  return JSON.stringify({
    ...form,
    items: form.items.map((item) => ({
      sku: item.sku.trim(),
      name: item.name.trim(),
      qty: Number(item.qty) || 0,
      unit: item.unit.trim(),
    })),
  });
}

function validate(form: FormState): ErrorBag {
  const errors: ErrorBag = {};

  if (!form.status) {
    errors.status = "وضعیت را انتخاب کنید.";
  }

  const vendor = form.vendor.trim();
  if (!vendor) {
    errors.vendor = "نام تأمین‌کننده الزامی است.";
  } else if (vendor.length > 120) {
    errors.vendor = "حداکثر ۱۲۰ کاراکتر.";
  }

  if (!form.total.trim()) {
    errors.total = "مبلغ را وارد کنید.";
  } else {
    const totalValue = Number(form.total);
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      errors.total = "مبلغ معتبر وارد کنید.";
    }
  }

  if (!form.items.length) {
    errors.items = "حداقل یک آیتم باید ثبت شود.";
  }

  form.items.forEach((item, index) => {
    const sku = item.sku.trim();
    if (!sku) {
      errors[`items.${index}.sku`] = "SKU الزامی است.";
    } else if (sku.length > 40) {
      errors[`items.${index}.sku`] = "حداکثر ۴۰ کاراکتر.";
    }

    const name = item.name.trim();
    if (!name) {
      errors[`items.${index}.name`] = "نام کالا الزامی است.";
    } else if (name.length > 120) {
      errors[`items.${index}.name`] = "حداکثر ۱۲۰ کاراکتر.";
    }

    const qtyValue = Number(item.qty);
    if (!Number.isInteger(qtyValue) || qtyValue < 1 || qtyValue > 99999) {
      errors[`items.${index}.qty`] = "تعداد بین ۱ تا ۹۹۹۹۹.";
    }

    const unit = item.unit.trim();
    if (!unit) {
      errors[`items.${index}.unit`] = "واحد را وارد کنید.";
    } else if (unit.length > 16) {
      errors[`items.${index}.unit`] = "حداکثر ۱۶ کاراکتر.";
    }
  });

  return errors;
}

export function PurchaseEditDialog({
  open,
  purchase,
  loading,
  saving,
  onClose,
  onSubmit,
}: PurchaseEditDialogProps) {
  const [form, setForm] = useState<FormState>(() => createInitialForm(purchase));
  const [initialSnapshot, setInitialSnapshot] = useState<string>(() => snapshot(createInitialForm(purchase)));
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextForm = createInitialForm(purchase);
    setForm(nextForm);
    setInitialSnapshot(snapshot(nextForm));
    setShowErrors(false);
  }, [open, purchase?.id]);

  const errors = useMemo(() => validate(form), [form]);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const isDirty = useMemo(() => snapshot(form) !== initialSnapshot, [form, initialSnapshot]);

  const handleClose = useCallback(() => {
    if (!open || saving) {
      return;
    }
    if (isDirty) {
      const confirmed = window.confirm("تغییرات ذخیره نشده است. آیا از بستن فرم مطمئن هستید؟");
      if (!confirmed) {
        return;
      }
    }
    onClose();
  }, [open, saving, isDirty, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  function handleFieldChange<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleItemChange(index: number, key: keyof FormItem, value: FormItem[typeof key]) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }));
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  }

  function removeItem(index: number) {
    setForm((prev) => {
      if (prev.items.length === 1) return prev;
      return { ...prev, items: prev.items.filter((_, idx) => idx !== index) };
    });
  }

  async function handleSubmit() {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    const payload: PurchaseUpdatePayload = {
      status: form.status || undefined,
      vendor: form.vendor.trim(),
      total: Number(form.total),
      usage_location: form.usage_location.trim() || null,
      priority: form.priority || null,
      items: form.items.map((item) => ({
        sku: item.sku.trim(),
        name: item.name.trim(),
        qty: Number(item.qty),
        unit: item.unit.trim(),
      })),
    };

    setShowErrors(false);
    await onSubmit(payload);
  }

  if (!open) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <div className={styles.dialogInner}>
          <header className={styles.header}>
            <div className={styles.titleBlock}>
              <h2>ویرایش درخواست خرید</h2>
              {purchase?.id && <span className={styles.code}>کد: {purchase.id}</span>}
            </div>
            <div className={styles.headerActions}>
              {form.status && (
                <span
                  className={`${styles.badge} ${styles[`status${form.status}` as keyof typeof styles] ?? ""}`.trim()}
                >
                  {PURCHASE_STATUS_LABELS[form.status as PurchaseStatus]}
                </span>
              )}
              <button type="button" className="btn-outline" onClick={handleClose} disabled={saving}>
                بستن
              </button>
            </div>
          </header>

          <div className={styles.body}>
            {loading ? (
              <div className={styles.loading}>در حال بارگذاری...</div>
            ) : (
              <>
                <section className={styles.metaGrid}>
                  <div className={styles.field}>
                    <label htmlFor="pr-status">وضعیت *</label>
                    <select
                      id="pr-status"
                      value={form.status}
                      onChange={(event) => handleFieldChange("status", event.target.value as PurchaseStatus | "")}
                      disabled={saving}
                      className={showErrors && errors.status ? styles.inputError : ""}
                    >
                      <option value="">انتخاب کنید</option>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {PURCHASE_STATUS_LABELS[option]}
                        </option>
                      ))}
                    </select>
                    {showErrors && errors.status && <span className={styles.errorText}>{errors.status}</span>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="pr-vendor">تأمین‌کننده *</label>
                    <input
                      id="pr-vendor"
                      value={form.vendor}
                      maxLength={120}
                      placeholder="نام شرکت یا فروشگاه"
                      onChange={(event) => handleFieldChange("vendor", event.target.value)}
                      disabled={saving}
                      className={showErrors && errors.vendor ? styles.inputError : ""}
                    />
                    <small className={styles.hint}>حداکثر ۱۲۰ کاراکتر.</small>
                    {showErrors && errors.vendor && <span className={styles.errorText}>{errors.vendor}</span>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="pr-total">مبلغ کل *</label>
                    <input
                      id="pr-total"
                      value={form.total}
                      inputMode="decimal"
                      placeholder="مثال: 1500000"
                      onChange={(event) => handleFieldChange("total", event.target.value.replace(/[^0-9.]/g, ""))}
                      disabled={saving}
                      className={showErrors && errors.total ? styles.inputError : ""}
                    />
                    <small className={styles.hint}>فقط عدد، بدون جداکننده.</small>
                    {showErrors && errors.total && <span className={styles.errorText}>{errors.total}</span>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="pr-usage">محل مصرف</label>
                    <input
                      id="pr-usage"
                      value={form.usage_location}
                      maxLength={120}
                      placeholder="مثال: دفتر مرکزی"
                      onChange={(event) => handleFieldChange("usage_location", event.target.value)}
                      disabled={saving}
                    />
                    <small className={styles.hint}>در صورت نیاز، محل استفاده را بنویسید.</small>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="pr-priority">اولویت</label>
                    <select
                      id="pr-priority"
                      value={form.priority}
                      onChange={(event) => handleFieldChange("priority", event.target.value)}
                      disabled={saving}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value || "none"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>تاریخ ایجاد</label>
                    <div className={styles.readonlyField}>{formatJalali(form.created_at) || "-"}</div>
                  </div>
                </section>

                <section className={styles.itemsSection} aria-labelledby="pr-items-heading">
                  <div className={styles.itemsHeader}>
                    <h3 id="pr-items-heading">آیتم‌ها</h3>
                    <button
                      type="button"
                      className="btn-tertiary"
                      onClick={addItem}
                      disabled={saving}
                    >
                      افزودن آیتم
                    </button>
                  </div>
                  {showErrors && errors.items && <span className={styles.errorText}>{errors.items}</span>}
                  <div className={styles.itemsGrid}>
                    {form.items.map((item, index) => {
                      const skuError = errors[`items.${index}.sku`];
                      const nameError = errors[`items.${index}.name`];
                      const qtyError = errors[`items.${index}.qty`];
                      const unitError = errors[`items.${index}.unit`];

                      return (
                        <div key={`purchase-item-${index}`} className={styles.itemCard}>
                          <div className={styles.itemField}>
                            <label htmlFor={`pr-item-${index}-sku`}>SKU *</label>
                            <input
                              id={`pr-item-${index}-sku`}
                              value={item.sku}
                              maxLength={40}
                              placeholder="حروف، عدد یا خط تیره"
                              onChange={(event) => handleItemChange(index, "sku", event.target.value)}
                              disabled={saving}
                              className={`${styles.ltrInput} ${showErrors && skuError ? styles.inputError : ""}`.trim()}
                            />
                            <small className={styles.hint}>حداکثر ۴۰ کاراکتر.</small>
                            {showErrors && skuError && <span className={styles.errorText}>{skuError}</span>}
                          </div>

                          <div className={styles.itemField}>
                            <label htmlFor={`pr-item-${index}-name`}>نام کالا *</label>
                            <input
                              id={`pr-item-${index}-name`}
                              value={item.name}
                              maxLength={120}
                              placeholder="حداکثر ۱۲۰ کاراکتر"
                              onChange={(event) => handleItemChange(index, "name", event.target.value)}
                              disabled={saving}
                              className={showErrors && nameError ? styles.inputError : ""}
                            />
                            {showErrors && nameError && <span className={styles.errorText}>{nameError}</span>}
                          </div>

                          <div className={styles.itemField}>
                            <label htmlFor={`pr-item-${index}-qty`}>تعداد *</label>
                            <input
                              id={`pr-item-${index}-qty`}
                              type="number"
                              min={1}
                              max={99999}
                              inputMode="numeric"
                              value={item.qty}
                              onChange={(event) => handleItemChange(index, "qty", event.target.value)}
                              disabled={saving}
                              className={showErrors && qtyError ? styles.inputError : ""}
                            />
                            <small className={styles.hint}>بین ۱ تا ۹۹۹۹۹.</small>
                            {showErrors && qtyError && <span className={styles.errorText}>{qtyError}</span>}
                          </div>

                          <div className={styles.itemField}>
                            <label htmlFor={`pr-item-${index}-unit`}>واحد *</label>
                            <input
                              id={`pr-item-${index}-unit`}
                              value={item.unit}
                              maxLength={16}
                              placeholder="مثال: pack"
                              onChange={(event) => handleItemChange(index, "unit", event.target.value)}
                              disabled={saving}
                              className={showErrors && unitError ? styles.inputError : ""}
                            />
                            {showErrors && unitError && <span className={styles.errorText}>{unitError}</span>}
                          </div>

                          <div className={styles.itemActions}>
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => removeItem(index)}
                              disabled={saving || form.items.length === 1}
                            >
                              حذف آیتم
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </div>

          <footer className={styles.footer}>
            <button type="button" className="btn-outline" onClick={handleClose} disabled={saving}>
              بستن
            </button>
            <button
              type="button"
              className="btn-brand"
              onClick={handleSubmit}
              disabled={saving || loading || !isValid}
            >
              {saving ? <span className={styles.spinner} aria-hidden="true" /> : "ذخیره تغییرات"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
