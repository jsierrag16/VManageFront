export type MetodoPago = "Efectivo" | "Transferencia" | "Tarjeta" | "Cheque";
export type EstadoPago = "Pagado" | "Parcial" | "Pendiente";

export const METODOS_PAGO: MetodoPago[] = [
  "Efectivo",
  "Transferencia",
  "Tarjeta",
  "Cheque",
];

export interface Abono {
  fecha: string;
  monto: number;
  metodoPago: MetodoPago;
  usuario: string;
  observaciones: string;
}

export interface PagoAbono {
  id: number;
  numeroTransaccion: string;
  remisionAsociada: string;
  cliente: string;
  fecha: string;
  metodoPago: MetodoPago;
  monto: number;
  saldoPendiente: number;
  estadoPago: EstadoPago;
  observaciones: string;
  bodega: string;
  abonos?: Abono[];
}

export const pagosAbonosData: PagoAbono[] = [
  {
    id: 1,
    numeroTransaccion: "TRX-001",
    remisionAsociada: "RV-001",
    cliente: "Comercializadora El Campo",
    fecha: "2024-01-15",
    metodoPago: "Transferencia",
    monto: 16950.0,
    saldoPendiente: 0,
    estadoPago: "Pagado",
    observaciones: "Pago completo de remisión",
    bodega: "Bodega Central",
    abonos: [],
  },
  {
    id: 2,
    numeroTransaccion: "TRX-002",
    remisionAsociada: "RV-002",
    cliente: "Distribuidora Las Palmas",
    fecha: "2024-01-14",
    metodoPago: "Efectivo",
    monto: 9605.0,
    saldoPendiente: 4605.0,
    estadoPago: "Parcial",
    observaciones: "Pago parcial con abonos",
    bodega: "Bodega Central",
    abonos: [
      {
        fecha: "2024-01-14",
        monto: 5000.0,
        metodoPago: "Efectivo",
        usuario: "Admin Sistema",
        observaciones: "Primer abono",
      },
    ],
  },
  {
    id: 3,
    numeroTransaccion: "TRX-003",
    remisionAsociada: "RV-003",
    cliente: "Granja Santa Rosa",
    fecha: "2024-01-16",
    metodoPago: "Transferencia",
    monto: 5876.0,
    saldoPendiente: 5876.0,
    estadoPago: "Pendiente",
    observaciones: "Pago pendiente de recibir",
    bodega: "Bodega Norte",
    abonos: [],
  },
  {
    id: 4,
    numeroTransaccion: "TRX-004",
    remisionAsociada: "RV-004",
    cliente: "Comercializadora El Campo",
    fecha: "2024-01-13",
    metodoPago: "Efectivo",
    monto: 13560.0,
    saldoPendiente: 3560.0,
    estadoPago: "Parcial",
    observaciones: "Pago en cuotas",
    bodega: "Bodega Central",
    abonos: [
      {
        fecha: "2024-01-13",
        monto: 5000.0,
        metodoPago: "Efectivo",
        usuario: "Admin Sistema",
        observaciones: "Primera cuota",
      },
      {
        fecha: "2024-01-20",
        monto: 5000.0,
        metodoPago: "Tarjeta",
        usuario: "Admin Sistema",
        observaciones: "Segunda cuota",
      },
    ],
  },
  {
    id: 5,
    numeroTransaccion: "TRX-005",
    remisionAsociada: "RV-005",
    cliente: "Distribuidora ABC",
    fecha: "2024-01-12",
    metodoPago: "Transferencia",
    monto: 2825.0,
    saldoPendiente: 0,
    estadoPago: "Pagado",
    observaciones: "Pago completo",
    bodega: "Bodega Sur",
    abonos: [],
  },
];