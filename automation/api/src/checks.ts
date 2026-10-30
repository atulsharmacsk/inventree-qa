import Ajv, { type AnySchema, type ErrorObject } from 'ajv';
import { expect, type APIResponse } from '@playwright/test';
import type { Part, PartList } from '../../shared/models';
import partSchema from '../schemas/part.schema.json';
import partListSchema from '../schemas/paginated-part-list.schema.json';
import categorySchema from '../schemas/category.schema.json';
import categoryListSchema from '../schemas/paginated-category-list.schema.json';
import categoryTreeListSchema from '../schemas/paginated-category-tree-list.schema.json';

// Formats stay unchecked as before, except that "" is not a "uri": otherwise link "" matches both
// oneOf branches (uri, maxLength 0) and fails. Unknown OpenAPI formats ("decimal", "double") are ignored.
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  logger: false,
  formats: { uri: (value: string) => value !== '' },
});
ajv.addSchema([partSchema, partListSchema, categorySchema, categoryListSchema, categoryTreeListSchema] as AnySchema[]);

type SchemaFile = { $id: string; title: string };

/** Returns the value at a JSON pointer such as `/results/0`. */
function valueAt(body: unknown, pointer: string): unknown {
  return pointer
    .split('/')
    .slice(1)
    .reduce<unknown>((node, key) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), body);
}

// Schema documentation defects confirmed by user (OQ-PART-06, 2026-10-29; OQ-PART-07, 2026-10-30):
// uncategorized parts omit `category_name`; pricing_min/max may be numbers and IPN may be null.
function isKnownSchemaGap(body: unknown, error: ErrorObject): boolean {
  if (error.keyword === 'required' && error.params.missingProperty === 'category_name') {
    const part = valueAt(body, error.instancePath);
    return part !== null && typeof part === 'object' && (part as { category?: unknown }).category === null;
  }
  const field = error.instancePath.split('/').pop();
  const value = valueAt(body, error.instancePath);
  if (field === 'pricing_min' || field === 'pricing_max') return typeof value === 'number';
  if (field === 'IPN') return value === null;
  return false;
}

/** Validates a response body against a JSON schema file from `schemas/`. */
export function checkMatchesSchema(body: unknown, schema: SchemaFile): void {
  const validate = ajv.getSchema(schema.$id);
  if (!validate) throw new Error(`Schema ${schema.$id} is not registered`);
  validate(body);
  const problems = (validate.errors ?? [])
    .filter((error) => !isKnownSchemaGap(body, error))
    .map((error) => `${error.instancePath || '(root)'} ${error.message}`);
  expect(problems, `Response does not match the ${schema.title} schema`).toEqual([]);
}

export const checkPartShape = (part: unknown): void => checkMatchesSchema(part, partSchema);

export const checkPartList = (list: unknown): void => checkMatchesSchema(list, partListSchema);

/** Checks a list response is 200 with a valid page that holds exactly `expected`, in any order. */
export async function expectPartsListed(response: APIResponse, expected: Part[]): Promise<PartList> {
  expect(response.status()).toBe(200);
  const body = (await response.json()) as PartList;
  checkPartList(body);
  expect(body.results.map((part) => part.pk).sort()).toEqual(expected.map((part) => part.pk).sort());
  expect(body.count).toBe(expected.length);
  return body;
}

export const checkCategoryShape = (category: unknown): void => checkMatchesSchema(category, categorySchema);

export const checkCategoryList = (list: unknown): void => checkMatchesSchema(list, categoryListSchema);

export const checkCategoryTreeList = (list: unknown): void => checkMatchesSchema(list, categoryTreeListSchema);
