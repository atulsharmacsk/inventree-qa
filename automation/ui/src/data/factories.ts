import type { NewCategory, NewPart } from '../../../shared/models';
import { uniqueName } from '../../../shared/data';
import type { PartFormInput } from '../models/part';

export { uniqueName };

export function newPart(overrides: Partial<NewPart> = {}): NewPart {
  return { name: uniqueName('pw-ui-part'), ...overrides };
}

export function newCategory(overrides: Partial<NewCategory> = {}): NewCategory {
  return { name: uniqueName('pw-ui-category'), ...overrides };
}

export function partFormInput(overrides: PartFormInput = {}): PartFormInput {
  return { name: uniqueName('pw-ui-part'), description: 'Created by UI automation', ...overrides };
}
