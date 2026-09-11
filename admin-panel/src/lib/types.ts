export type OrderStatus = "received" | "preparing" | "ready" | "delivered" | "cancelled";
export type StaffRole = "business" | "admin";

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  selections: Array<{
    groupId: string;
    groupName: string;
    options: Array<{ id: string; name: string; extraPrice: number }>;
  }>;
  notes: string;
};

export type OrderStatusEvent = {
  id: number;
  status: OrderStatus;
  created_at: string;
};

export type BusinessOrder = {
  id: string;
  pickup_code: string;
  status: OrderStatus;
  total: number | string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  order_status_events: OrderStatusEvent[];
};

