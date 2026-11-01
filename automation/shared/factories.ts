// Payload factories shared by automation/api and automation/ui; each project passes its own name prefix
// (`pw` for API, `pw-ui` for UI) so leftover records show which project created them.
import type { NewCategory, NewCompany, NewPart, NewStockItem, NewStockLocation } from './models';
import { uniqueName } from './data';

export function testDataFactories(prefix: string) {
  return {
    /** A valid new part with a unique name. Pass extra fields to add or override them. */
    newPart: (extraFields: Partial<NewPart> = {}): NewPart => ({ name: uniqueName(`${prefix}-part`), ...extraFields }),

    /** A valid new category with a unique name. Pass extra fields to add or override them. */
    newCategory: (extraFields: Partial<NewCategory> = {}): NewCategory => ({ name: uniqueName(`${prefix}-category`), ...extraFields }),

    /** A valid new stock location with a unique name. */
    newStockLocation: (extraFields: Partial<NewStockLocation> = {}): NewStockLocation => ({
      name: uniqueName(`${prefix}-location`),
      ...extraFields,
    }),

    /** A valid stock item of one unit for `part`. Pass extra fields to override them. */
    newStockItem: (part: number, extraFields: Partial<NewStockItem> = {}): NewStockItem => ({ part, quantity: 1, ...extraFields }),

    /** A valid new company (USD) with a unique name; `label` names its role in the record name, for example `supplier`. */
    newCompany: (extraFields: Partial<NewCompany> = {}, label = 'company'): NewCompany => ({
      name: uniqueName(`${prefix}-${label}`),
      currency: 'USD',
      ...extraFields,
    }),
  };
}
