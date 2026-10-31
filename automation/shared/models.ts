// Shapes of the data sent to and received from the InvenTree API, shared by the API and UI projects.

export type PartFlag =
  | 'active'
  | 'assembly'
  | 'component'
  | 'consumable'
  | 'is_template'
  | 'purchaseable'
  | 'salable'
  | 'testable'
  | 'trackable'
  | 'virtual';

export const PART_FLAGS: PartFlag[] = [
  'active',
  'assembly',
  'component',
  'consumable',
  'is_template',
  'purchaseable',
  'salable',
  'testable',
  'trackable',
  'virtual',
];

/** Page size sent as the required `limit` parameter on list endpoints. */
export const DEFAULT_PAGE_LIMIT = 25;

/** A part as returned by the API. */
export type Part = {
  pk: number;
  name: string;
  full_name: string;
  description: string;
  IPN: string | null;
  revision: string | null;
  keywords: string | null;
  category: number | null;
  category_name?: string;
  default_location: number | null;
  category_default_location: number | null;
  units: string | null;
  minimum_stock: number;
  barcode_hash: string;
  starred: boolean;
  thumbnail: string;
  locked: boolean;
  variant_of: number | null;
  /** `YYYY-MM-DD`, set by the server. */
  creation_date: string;
} & Record<PartFlag, boolean>;

/** Fields sent when creating a part. Only `name` is required. */
export type NewPart = {
  name: string;
  description?: string;
  IPN?: string;
  revision?: string;
  keywords?: string;
  units?: string;
  category?: number | null;
  default_location?: number | null;
  /** Write-only: creates a supplier part for the new part. */
  initial_supplier?: { supplier: number; sku: string };
  /** Write-only: creates a stock item; applied by the API even when the Initial Stock Data setting is off (OQ-PART-03). */
  initial_stock?: { quantity: number; location: number };
  minimum_stock?: number;
  maximum_stock?: number;
  variant_of?: number;
  locked?: boolean;
  /** Write-only: whether to copy the category's parameter templates (default true). */
  copy_category_parameters?: boolean;
} & Partial<Record<PartFlag, boolean>>;

/** One page of results from a list endpoint. */
export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PartList = Page<Part>;

/** Query parameters of `GET /api/part/` used by the tests; `limit` defaults to `DEFAULT_PAGE_LIMIT`. */
export type PartFilters = Partial<Record<PartFlag, boolean>> & {
  limit?: number;
  offset?: number;
  search?: string;
  /** A category ID, or the literal `null` for parts without a category. */
  category?: number | 'null';
  cascade?: boolean;
  IPN?: string;
  IPN_regex?: string;
  name_regex?: string;
  has_ipn?: boolean;
  has_stock?: boolean;
  low_stock?: boolean;
  /** Comma-separated part IDs. */
  exclude_id?: string;
  /** A field name, `-` prefixed for descending (for example `-name`). */
  ordering?: string;
  /** `YYYY-MM-DD`; exclusive, compared with `creation_date` (OQ-LIST-04). */
  created_after?: string;
  created_before?: string;
};

/** A part category as returned by the API. */
export type Category = {
  pk: number;
  name: string;
  description: string;
  default_keywords: string | null;
  parent: number | null;
  structural: boolean;
  level: number;
  pathstring: string;
  starred: boolean;
};

/** Fields sent when creating or updating a category. Only `name` is required; `parent: null` moves it to the top level. */
export type NewCategory = {
  name: string;
  description?: string;
  default_keywords?: string;
  parent?: number | null;
  structural?: boolean;
  /** Stock location ID. */
  default_location?: number | null;
};

/** Query filters for `GET /api/part/category/` used by the tests. */
export type CategoryFilters = {
  parent?: number;
  search?: string;
  top_level?: boolean;
};

/** A stock item as returned by `GET /api/stock/`. */
export type StockItem = {
  pk: number;
  part: number;
  quantity: number;
  serial: string | null;
  location: number | null;
};

