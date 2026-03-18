  export type BasicOption = {
    id: number;
    nombre: string;
    estado?: boolean;
  };

  export type IvaOption = {
    id: number;
    nombre: string;
    porcentaje: number;
    estado?: boolean;
  };

  export type CompraEstado = "Pendiente" | "Aprobada" | "Anulada";

  export type ProductoOrden = {
    producto: {
      id: number;
      nombre: string;
    };
    cantidad: number;
    precio: number;
    subtotal: number;
    idIva: number;
    ivaNombre: string;
    ivaPorcentaje: number;
  };

  export type Compra = {
    id: number;
    numeroOrden: string;
    fecha: string;
    fechaEntrega: string;
    proveedor: string;
    proveedorId?: number;
    terminoPago?: string;
    terminoPagoId?: number;
    bodega?: string;
    bodegaId?: number;
    estado: CompraEstado;
    observaciones: string;
    subtotal: number;
    impuestos: number;
    total: number;
    items: number;
    productos?: ProductoOrden[];
  };

  export type CompraCreatePayload = {
    id_bodega: number;
    id_proveedor: number;
    id_termino_pago: number;
    descripcion?: string;
    fecha_entrega?: string;
    detalle: {
      id_producto: number;
      cantidad: number;
      precio_unitario: number;
      id_iva: number;
    }[];
  };

  export type CompraUpdatePayload = Partial<CompraCreatePayload> & {
    id_estado_compra?: number;
  };
