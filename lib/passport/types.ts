export type PassportLifecycle = "passport_preparing" | "build_review" | "awaiting_factory_approval" | "approved_for_shipment" | "shipped" | "delivered_care_active" | "care_expired_lifetime_support";

export type PassportDocument = { label: string; url: string; kind?: string };
export type FactoryApproval = { approvedAt?: string; notes?: string; media?: Array<{ url: string; type?: "image" | "video"; label?: string }> };
export type PassportEvent = { id: string; event_type: string; title: string; detail?: string | null; status?: string | null; occurred_at: string };

export type DollPassport = {
  id: string;
  owner_email: string;
  shopify_order_id: string;
  shopify_order_line_id: string;
  order_number?: string | null;
  order_date?: string | null;
  delivery_date?: string | null;
  lifecycle_state: PassportLifecycle;
  care_started_at?: string | null;
  care_ends_at?: string | null;
  product_title: string;
  product_image_url?: string | null;
  product_handle?: string | null;
  brand?: string | null;
  model?: string | null;
  build_record: Record<string, unknown>;
  factory_approval: FactoryApproval;
  care_documents: PassportDocument[];
  manufacturer_identifiers: Record<string, unknown>;
  created_at: string;
  events?: PassportEvent[];
};

export const lifecycleLabels: Record<PassportLifecycle, string> = {
  passport_preparing: "Passport being prepared",
  build_review: "Build review in progress",
  awaiting_factory_approval: "Awaiting factory approval",
  approved_for_shipment: "Approved for shipment",
  shipped: "Shipped",
  delivered_care_active: "Delivered and Care 365 active",
  care_expired_lifetime_support: "Care 365 ended · lifetime support active"
};
