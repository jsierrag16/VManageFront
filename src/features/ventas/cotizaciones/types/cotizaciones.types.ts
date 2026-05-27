export type ClienteCotizacion = {
  id: string;
  nombre: string;
  email: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  estado: string;
  bodega: string;
  tipoCliente: string;
  fechaRegistro: string;
};

export type ProductoCotizacion = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  codigoBarras: string;
  iva: number;
  stockTotal: number;
  estado: boolean;
  lotes: Array<{
    id: string;
    numeroLote: string;
    cantidadDisponible: number;
    fechaVencimiento: string;
    bodega: string;
  }>;
};

export type ProductoOrdenCotizacion = {
  producto: ProductoCotizacion;
  cantidad: number;
  precio: number;
  subtotal: number;
  idIva?: number;
};