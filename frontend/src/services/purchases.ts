import { api } from "./api";
import type { PurchaseRequest, PurchaseStatus, PurchaseItem } from "../types/purchases";

type PurchaseRequestApi = Omit<PurchaseRequest, "items"> & {
  items?: PurchaseItem[] | null;
};

function normalizePurchase(pr: PurchaseRequestApi): PurchaseRequest {
  return {
    ...pr,
    items: Array.isArray(pr.items) ? pr.items : [],
  } as PurchaseRequest;
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return search ? `?${search}` : "";
}

export type PurchaseUpdatePayload = {
  items?: PurchaseItem[];
  vendor?: string | null;
  total?: number | null;
  usage_location?: string | null;
  priority?: string | null;
  status?: PurchaseStatus;
};

export type PurchaseListParams = {
  status?: PurchaseStatus | "";
};

export const purchases = {
  async list(params?: PurchaseListParams) {
    const query = buildQuery({
      status: params?.status,
    });
    const data = await api.get<{ items: PurchaseRequestApi[] }>(`/purchases${query}`);
    return (data?.items ?? []).map(normalizePurchase);
  },

  async get(id: string) {
    const data = await api.get<PurchaseRequestApi>(`/purchases?id=${encodeURIComponent(id)}`);
    return normalizePurchase(data);
  },

  async patch(id: string, payload: PurchaseUpdatePayload) {
    await api.patch<{ ok: boolean; id: string }>(`/purchases?id=${encodeURIComponent(id)}`, payload);
    return purchases.get(id);
  },

};