/** Fields sent when creating stock. `serial_numbers` needs a trackable part. */
export type NewStockItem = {
  part: number;
  quantity: number;
  serial_numbers?: string;
  location?: number;
};

/** Query filters for `GET /api/stock/` used by the tests. */
export type StockItemFilters = {
  part?: number;
  serial?: string;
  location?: number;
};

/** A stock location as returned by `/api/stock/location/`. */
export type StockLocation = {
  pk: number;
  name: string;
};

export type NewStockLocation = {
  name: string;
};

/** A BOM line as returned by `GET /api/bom/`. */
export type BomItem = {
  pk: number;
  part: number;
  sub_part: number;
  quantity: number;
};

/** A company as returned by `/api/company/`. */
export type Company = {
  pk: number;
  name: string;
  is_supplier: boolean;
  is_manufacturer: boolean;
};

/** Fields sent when creating a company; `name` and `currency` are required by the schema. */
export type NewCompany = {
  name: string;
  currency: string;
  is_supplier?: boolean;
  is_manufacturer?: boolean;
  is_customer?: boolean;
};

/** A supplier part as returned by `/api/company/part/`. */
export type SupplierPart = {
  pk: number;
  part: number;
  supplier: number;
  SKU: string;
  manufacturer_part: number | null;
};

export type NewSupplierPart = {
  part: number;
  supplier: number;
  SKU: string;
  manufacturer_part?: number;
};

/** Query filters for `GET /api/company/part/` used by the tests. */
export type SupplierPartFilters = {
  part?: number;
  supplier?: number;
  SKU?: string;
};

/** Purchase orders (`po`) and sales orders (`so`) under `/api/order/`. */
export type OrderKind = 'po' | 'so';

/** A purchase or sales order as returned by `/api/order/po/` or `/api/order/so/`. */
export type Order = {
  pk: number;
  reference: string;
};

/** Fields sent when creating an order: a supplier for a purchase order, a customer for a sales order. */
export type NewOrder = { supplier: number } | { customer: number };

/** A line item as returned by `/api/order/po-line/` or `/api/order/so-line/`; `part` is a supplier part for purchase orders. */
export type OrderLine = {
  pk: number;
  order: number;
  part: number;
  quantity: number;
};

export type NewOrderLine = {
  order: number;
  /** A supplier part ID for a purchase order line, a part ID for a sales order line. */
  part: number;
  quantity: number;
};

/** Fields sent when creating a BOM line: `part` is the assembly, `sub_part` the component. */
export type NewBomItem = {
  part: number;
  sub_part: number;
  quantity: number;
};

/** A parameter template as returned by `/api/parameter/template/`. */
export type ParameterTemplate = {
  pk: number;
  name: string;
  units: string;
};

/** Fields sent when creating a parameter template; `model_type` limits it to one model, for example `part.part`. */
export type NewParameterTemplate = {
  name: string;
  units?: string;
  model_type?: string;
};

/** A parameter value as returned by `GET /api/parameter/`. */
export type Parameter = {
  pk: number;
  template: number;
  model_type: string;
  model_id: number;
  data: string;
};

/** Query filters for `GET /api/parameter/` used by the tests. */
export type ParameterFilters = {
  model_type: string;
  model_id: number;
};

/** Fields sent when creating a parameter value on a record, for example a part. */
export type NewParameter = ParameterFilters & {
  template: number;
  data: string;
};

/** The `model_type` value for parts in the generic parameter API. */
export const PART_MODEL_TYPE = 'part.part';

/** A global setting as returned by `GET /api/settings/global/{key}/`. */
export type GlobalSetting = {
  key: string;
  value: string;
};

/** One item of `GET /api/part/category/tree/`. */
export type CategoryTreeItem = {
  pk: number;
  name: string;
  parent: number | null;
  level: number;
  subcategories: number;
  tree_id: number;
};
