import type { PurchaseStatus } from "../../../types/purchases";

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT: "پیش‌نویس",
  SUBMITTED: "ارسال شده",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};

export const PRIORITY_LABELS: Record<string, string> = {
  HIGH: "زیاد",
  MEDIUM: "متوسط",
  LOW: "کم",
};

export const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "بدون اولویت" },
  { value: "LOW", label: "کم" },
  { value: "MEDIUM", label: "متوسط" },
  { value: "HIGH", label: "زیاد" },
];
