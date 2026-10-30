import type { NewCategory, NewPart, NewStockItem } from '../../../shared/models';
import { uniqueName } from '../../../shared/data';
import type { PartFormInput } from '../models/part';

export { uniqueName };

export function newPart(overrides: Partial<NewPart> = {}): NewPart {
  return { name: uniqueName('pw-ui-part'), ...overrides };
}

export function newStockItem(part: number, overrides: Partial<NewStockItem> = {}): NewStockItem {
  return { part, quantity: 1, ...overrides };
}

export function newCategory(overrides: Partial<NewCategory> = {}): NewCategory {
  return { name: uniqueName('pw-ui-category'), ...overrides };
}

export function partFormInput(overrides: PartFormInput = {}): PartFormInput {
  return { name: uniqueName('pw-ui-part'), description: 'Created by UI automation', ...overrides };
}
