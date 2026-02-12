// Validaciones reutilizables para todos los formularios del sistema

export const validations = {
  // Validaciones de documentos
  numeroDocumento: (value: string) => {
    if (!value.trim()) {
      return 'El número de documento es requerido';
    }
    const validPattern = /^[0-9-]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten números y guiones';
    }
    if (value.length < 6) {
      return 'Mínimo 6 caracteres';
    }
    if (value.length > 20) {
      return 'Máximo 20 caracteres';
    }
    return '';
  },

  // Validaciones de nombres
  nombre: (value: string, minLength: number = 3, maxLength: number = 100) => {
    if (!value.trim()) {
      return 'El nombre es requerido';
    }
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras y espacios';
    }
    if (value.trim().length < minLength) {
      return `Mínimo ${minLength} caracteres`;
    }
    if (value.trim().length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  },

  nombreEmpresa: (value: string, minLength: number = 3, maxLength: number = 100) => {
    if (!value.trim()) {
      return 'El nombre es requerido';
    }
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.\-&]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios, puntos, guiones y &';
    }
    if (value.trim().length < minLength) {
      return `Mínimo ${minLength} caracteres`;
    }
    if (value.trim().length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  },

  // Validaciones de contacto
  email: (value: string) => {
    if (!value.trim()) {
      return 'El email es requerido';
    }
    if (!value.includes('@')) {
      return 'El email debe contener un @';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Formato de email inválido';
    }
    return '';
  },

  telefono: (value: string) => {
    if (!value.trim()) {
      return 'El teléfono es requerido';
    }
    const diezNumeros = /^[0-9]{10}$/;
    if (!diezNumeros.test(value)) {
      return 'Debe tener exactamente 10 números';
    }
    return '';
  },

  // Validaciones de ubicación
  direccion: (value: string, minLength: number = 5, maxLength: number = 200) => {
    if (!value.trim()) {
      return 'La dirección es requerida';
    }
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-,#.]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios, guiones, comas, puntos y #';
    }
    if (value.trim().length < minLength) {
      return `Mínimo ${minLength} caracteres`;
    }
    if (value.trim().length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  },

  // Validaciones de campos opcionales
  observaciones: (value: string, maxLength: number = 500) => {
    if (!value.trim()) {
      return '';
    }
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-¿?¡!]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios y puntuación básica';
    }
    if (value.trim().length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  },

  // Validaciones numéricas
  numeroPositivo: (value: number, nombre: string = 'El valor') => {
    if (!value || value <= 0) {
      return `${nombre} debe ser mayor a 0`;
    }
    return '';
  },

  numeroEnteroPositivo: (value: number, nombre: string = 'El valor') => {
    if (!value || value <= 0) {
      return `${nombre} debe ser mayor a 0`;
    }
    if (!Number.isInteger(value)) {
      return `${nombre} debe ser un número entero`;
    }
    return '';
  },

  cantidad: (value: string) => {
    if (!value.trim()) {
      return 'La cantidad es requerida';
    }
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(value)) {
      return 'Solo se permiten números enteros';
    }
    const cantidad = parseInt(value);
    if (cantidad <= 0) {
      return 'La cantidad debe ser mayor a 0';
    }
    return '';
  },

  cantidadMaxima: (value: string, maxCantidad: number) => {
    const errorBase = validations.cantidad(value);
    if (errorBase) return errorBase;
    
    const cantidad = parseInt(value);
    if (cantidad > maxCantidad) {
      return `Máximo ${maxCantidad} unidades disponibles`;
    }
    return '';
  },

  // Validaciones de fechas
  fecha: (value: string, nombre: string = 'La fecha') => {
    if (!value || value === '') {
      return `${nombre} es requerida`;
    }
    return '';
  },

  fechaPosterior: (fechaFin: string, fechaInicio: string, nombreFin: string = 'La fecha final', nombreInicio: string = 'la fecha inicial') => {
    if (!fechaFin || fechaFin === '') {
      return `${nombreFin} es requerida`;
    }
    if (fechaInicio && fechaFin < fechaInicio) {
      return `${nombreFin} debe ser posterior a ${nombreInicio}`;
    }
    return '';
  },

  // Validaciones de selects
  required: (value: string, nombre: string = 'Este campo') => {
    if (!value || value === '') {
      return `${nombre} es requerido`;
    }
    return '';
  },

  // Validación de monto/precio
  monto: (value: string) => {
    if (!value.trim()) {
      return 'El monto es requerido';
    }
    const validPattern = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!validPattern.test(value)) {
      return 'Formato inválido. Usa números con máximo 2 decimales';
    }
    const monto = parseFloat(value);
    if (monto <= 0) {
      return 'El monto debe ser mayor a 0';
    }
    return '';
  },

  // Validación cruzada de bodegas
  bodegasDiferentes: (bodegaOrigen: string, bodegaDestino: string) => {
    if (bodegaOrigen === bodegaDestino) {
      return 'La bodega de destino debe ser diferente a la de origen';
    }
    return '';
  }
};

// Función helper para validar formularios completos
export const validateAllFields = (
  fields: Record<string, any>,
  validationRules: Record<string, (value: any) => string>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(validationRules).forEach(key => {
    const error = validationRules[key](fields[key]);
    errors[key] = error;
    if (error) isValid = false;
  });

  return { isValid, errors };
};
