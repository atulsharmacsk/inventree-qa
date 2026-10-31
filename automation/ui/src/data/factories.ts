import {
  PART_MODEL_TYPE,
  type NewCategory,
  type NewCompany,
  type NewParameterTemplate,
  type NewPart,
  type NewStockItem,
  type NewStockLocation,
} from '../../../shared/models';
import { uniqueName } from '../../../shared/data';
import type { PartFormInput } from '../models/part';
import type { UploadFile } from '../components/import-session-form.component';

export { uniqueName };

export type ImportRow = { name: string; category?: string };

/** A parts CSV (name, description, category) for import tests; one row with a unique name by default. */
export function partImportCsv(rows: ImportRow[] = [{ name: uniqueName('pw-ui-import') }]): UploadFile {
  const lines = rows.map(({ name, category = '' }) => `${name},Imported by UI automation,${category}`);
  const csv = ['name,description,category', ...lines].join('\n') + '\n';
  return { name: 'parts.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) };
}

export function newPart(overrides: Partial<NewPart> = {}): NewPart {
  return { name: uniqueName('pw-ui-part'), ...overrides };
}

export function newStockItem(part: number, overrides: Partial<NewStockItem> = {}): NewStockItem {
  return { part, quantity: 1, ...overrides };
}

export function newCategory(overrides: Partial<NewCategory> = {}): NewCategory {
  return { name: uniqueName('pw-ui-category'), ...overrides };
}

export function newStockLocation(overrides: Partial<NewStockLocation> = {}): NewStockLocation {
  return { name: uniqueName('pw-ui-location'), ...overrides };
}

export function newSupplier(): NewCompany {
  return { name: uniqueName('pw-ui-supplier'), currency: 'USD', is_supplier: true };
}

export function newCustomer(): NewCompany {
  return { name: uniqueName('pw-ui-customer'), currency: 'USD', is_customer: true, is_supplier: false };
}

/** A part parameter template without units. */
export function newParameterTemplate(overrides: Partial<NewParameterTemplate> = {}): NewParameterTemplate {
  return { name: uniqueName('pw-ui-param'), model_type: PART_MODEL_TYPE, ...overrides };
}

export function partFormInput(overrides: PartFormInput = {}): PartFormInput {
  return { name: uniqueName('pw-ui-part'), description: 'Created by UI automation', ...overrides };
}
