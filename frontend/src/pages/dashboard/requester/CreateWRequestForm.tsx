import { useMemo, useState } from "react";
import DatePicker, { type Value as DateValue } from "react-multi-date-picker";
import DateObject from "react-date-object";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { HttpError } from "../../../services/http";
import { requests } from "../../../services/requests";
import type { ItemRow, WarehouseRequestCreate } from "../../../types/requests";
import styles from "./CreateWRequestForm.module.css";

type CreateWRequestFormProps = {
  onSuccess?: () => void;
};

type FormState = Omit<WarehouseRequestCreate, "items">;

type FormErrors = Partial<Record<keyof FormState, string>> & { general?: string };

type ItemErrors = Array<Partial<Record<keyof ItemRow, string>>>;

const emptyItem: ItemRow = { sku: "", name: "", qty: 1, unit: "" };

function validateForm(form: FormState, items: ItemRow[]): {
  formErrors: FormErrors;
  itemErrors: ItemErrors;
  isValid: boolean;
} {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "عنوان الزامی است.";
  } else if (form.title.trim().length < 8 || form.title.trim().length > 120) {
    errors.title = "عنوان باید بین ۸ تا ۱۲۰ کاراکتر باشد.";
  }

  if (form.description && form.description.length > 800) {
    errors.description = "حداکثر ۸۰۰ کاراکتر.";
  }

  if (form.specs && form.specs.length > 400) {
    errors.specs = "حداکثر ۴۰۰ کاراکتر.";
  }

  if (form.usage_location && form.usage_location.length > 120) {
    errors.usage_location = "حداکثر ۱۲۰ کاراکتر.";
  }

  if (form.priority && !["LOW", "MEDIUM", "HIGH"].includes(form.priority)) {
    errors.priority = "اولویت انتخاب‌شده معتبر نیست.";
  }

  const itemErrors: ItemErrors = items.map(() => ({}));

  if (!items.length) {
    errors.general = "حداقل یک ردیف آیتم الزامی است.";
  }

  items.forEach((item, index) => {
    const currentErrors: Partial<Record<keyof ItemRow, string>> = {};

    if (!item.sku.trim()) {
      currentErrors.sku = "شناسه کالا (SKU) الزامی است.";
    } else if (item.sku.trim().length > 40) {
      currentErrors.sku = "حداکثر ۴۰ کاراکتر.";
    }

    if (!item.name.trim()) {
      currentErrors.name = "نام کالا الزامی است.";
    } else if (item.name.trim().length > 120) {
      currentErrors.name = "حداکثر ۱۲۰ کاراکتر.";
    }

    const qtyNumber = Number(item.qty);
    if (!Number.isFinite(qtyNumber) || qtyNumber < 1 || qtyNumber > 99999) {
      currentErrors.qty = "تعداد باید بین ۱ تا ۹۹۹۹۹ باشد.";
    }

    if (!item.unit.trim()) {
      currentErrors.unit = "واحد الزامی است.";
    } else if (item.unit.trim().length > 16) {
      currentErrors.unit = "حداکثر ۱۶ کاراکتر.";
    }

    itemErrors[index] = currentErrors;
  });

  const hasErrors =
    Object.values(errors).some(Boolean) ||
    itemErrors.some((row) => Object.values(row).some(Boolean));

  return {
    formErrors: errors,
    itemErrors,
    isValid: !hasErrors,
  };
}

