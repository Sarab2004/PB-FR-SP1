export type PurchaseStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export type PurchaseItem = {
  sku: string;
  name: string;
  qty: number;
  unit: string;
};

export type PurchaseRequest = {
  id: string;
  source_wrequest_id?: string | null;
  manager_id?: string | null;
  items: PurchaseItem[];
  vendor?: string | null;
  total?: number | null;
  usage_location?: string | null;
  priority?: string | null;
  status: PurchaseStatus;
  created_at: string;
};
