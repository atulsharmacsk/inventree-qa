import { PART_MODEL_TYPE, type NewCompany, type NewParameterTemplate } from '../../../shared/models';
import { uniqueName } from '../../../shared/data';
import { testDataFactories } from '../../../shared/factories';
import type { PartFormInput } from '../models/part';
import type { UploadFile } from '../components/import-session-form.component';

export { uniqueName };

const shared = testDataFactories('pw-ui');
export const { newPart, newCategory, newStockLocation, newStockItem } = shared;

export type ImportRow = { name: string; category?: string };

/** A parts CSV (name, description, category) for import tests; one row with a unique name by default. */
export function partImportCsv(rows: ImportRow[] = [{ name: uniqueName('pw-ui-import') }]): UploadFile {
  const lines = rows.map(({ name, category = '' }) => `${name},Imported by UI automation,${category}`);
  const csv = ['name,description,category', ...lines].join('\n') + '\n';
  return { name: 'parts.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) };
}

export function newSupplier(): NewCompany {
  return shared.newCompany({ is_supplier: true }, 'supplier');
}

export function newCustomer(): NewCompany {
  return shared.newCompany({ is_customer: true, is_supplier: false }, 'customer');
}

/** A part parameter template without units. */
export function newParameterTemplate(overrides: Partial<NewParameterTemplate> = {}): NewParameterTemplate {
  return { name: uniqueName('pw-ui-param'), model_type: PART_MODEL_TYPE, ...overrides };
}

export function partFormInput(overrides: PartFormInput = {}): PartFormInput {
  return { name: uniqueName('pw-ui-part'), description: 'Created by UI automation', ...overrides };
}