export function CreateWRequestForm({ onSuccess }: CreateWRequestFormProps) {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    item_code: "",
    specs: "",
    usage_location: "",
    priority: "",
    required_date: "",
  });
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requiredDateValue = useMemo(() => {
    if (!form.required_date) return null;
    try {
      return new DateObject({
        date: form.required_date,
        calendar: gregorian,
        locale: gregorian_en,
      }).convert(persian, persian_fa);
    } catch (error) {
      console.warn("invalid required_date", error);
      return null;
    }
  }, [form.required_date]);

  function handleDateChange(value: DateValue | null) {
    if (Array.isArray(value)) {
      const first = value[0] ?? null;
      if (first) {
        const iso = ensureDateObject(first)
          .convert(gregorian, gregorian_en)
          .format("YYYY-MM-DD");
        updateForm("required_date", iso);
      } else {
        updateForm("required_date", "");
      }
      return;
    }

    if (!value) {
      updateForm("required_date", "");
      return;
    }

    const iso = ensureDateObject(value)
      .convert(gregorian, gregorian_en)
      .format("YYYY-MM-DD");
    updateForm("required_date", iso);
  }

  function ensureDateObject(input: DateValue): DateObject {
    if (input instanceof DateObject) {
      return input;
    }

    return new DateObject({ date: input as Date | string | number, calendar: persian, locale: persian_fa });
  }

  const validation = useMemo(() => validateForm(form, items), [form, items]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index: number, key: keyof ItemRow, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [key]: key === "qty" ? Number(value) : String(value) } : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setLocked(false);
    setSuccessMessage(null);
    setApiError(null);
    setSubmitted(false);
    setForm({
      title: "",
      description: "",
      item_code: "",
      specs: "",
      usage_location: "",
      priority: "",
      required_date: "",
    });
    setItems([{ ...emptyItem }]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setApiError(null);

    if (!validation.isValid) {
      setApiError(validation.formErrors.general ?? "لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    setLoading(true);

    const payload: WarehouseRequestCreate = {
      ...form,
      items: items.map((item) => ({
        ...item,
        qty: Number(item.qty),
      })),
      required_date: form.required_date || undefined,
      description: form.description?.trim() ? form.description : undefined,
      item_code: form.item_code?.trim() ? form.item_code : undefined,
      specs: form.specs?.trim() ? form.specs : undefined,
      usage_location: form.usage_location?.trim() ? form.usage_location : undefined,
      priority: form.priority?.trim() ? form.priority : undefined,
    };

    try {
      const result = await requests.create(payload);
      setSuccessMessage(
        result?.id
          ? `درخواست با شناسه ${result.id} با موفقیت ثبت شد.`
          : "درخواست با موفقیت ثبت شد."
      );
      setLocked(true);
      onSuccess?.();
    } catch (err) {
      if (err instanceof HttpError) {
        setApiError(err.message);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("ثبت درخواست با خطا مواجه شد.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.section}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">
            عنوان درخواست *
          </label>
          <input
            id="title"
            maxLength={120}
            className={`${styles.input} ${submitted && validation.formErrors.title ? styles.inputError : ""}`.trim()}
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            disabled={locked}
            required
            placeholder="نمونه: درخواست خرید کاغذ A4"
          />
          <small className={styles.hintMuted}>حداقل ۸ و حداکثر ۱۲۰ کاراکتر</small>
          {submitted && validation.formErrors.title && (
            <span className={styles.errorText}>{validation.formErrors.title}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">
            توضیحات
          </label>
          <textarea
            id="description"
            maxLength={800}
            className={`${styles.textarea} ${submitted && validation.formErrors.description ? styles.inputError : ""}`.trim()}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            disabled={locked}
            placeholder="جزئیات تکمیلی درخواست را اینجا بنویسید (حداکثر ۸۰۰ کاراکتر)"
          />
          <small className={styles.hintMuted}>محدود به ۸۰۰ کاراکتر</small>
          {submitted && validation.formErrors.description && (
            <span className={styles.errorText}>{validation.formErrors.description}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="item_code">
            کد کالا
          </label>
          <input
            id="item_code"
            maxLength={60}
            className={styles.input}
            value={form.item_code}
            onChange={(event) => updateForm("item_code", event.target.value)}
            disabled={locked}
            placeholder="مثال: A4-80G"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="specs">
            مشخصات فنی
          </label>
          <input
            id="specs"
            maxLength={400}
            className={`${styles.input} ${submitted && validation.formErrors.specs ? styles.inputError : ""}`.trim()}
            value={form.specs}
            onChange={(event) => updateForm("specs", event.target.value)}
            disabled={locked}
            placeholder="حداکثر ۴۰۰ کاراکتر"
          />
          {submitted && validation.formErrors.specs && (
            <span className={styles.errorText}>{validation.formErrors.specs}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="usage_location">
            محل مصرف
          </label>
          <input
            id="usage_location"
            maxLength={120}
            className={`${styles.input} ${submitted && validation.formErrors.usage_location ? styles.inputError : ""}`.trim()}
            value={form.usage_location}
            onChange={(event) => updateForm("usage_location", event.target.value)}
            disabled={locked}
            placeholder="مثال: دفتر مرکزی"
          />
          {submitted && validation.formErrors.usage_location && (
            <span className={styles.errorText}>{validation.formErrors.usage_location}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="priority">
            اولویت
          </label>
          <select
            id="priority"
            className={`${styles.select} ${submitted && validation.formErrors.priority ? styles.inputError : ""}`.trim()}
            value={form.priority}
            onChange={(event) => updateForm("priority", event.target.value)}
            disabled={locked}
          >
            <option value="">انتخاب کنید</option>
            <option value="LOW">کم</option>
            <option value="MEDIUM">متوسط</option>
            <option value="HIGH">زیاد</option>
          </select>
          {submitted && validation.formErrors.priority && (
            <span className={styles.errorText}>{validation.formErrors.priority}</span>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>تاریخ نیاز</span>
          <DatePicker
            value={requiredDateValue ?? undefined}
            onChange={handleDateChange}
            calendar={persian}
            locale={persian_fa}
            format="YYYY/MM/DD"
            disabled={locked}
            inputClass={styles.dateInput}
            containerClassName={styles.datePicker}
            placeholder="انتخاب تاریخ"
            editable={false}
          />
          <small className={styles.hintMuted}>نمایش شمسی؛ در سرور به فرمت میلادی ذخیره می‌شود.</small>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.itemHeader}>
          <h3>آیتم‌ها</h3>
          <button
            type="button"
            className={styles.addButton}
            onClick={addItem}
            disabled={locked}
          >
            افزودن ردیف آیتم
          </button>
        </div>

        {submitted && validation.formErrors.general && (
          <span className={styles.errorText}>{validation.formErrors.general}</span>
        )}

        <div className={styles.itemList}>
          {items.map((item, index) => {
            const itemError = validation.itemErrors[index] ?? {};
            const skuHintId = `wr-item-${index}-sku-hint`;
            const skuErrorId = `wr-item-${index}-sku-error`;
            const nameHintId = `wr-item-${index}-name-hint`;
            const nameErrorId = `wr-item-${index}-name-error`;
            const qtyHintId = `wr-item-${index}-qty-hint`;
            const qtyErrorId = `wr-item-${index}-qty-error`;
            const unitHintId = `wr-item-${index}-unit-hint`;
            const unitErrorId = `wr-item-${index}-unit-error`;

            return (
              <div key={index} className={styles.itemCard}>
                <div className={styles.itemFields}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`wr-item-${index}-sku`}>
                      SKU *
                    </label>
                    <input
                      id={`wr-item-${index}-sku`}
                      className={`${styles.input} ${styles.ltrInput} ${submitted && itemError.sku ? styles.inputError : ""}`.trim()}
                      value={item.sku}
                      maxLength={40}
                      placeholder="حداکثر ۴۰ کاراکتر (حروف/عدد/خط تیره)"
                      onChange={(event) => updateItem(index, "sku", event.target.value)}
                      disabled={locked}
                      required
                      aria-describedby={`${skuHintId}${submitted && itemError.sku ? ` ${skuErrorId}` : ""}`.trim()}
                    />
                    <small id={skuHintId} className={styles.hintMuted}>
                      حروف، عدد یا خط تیره – حداکثر ۴۰ کاراکتر
                    </small>
                    {submitted && itemError.sku && (
                      <span id={skuErrorId} className={styles.errorText}>
                        {itemError.sku}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`wr-item-${index}-name`}>
                      نام کالا *
                    </label>
                    <input
                      id={`wr-item-${index}-name`}
                      className={`${styles.input} ${submitted && itemError.name ? styles.inputError : ""}`.trim()}
                      value={item.name}
                      maxLength={120}
                      placeholder="حداکثر ۱۲۰ کاراکتر"
                      onChange={(event) => updateItem(index, "name", event.target.value)}
                      disabled={locked}
                      required
                      aria-describedby={`${nameHintId}${submitted && itemError.name ? ` ${nameErrorId}` : ""}`.trim()}
                    />
                    <small id={nameHintId} className={styles.hintMuted}>
                      نام کالا را کامل و خوانا وارد کنید (حداکثر ۱۲۰ کاراکتر)
                    </small>
                    {submitted && itemError.name && (
                      <span id={nameErrorId} className={styles.errorText}>
                        {itemError.name}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`wr-item-${index}-qty`}>
                      تعداد *
                    </label>
                    <input
                      id={`wr-item-${index}-qty`}
                      className={`${styles.input} ${submitted && itemError.qty ? styles.inputError : ""}`.trim()}
                      type="number"
                      min={1}
                      max={99999}
                      step={1}
                      placeholder="بین ۱ تا ۹۹۹۹۹"
                      value={item.qty}
                      onChange={(event) => updateItem(index, "qty", Number(event.target.value))}
                      disabled={locked}
                      required
                      aria-describedby={`${qtyHintId}${submitted && itemError.qty ? ` ${qtyErrorId}` : ""}`.trim()}
                    />
                    <small id={qtyHintId} className={styles.hintMuted}>
                      فقط اعداد صحیح بین ۱ تا ۹۹۹۹۹
                    </small>
                    {submitted && itemError.qty && (
                      <span id={qtyErrorId} className={styles.errorText}>
                        {itemError.qty}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`wr-item-${index}-unit`}>
                      واحد *
                    </label>
                    <input
                      id={`wr-item-${index}-unit`}
                      className={`${styles.input} ${submitted && itemError.unit ? styles.inputError : ""}`.trim()}
                      value={item.unit}
                      maxLength={16}
                      placeholder="مثال: pack — حداکثر ۱۶ کاراکتر"
                      onChange={(event) => updateItem(index, "unit", event.target.value)}
                      disabled={locked}
                      required
                      aria-describedby={`${unitHintId}${submitted && itemError.unit ? ` ${unitErrorId}` : ""}`.trim()}
                    />
                    <small id={unitHintId} className={styles.hintMuted}>
                      حداکثر ۱۶ کاراکتر (مثلاً pack، carton، box)
                    </small>
                    {submitted && itemError.unit && (
                      <span id={unitErrorId} className={styles.errorText}>
                        {itemError.unit}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeItem(index)}
                    disabled={locked || items.length === 1}
                  >
                    حذف ردیف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {apiError && <div className={styles.error}>{apiError}</div>}
      {successMessage && (
        <div className={styles.success}>
          <span>{successMessage}</span>
          <span className={styles.badgeSubmitted}>SUBMITTED</span>
          <span className={styles.readOnlyHint}>
            فرم قفل شد. برای ثبت درخواست جدید می‌توانید دکمه «شروع فرم تازه» را بزنید.
          </span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className="btn-brand"
          disabled={locked || loading || !validation.isValid}
        >
          {loading ? "در حال ارسال..." : locked ? "ثبت شده" : "ارسال درخواست"}
        </button>
        {locked && (
          <button type="button" className="btn-outline" onClick={resetForm}>
            شروع فرم تازه
          </button>
        )}
      </div>
    </form>
  );
}








