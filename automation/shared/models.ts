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
  // 'assembly',
  // 'component',
  // 'consumable',
  // 'is_template',
  // 'purchaseable',
  // 'salable',
  // 'testable',
  // 'trackable',
  // 'virtual',
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
  category: number | null;
  category_name?: string;
  units: string | null;
  barcode_hash: string;
  starred: boolean;
  thumbnail: string;
} & Record<PartFlag, boolean>;

/** Fields sent when creating a part. Only `name` is required. */
export type NewPart = {
  name: string;
  description?: string;
  IPN?: string;
  keywords?: string;
  units?: string;
  category?: number;
  minimum_stock?: number;
  maximum_stock?: number;
} & Partial<Record<PartFlag, boolean>>;

/** One page of results from a list endpoint. */
export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PartList = Page<Part>;

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
};

/** Query filters for `GET /api/part/category/` used by the tests. */
export type CategoryFilters = {
  parent?: number;
  search?: string;
  top_level?: boolean;
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
