/**
 * Helpers para agregar validaciones en tiempo real a formularios
 */

export interface FormField {
  value: string | string[];
  error: string;
  touched: boolean;
}

export interface FormFields {
  [key: string]: FormField;
}

/**
 * Obtiene la className para un input basado en su estado de validación
 */
export function getInputValidationClass(field: FormField): string {
  if (!field.touched) return '';
  return field.error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : '';
}

/**
 * Determina si se debe mostrar el error de un campo
 */
export function shouldShowError(field: FormField): boolean {
  return field.touched && Boolean(field.error);
}

/**
 * Helper para crear el handler onChange de un campo
 */
export function createChangeHandler<T>(
  field: string,
  validator: (value: T) => string,
  fields: FormFields,
  setFields: (fields: FormFields) => void
) {
  return (value: T) => {
    const fieldData = fields[field];
    const error = fieldData.touched ? validator(value) : fieldData.error;
    
    setFields({
      ...fields,
      [field]: {
        ...fieldData,
        value: value as any,
        error
      }
    });
  };
}

/**
 * Helper para crear el handler onBlur de un campo
 */
export function createBlurHandler(
  field: string,
  validator: (value: any) => string,
  fields: FormFields,
  setFields: (fields: FormFields) => void
) {
  return () => {
    const fieldData = fields[field];
    const error = validator(fieldData.value);
    
    setFields({
      ...fields,
      [field]: {
        ...fieldData,
        touched: true,
        error
      }
    });
  };
}

/**
 * Valida todos los campos y retorna si el formulario es válido
 */
export function validateAllFields(
  fields: FormFields,
  validators: { [key: string]: (value: any) => string },
  setFields: (fields: FormFields) => void
): boolean {
  const newFields = { ...fields };
  let isValid = true;

  Object.keys(validators).forEach(fieldName => {
    const validator = validators[fieldName];
    const field = newFields[fieldName];
    
    if (field) {
      const error = validator(field.value);
      newFields[fieldName] = {
        ...field,
        touched: true,
        error
      };
      
      if (error) {
        isValid = false;
      }
    }
  });

  setFields(newFields);
  return isValid;
}

/**
 * Inicializa los campos del formulario
 */
export function initializeFormFields(fieldNames: string[]): FormFields {
  const fields: FormFields = {};
  
  fieldNames.forEach(name => {
    fields[name] = {
      value: '',
      error: '',
      touched: false
    };
  });
  
  return fields;
}

/**
 * Resetea todos los campos del formulario
 */
export function resetFormFields(fields: FormFields, setFields: (fields: FormFields) => void): void {
  const newFields: FormFields = {};
  
  Object.keys(fields).forEach(key => {
    newFields[key] = {
      value: '',
      error: '',
      touched: false
    };
  });
  
  setFields(newFields);
}
