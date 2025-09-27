import { api } from "./api";
import type {
  WarehouseRequestCreate,
  WarehouseRequest,
  WRequestStatus,
} from "../types/requests";

type WarehouseRequestApi = Omit<WarehouseRequest, "items"> & {
  items?: WarehouseRequest["items"] | null;
};

function normalizeWarehouseRequest(request: WarehouseRequestApi): WarehouseRequest {
  const normalizedItems = Array.isArray(request.items) ? request.items : [];
  return {
    ...request,
    items: normalizedItems,
  } as WarehouseRequest;
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return search ? `?${search}` : "";
}

export type ManagerRequestsListParams = {
  status?: WRequestStatus | "";
};

export const requests = {
  async create(payload: WarehouseRequestCreate) {
    return api.post<{ id: string }>("/requests", payload);
  },

  async listMine() {
    const data = await api.get<{ items: WarehouseRequestApi[] }>("/requests");
    return (data?.items ?? []).map(normalizeWarehouseRequest);
  },

  async listAllForManager(params?: ManagerRequestsListParams) {
    const query = buildQuery({
      status: params?.status,
    });
    const data = await api.get<{ items: WarehouseRequestApi[] }>(`/requests${query}`);
    return (data?.items ?? []).map(normalizeWarehouseRequest);
  },

  approve(id: string) {
    return api.post<{ ok: boolean }>(`/requests?action=approve&id=${encodeURIComponent(id)}`);
  },

  reject(id: string) {
    return api.post<{ ok: boolean }>(`/requests?action=reject&id=${encodeURIComponent(id)}`);
  },

  convert(id: string) {
    return api.post<{ ok: boolean; purchase_request_id?: string }>(
      `/requests?action=convert&id=${encodeURIComponent(id)}`
    );
  },

};

export type { WarehouseRequestCreate, WarehouseRequest, WRequestStatus };