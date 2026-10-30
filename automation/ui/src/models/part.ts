export type { Category, NewCategory, NewPart, Part } from '../../../shared/models';
export { PART_MODEL_TYPE } from '../../../shared/models';

/** Values typed into the Create Part form. */
export type PartFormInput = {
  name?: string;
  description?: string;
  IPN?: string;
  units?: string;
};
