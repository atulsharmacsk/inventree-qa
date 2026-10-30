// Company-side records used by the API tests only; part, category, and stock types are in automation/shared/models.ts.

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

/** A manufacturer part as returned by `/api/company/part/manufacturer/`. */
export type ManufacturerPart = {
  pk: number;
  part: number;
  manufacturer: number;
  MPN: string | null;
};

export type NewManufacturerPart = {
  part: number;
  manufacturer: number;
  MPN: string;
};

/** Query filters for `GET /api/company/part/manufacturer/` used by the tests. */
export type ManufacturerPartFilters = {
  part?: number;
};
