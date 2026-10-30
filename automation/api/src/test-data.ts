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

/** A unique string of exactly `length` characters: a unique prefix padded with `filler`. */
export function textOfLength(length: number, filler = 'x'): string {
  const prefix = uniqueName('pw');
  if (prefix.length > length) throw new Error(`Length ${length} is shorter than the unique prefix`);
  return prefix + filler.repeat(length - prefix.length);
}

type TextLimit<Field extends string> = { field: Field; maxLength: number };

/** Part text fields and their schema maxLength (API 561). `units` is left out: its value must also be a valid unit. */
export const PART_TEXT_LIMITS: TextLimit<'name' | 'description' | 'IPN' | 'revision' | 'keywords'>[] = [
  { field: 'name', maxLength: 100 },
  { field: 'description', maxLength: 250 },
  { field: 'IPN', maxLength: 100 },
  { field: 'revision', maxLength: 100 },
  { field: 'keywords', maxLength: 250 },
];

/** Category text fields and their schema maxLength (API 561). `icon` is left out until OQ-VAL-04. */
export const CATEGORY_TEXT_LIMITS: TextLimit<'name' | 'description' | 'default_keywords'>[] = [
  { field: 'name', maxLength: 100 },
  { field: 'description', maxLength: 250 },
  { field: 'default_keywords', maxLength: 250 },
];

/** Part fields the schema marks `writeOnly`; they must never appear in a response. */
export const PART_WRITE_ONLY_FIELDS = ['copy_category_parameters', 'duplicate', 'existing_image', 'initial_stock', 'initial_supplier'] as const;

/** A multi-byte character used to check that maxLength counts characters, not bytes. */
export const MULTI_BYTE_CHARACTER = '部';
