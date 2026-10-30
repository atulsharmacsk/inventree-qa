import type { NewCategory, NewPart } from '../../shared/models';
import { uniqueName } from '../../shared/data';

export { uniqueName };

/** A valid new part with a unique name. Pass extra fields to add or override them. */
export function newPart(extraFields: Partial<NewPart> = {}): NewPart {
  return { name: uniqueName('pw-part'), ...extraFields };
}

/** A valid new category with a unique name. Pass extra fields to add or override them. */
export function newCategory(extraFields: Partial<NewCategory> = {}): NewCategory {
  return { name: uniqueName('pw-category'), ...extraFields };
}
