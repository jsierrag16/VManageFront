/**
 * Utilidades para validaciones en tiempo real en formularios
 * Estas funciones se utilizan para validar campos mientras el usuario escribe
 */

// Validación de caracteres inapropiados generales
export const hasInvalidCharacters = (value: string) => {
  // Permitir solo letras, números, @, ., _, - y espacios
  const validPattern = /^[a-zA-Z0-9@.\-_\s]*$/;
  return !validPattern.test(value);
};

// Validación de solo números
export const validateNumero = (value: string): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (!/^[0-9]+$/.test(value)) {
    return 'Solo se permiten números';
  }
  return '';
};

// Validación de números con guiones (para documentos)
export const validateNumeroConGuiones = (value: string): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (!/^[0-9-]+$/.test(value)) {
    return 'Solo se permiten números y guiones';
  }
  return '';
};

// Validación de teléfono
export const validateTelefono = (value: string): string => {
  if (!value.trim()) {
    return 'El teléfono es requerido';
  }
  if (!/^[0-9\s\-()]+$/.test(value)) {
    return 'Solo números, espacios, guiones y paréntesis';
  }
  if (value.replace(/\D/g, '').length < 7) {
    return 'Mínimo 7 dígitos';
  }
  return '';
};

// Validación de email
export const validateEmail = (value: string): string => {
  if (!value.trim()) {
    return 'El email es requerido';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Email inválido';
  }
  return '';
};

// Validación de texto simple (nombres, títulos, etc.)
export const validateTexto = (value: string, minLength: number = 2): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (value.trim().length < minLength) {
    return `Mínimo ${minLength} caracteres`;
  }
  if (/[<>{}[\]\\\/]/.test(value)) {
    return 'Caracteres no permitidos detectados';
  }
  return '';
};

// Validación de texto con caracteres especiales permitidos (descripciones, direcciones)
export const validateTextoExtendido = (value: string, minLength: number = 2): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (value.trim().length < minLength) {
    return `Mínimo ${minLength} caracteres`;
  }
  // Permitir más caracteres pero bloquear los más peligrosos
  if (/[<>{}[\]\\]/.test(value)) {
    return 'Caracteres no permitidos detectados';
  }
  return '';
};

// Validación de textarea (descripción larga)
export const validateTextarea = (value: string, minLength: number = 10, maxLength: number = 500): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (value.trim().length < minLength) {
    return `Mínimo ${minLength} caracteres`;
  }
  if (value.trim().length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  // Permitir más caracteres pero bloquear los más peligrosos
  if (/[<>{}[\]\\]/.test(value)) {
    return 'Caracteres no permitidos detectados';
  }
  return '';
};

// Validación de NIT
export const validateNIT = (value: string): string => {
  if (!value.trim()) {
    return 'El NIT es requerido';
  }
  if (!/^[0-9-]+$/.test(value)) {
    return 'Solo números y guiones';
  }
  if (value.replace(/\D/g, '').length < 9) {
    return 'NIT inválido (mínimo 9 dígitos)';
  }
  return '';
};

// Validación de números decimales (precios, cantidades)
export const validateDecimal = (value: string, allowZero: boolean = false): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (!/^[0-9]+(\.[0-9]+)?$/.test(value)) {
    return 'Solo números y punto decimal';
  }
  const num = parseFloat(value);
  if (!allowZero && num <= 0) {
    return 'Debe ser mayor a 0';
  }
  if (allowZero && num < 0) {
    return 'No puede ser negativo';
  }
  return '';
};

// Validación de porcentaje
export const validatePorcentaje = (value: string): string => {
  if (!value.trim()) {
    return 'Este campo es requerido';
  }
  if (!/^[0-9]+(\.[0-9]+)?$/.test(value)) {
    return 'Solo números y punto decimal';
  }
  const num = parseFloat(value);
  if (num < 0 || num > 100) {
    return 'Debe estar entre 0 y 100';
  }
  return '';
};

// Validación de código (alfanumérico con guiones y guiones bajos)
export const validateCodigo = (value: string, minLength: number = 2): string => {
  if (!value.trim()) {
    return 'El código es requerido';
  }
  if (!/^[a-zA-Z0-9\-_]+$/.test(value)) {
    return 'Solo letras, números, guiones y guiones bajos';
  }
  if (value.trim().length < minLength) {
    return `Mínimo ${minLength} caracteres`;
  }
  return '';
};

// Validación de URL
export const validateURL = (value: string, required: boolean = false): string => {
  if (!value.trim()) {
    return required ? 'La URL es requerida' : '';
  }
  try {
    new URL(value);
    return '';
  } catch {
    return 'URL inválida';
  }
};

// Validación de fecha
export const validateFecha = (value: string): string => {
  if (!value.trim()) {
    return 'La fecha es requerida';
  }
  const fecha = new Date(value);
  if (isNaN(fecha.getTime())) {
    return 'Fecha inválida';
  }
  return '';
};

// Validación de fecha futura
export const validateFechaFutura = (value: string): string => {
  if (!value.trim()) {
    return 'La fecha es requerida';
  }
  const fecha = new Date(value);
  if (isNaN(fecha.getTime())) {
    return 'Fecha inválida';
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha < hoy) {
    return 'Debe ser fecha futura';
  }
  return '';
};

// Validación de select/dropdown
export const validateSelect = (value: string | string[], fieldName: string = 'opción'): string => {
  if (Array.isArray(value)) {
    return value.length === 0 ? `Selecciona al menos una ${fieldName}` : '';
  }
  return !value || value.trim() === '' ? `Selecciona una ${fieldName}` : '';
};

// Hook personalizado para manejar validaciones en tiempo real
export interface ValidationState {
  [key: string]: string;
}

export interface TouchedState {
  [key: string]: boolean;
}

export const createValidationHandlers = (
  values: { [key: string]: any },
  errors: ValidationState,
  touched: TouchedState,
  setErrors: (errors: ValidationState) => void,
  setTouched: (touched: TouchedState) => void,
  validators: { [key: string]: (value: any) => string }
) => {
  const handleChange = (field: string, value: any) => {
    if (touched[field]) {
      const validator = validators[field];
      if (validator) {
        setErrors({ ...errors, [field]: validator(value) });
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const validator = validators[field];
    if (validator) {
      setErrors({ ...errors, [field]: validator(values[field]) });
    }
  };

  const validateAll = (): boolean => {
    const newErrors: ValidationState = {};
    const newTouched: TouchedState = {};
    let isValid = true;

    Object.keys(validators).forEach((field) => {
      const validator = validators[field];
      const error = validator(values[field]);
      newErrors[field] = error;
      newTouched[field] = true;
      if (error) {
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(newTouched);
    return isValid;
  };

  return { handleChange, handleBlur, validateAll };
};

// Función helper para obtener className de input con validación
export const getInputClassName = (
  baseClass: string,
  hasError: boolean,
  isTouched: boolean
): string => {
  return `${baseClass} ${hasError && isTouched ? 'border-red-500 focus:border-red-500' : ''}`;
};