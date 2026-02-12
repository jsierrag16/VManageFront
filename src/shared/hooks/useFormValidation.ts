import { useState, useCallback } from 'react';

export interface ValidationRule {
  validator: (value: any) => string;
  message?: string;
}

export interface ValidationRules {
  [key: string]: (value: any) => string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export function useFormValidation(validators: ValidationRules) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback(
    (fieldName: string, value: any): string => {
      const validator = validators[fieldName];
      if (!validator) return '';
      return validator(value);
    },
    [validators]
  );

  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      // Solo validar si el campo ya fue tocado
      if (touched[fieldName]) {
        const error = validateField(fieldName, value);
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    },
    [touched, validateField]
  );

  const handleFieldBlur = useCallback(
    (fieldName: string, value: any) => {
      // Marcar como tocado y validar
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      const error = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    },
    [validateField]
  );

  const validateAll = useCallback(
    (values: { [key: string]: any }): boolean => {
      const newErrors: FormErrors = {};
      const newTouched: TouchedFields = {};
      let isValid = true;

      Object.keys(validators).forEach((fieldName) => {
        const error = validateField(fieldName, values[fieldName]);
        newErrors[fieldName] = error;
        newTouched[fieldName] = true;
        if (error) {
          isValid = false;
        }
      });

      setErrors(newErrors);
      setTouched(newTouched);
      return isValid;
    },
    [validators, validateField]
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (fieldName: string): string => {
      return touched[fieldName] ? errors[fieldName] || '' : '';
    },
    [errors, touched]
  );

  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return touched[fieldName] && Boolean(errors[fieldName]);
    },
    [errors, touched]
  );

  return {
    errors,
    touched,
    handleFieldChange,
    handleFieldBlur,
    validateAll,
    resetValidation,
    getFieldError,
    hasFieldError,
    setTouched,
    setErrors,
  };
}
