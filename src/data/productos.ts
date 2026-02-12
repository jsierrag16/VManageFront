// Tipo de Producto
export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  codigoBarras: string; // Código de barras del producto
  iva: number; // Porcentaje de IVA (0, 5, 19, etc.)
  stockTotal: number;
  estado: boolean;
  lotes: Lote[];
}

// Tipo de Lote
export interface Lote {
  id: string;
  numeroLote: string;
  cantidadDisponible: number;
  fechaVencimiento: string;
  bodega: string;
}

// Datos iniciales de productos (compartidos entre módulos)
export const productosData: Producto[] = [
  {
    id: 'PROD-001',
    nombre: 'Concentrado Inicial Lechones',
    categoria: 'Alimentos',
    descripcion: 'Alimento balanceado para lechones de 0-8 semanas - Bulto 40kg',
    codigoBarras: '1234567890123',
    iva: 19,
    stockTotal: 850,
    estado: true,
    lotes: [
      {
        id: 'LOT-001-A',
        numeroLote: 'AL-2024-001',
        cantidadDisponible: 350,
        fechaVencimiento: '2025-06-15',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-001-B',
        numeroLote: 'AL-2024-045',
        cantidadDisponible: 300,
        fechaVencimiento: '2025-08-20',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-001-C',
        numeroLote: 'AL-2024-078',
        cantidadDisponible: 200,
        fechaVencimiento: '2025-05-10',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-002',
    nombre: 'Concentrado Levante',
    categoria: 'Alimentos',
    descripcion: 'Alimento para cerdos en etapa de levante 8-16 semanas - Bulto 40kg',
    codigoBarras: '1234567890124',
    iva: 19,
    stockTotal: 920,
    estado: true,
    lotes: [
      {
        id: 'LOT-002-A',
        numeroLote: 'AL-2024-012',
        cantidadDisponible: 420,
        fechaVencimiento: '2025-07-30',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-002-B',
        numeroLote: 'AL-2024-056',
        cantidadDisponible: 350,
        fechaVencimiento: '2025-09-15',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-002-C',
        numeroLote: 'AL-2024-089',
        cantidadDisponible: 150,
        fechaVencimiento: '2025-06-25',
        bodega: 'Bodega Principal',
      },
    ],
  },
  {
    id: 'PROD-003',
    nombre: 'Concentrado Engorde',
    categoria: 'Alimentos',
    descripcion: 'Alimento para cerdos en etapa de engorde 16+ semanas - Bulto 40kg',
    codigoBarras: '1234567890125',
    iva: 19,
    stockTotal: 1150,
    estado: true,
    lotes: [
      {
        id: 'LOT-003-A',
        numeroLote: 'AL-2024-023',
        cantidadDisponible: 500,
        fechaVencimiento: '2025-08-25',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-003-B',
        numeroLote: 'AL-2024-067',
        cantidadDisponible: 400,
        fechaVencimiento: '2025-10-18',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-003-C',
        numeroLote: 'AL-2024-091',
        cantidadDisponible: 250,
        fechaVencimiento: '2025-07-05',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-004',
    nombre: 'Vitamina ADE Inyectable',
    categoria: 'Vitaminas y Suplementos',
    descripcion: 'Complejo vitamínico inyectable para porcinos - Frasco 100ml',
    codigoBarras: '1234567890126',
    iva: 19,
    stockTotal: 180,
    estado: true,
    lotes: [
      {
        id: 'LOT-004-A',
        numeroLote: 'VIT-2024-034',
        cantidadDisponible: 90,
        fechaVencimiento: '2026-02-10',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-004-B',
        numeroLote: 'VIT-2024-089',
        cantidadDisponible: 60,
        fechaVencimiento: '2025-12-05',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-004-C',
        numeroLote: 'VIT-2024-112',
        cantidadDisponible: 30,
        fechaVencimiento: '2026-03-20',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-005',
    nombre: 'Ivermectina 1%',
    categoria: 'Medicamentos Veterinarios',
    descripcion: 'Antiparasitario inyectable para control de parásitos - Frasco 50ml',
    codigoBarras: '1234567890127',
    iva: 19,
    stockTotal: 120,
    estado: true,
    lotes: [
      {
        id: 'LOT-005-A',
        numeroLote: 'MED-2024-045',
        cantidadDisponible: 65,
        fechaVencimiento: '2026-04-20',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-005-B',
        numeroLote: 'MED-2024-091',
        cantidadDisponible: 55,
        fechaVencimiento: '2026-01-15',
        bodega: 'Bodega Secundaria',
      },
    ],
  },
  {
    id: 'PROD-006',
    nombre: 'Oxitetraciclina LA',
    categoria: 'Medicamentos Veterinarios',
    descripcion: 'Antibiótico de larga acción para infecciones - Frasco 100ml',
    codigoBarras: '1234567890128',
    iva: 19,
    stockTotal: 95,
    estado: true,
    lotes: [
      {
        id: 'LOT-006-A',
        numeroLote: 'MED-2024-056',
        cantidadDisponible: 50,
        fechaVencimiento: '2025-11-10',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-006-B',
        numeroLote: 'MED-2024-102',
        cantidadDisponible: 45,
        fechaVencimiento: '2026-05-08',
        bodega: 'Bodega Secundaria',
      },
    ],
  },
  {
    id: 'PROD-007',
    nombre: 'Hierro Dextrano Inyectable',
    categoria: 'Vitaminas y Suplementos',
    descripcion: 'Suplemento de hierro para prevenir anemia en lechones - Frasco 100ml',
    codigoBarras: '1234567890129',
    iva: 19,
    stockTotal: 145,
    estado: true,
    lotes: [
      {
        id: 'LOT-007-A',
        numeroLote: 'VIT-2024-067',
        cantidadDisponible: 80,
        fechaVencimiento: '2026-06-30',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-007-B',
        numeroLote: 'VIT-2024-113',
        cantidadDisponible: 65,
        fechaVencimiento: '2025-10-25',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-008',
    nombre: 'Desinfectante Yodado',
    categoria: 'Higiene y Limpieza',
    descripcion: 'Desinfectante a base de yodo para instalaciones - Galón 3.78L',
    codigoBarras: '1234567890130',
    iva: 19,
    stockTotal: 240,
    estado: true,
    lotes: [
      {
        id: 'LOT-008-A',
        numeroLote: 'HIG-2024-078',
        cantidadDisponible: 120,
        fechaVencimiento: '2027-07-15',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-008-B',
        numeroLote: 'HIG-2024-124',
        cantidadDisponible: 80,
        fechaVencimiento: '2027-09-12',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-008-C',
        numeroLote: 'HIG-2024-156',
        cantidadDisponible: 40,
        fechaVencimiento: '2027-05-20',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-009',
    nombre: 'Cal Agrícola',
    categoria: 'Higiene y Limpieza',
    descripcion: 'Cal para desinfección y control de humedad - Bulto 25kg',
    codigoBarras: '1234567890131',
    iva: 19,
    stockTotal: 380,
    estado: true,
    lotes: [
      {
        id: 'LOT-009-A',
        numeroLote: 'HIG-2024-089',
        cantidadDisponible: 180,
        fechaVencimiento: '2028-08-20',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-009-B',
        numeroLote: 'HIG-2024-135',
        cantidadDisponible: 120,
        fechaVencimiento: '2028-12-18',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-009-C',
        numeroLote: 'HIG-2024-178',
        cantidadDisponible: 80,
        fechaVencimiento: '2028-06-15',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-010',
    nombre: 'Electrolitos Orales',
    categoria: 'Vitaminas y Suplementos',
    descripcion: 'Mezcla de electrolitos para rehidratación oral - Sobre 100g',
    codigoBarras: '1234567890132',
    iva: 19,
    stockTotal: 220,
    estado: true,
    lotes: [
      {
        id: 'LOT-010-A',
        numeroLote: 'VIT-2024-091',
        cantidadDisponible: 120,
        fechaVencimiento: '2026-03-25',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-010-B',
        numeroLote: 'VIT-2024-146',
        cantidadDisponible: 100,
        fechaVencimiento: '2026-01-30',
        bodega: 'Bodega Secundaria',
      },
    ],
  },
  {
    id: 'PROD-011',
    nombre: 'Vacuna Circovirus Porcino',
    categoria: 'Vacunas y Biológicos',
    descripcion: 'Vacuna contra circovirus porcino tipo 2 - Frasco 50 dosis',
    codigoBarras: '1234567890133',
    iva: 19,
    stockTotal: 75,
    estado: true,
    lotes: [
      {
        id: 'LOT-011-A',
        numeroLote: 'VAC-2024-102',
        cantidadDisponible: 40,
        fechaVencimiento: '2025-11-05',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-011-B',
        numeroLote: 'VAC-2024-157',
        cantidadDisponible: 35,
        fechaVencimiento: '2026-02-28',
        bodega: 'Bodega Secundaria',
      },
    ],
  },
  {
    id: 'PROD-012',
    nombre: 'Premezcla Minerales',
    categoria: 'Vitaminas y Suplementos',
    descripcion: 'Premezcla de minerales para cerdos - Bulto 25kg',
    codigoBarras: '1234567890134',
    iva: 19,
    stockTotal: 285,
    estado: true,
    lotes: [
      {
        id: 'LOT-012-A',
        numeroLote: 'VIT-2024-113',
        cantidadDisponible: 150,
        fechaVencimiento: '2026-09-10',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-012-B',
        numeroLote: 'VIT-2024-168',
        cantidadDisponible: 85,
        fechaVencimiento: '2025-08-15',
        bodega: 'Bodega Secundaria',
      },
      {
        id: 'LOT-012-C',
        numeroLote: 'VIT-2024-201',
        cantidadDisponible: 50,
        fechaVencimiento: '2026-11-20',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-013',
    nombre: 'Desparasitante Oral',
    categoria: 'Medicamentos Veterinarios',
    descripcion: 'Antiparasitario oral de amplio espectro - Frasco 1L',
    codigoBarras: '1234567890135',
    iva: 19,
    stockTotal: 165,
    estado: true,
    lotes: [
      {
        id: 'LOT-013-A',
        numeroLote: 'MED-2024-215',
        cantidadDisponible: 90,
        fechaVencimiento: '2026-05-05',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-013-B',
        numeroLote: 'MED-2024-245',
        cantidadDisponible: 75,
        fechaVencimiento: '2025-12-30',
        bodega: 'Bodega Secundaria',
      },
    ],
  },
  {
    id: 'PROD-014',
    nombre: 'Bactericida Ambiental',
    categoria: 'Higiene y Limpieza',
    descripcion: 'Desinfectante bactericida para ambiente - Galón 3.78L',
    codigoBarras: '1234567890136',
    iva: 19,
    stockTotal: 195,
    estado: true,
    lotes: [
      {
        id: 'LOT-014-A',
        numeroLote: 'HIG-2024-228',
        cantidadDisponible: 100,
        fechaVencimiento: '2027-08-18',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-014-B',
        numeroLote: 'HIG-2024-267',
        cantidadDisponible: 95,
        fechaVencimiento: '2027-10-22',
        bodega: 'Bodega Norte',
      },
    ],
  },
  {
    id: 'PROD-015',
    nombre: 'Vitamina E + Selenio',
    categoria: 'Vitaminas y Suplementos',
    descripcion: 'Suplemento antioxidante para reproducción - Frasco 100ml',
    codigoBarras: '1234567890137',
    iva: 19,
    stockTotal: 110,
    estado: true,
    lotes: [
      {
        id: 'LOT-015-A',
        numeroLote: 'VIT-2024-289',
        cantidadDisponible: 60,
        fechaVencimiento: '2026-04-15',
        bodega: 'Bodega Principal',
      },
      {
        id: 'LOT-015-B',
        numeroLote: 'VIT-2024-312',
        cantidadDisponible: 50,
        fechaVencimiento: '2026-07-08',
        bodega: 'Bodega Secundaria',
      },
    ],
  },
];