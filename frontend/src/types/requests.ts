export type ItemRow = {
  sku: string;
  name: string;
  qty: number;
  unit: string;
};

export type WRequestStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "CONVERTED";

export type WarehouseRequestCreate = {
  title: string;
  description?: string;
  item_code?: string;
  specs?: string;
  usage_location?: string;
  priority?: string;
  items: ItemRow[];
  required_date?: string;
};

export type WarehouseRequest = WarehouseRequestCreate & {
  id: string;
  requester_id: string;
  status: WRequestStatus;
  locked_at?: string | null;
  created_at: string;
};
