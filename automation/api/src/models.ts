// Company-side records used by the API tests only; part, category, stock, company, and supplier part types are in automation/shared/models.ts.

export type { Company, NewCompany, NewSupplierPart, SupplierPart, SupplierPartFilters } from '../../shared/models';

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
