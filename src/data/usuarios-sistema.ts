import { Permisos, createEmptyPermisos, createFullPermisos } from "./roles";

export interface UsuarioSistema {
  id: number;
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  avatarUrl?: string;
  rol: string;
  permisos: Permisos;
  estado: boolean;
  bodegasIds: number[];
}

// Usuarios del sistema con sus credenciales y permisos
export const usuariosSistema: UsuarioSistema[] = [
  {
    id: 1,
    email: "administrador@gmail.com",
    password: "1234",
    nombre: "Juan",
    apellido: "Pérez",
    documento: "1234567890",
    telefono: "3001234567",
    rol: "Administrador",
    estado: true,
    bodegasIds: [1, 2, 3, 4],
    permisos: createFullPermisos(),
  },
  {
    id: 2,
    email: "vendedor@gmail.com",
    password: "1234",
    nombre: "María",
    apellido: "González",
    documento: "9876543210",
    telefono: "3109876543",
    rol: "Vendedor",
    estado: true,
    bodegasIds: [2],
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      existencias: {
        ...createEmptyPermisos().existencias,
        productos: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
        },
      },
      ventas: {
        clientes: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: false,
          eliminar: false,
        },
        cotizaciones: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: true,
        },
        ordenesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        remisionesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: false,
          cambiarEstado: false,
          anular: false,
        },
        pagos: {
          ver: true,
          crear: true,
          agregarAbonos: true,
          anular: false,
        },
      },
    },
  },
  {
    id: 3,
    email: "auxadministrativo@gmail.com",
    password: "1234",
    nombre: "Carlos",
    apellido: "Rodríguez",
    documento: "1122334455",
    telefono: "3201122334",
    rol: "Auxiliar Administrativo",
    estado: true,
    bodegasIds: [1],
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      existencias: {
        productos: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: false,
        },
        traslados: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        bodegas: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
          eliminar: false,
        },
      },
      compras: {
        proveedores: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          eliminar: false,
        },
        ordenesCompra: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        remisionesCompra: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
      },
      ventas: {
        clientes: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          eliminar: false,
        },
        cotizaciones: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        ordenesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        remisionesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: true,
          cambiarEstado: true,
          anular: false,
        },
        pagos: {
          ver: true,
          crear: true,
          agregarAbonos: true,
          anular: false,
        },
      },
    },
  },
  {
    id: 4,
    email: "auxlogistico@gmail.com",
    password: "1234",
    nombre: "Pedro",
    apellido: "Martínez",
    documento: "5566778899",
    telefono: "3155667788",
    rol: "Auxiliar de Bodega",
    estado: true,
    bodegasIds: [3],
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      existencias: {
        productos: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
        },
        traslados: {
          ver: true,
          crear: true,
          editar: true,
          cambiarEstado: true,
          anular: true,
        },
        bodegas: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: false,
          eliminar: false,
        },
      },
      compras: {
        ...createEmptyPermisos().compras,
        remisionesCompra: {
          ver: true,
          crear: true,
          descargar: true,
          editar: false,
          cambiarEstado: false,
          anular: false,
        },
      },
      ventas: {
        ...createEmptyPermisos().ventas,
        remisionesVenta: {
          ver: true,
          crear: true,
          descargar: true,
          editar: false,
          cambiarEstado: false,
          anular: false,
        },
      },
    },
  },
  {
    id: 5,
    email: "conductor@gmail.com",
    password: "1234",
    nombre: "Luis",
    apellido: "Fernández",
    documento: "6677889900",
    telefono: "3186677889",
    rol: "Conductor",
    estado: true,
    bodegasIds: [1],
    permisos: {
      ...createEmptyPermisos(),
      dashboard: { acceder: true },
      existencias: {
        ...createEmptyPermisos().existencias,
        traslados: {
          ver: true,
          crear: false,
          editar: false,
          cambiarEstado: true,
          anular: false,
        },
      },
      compras: {
        ...createEmptyPermisos().compras,
        remisionesCompra: {
          ver: true,
          crear: false,
          descargar: true,
          editar: false,
          cambiarEstado: true,
          anular: false,
        },
      },
      ventas: {
        ...createEmptyPermisos().ventas,
        remisionesVenta: {
          ver: true,
          crear: false,
          descargar: true,
          editar: false,
          cambiarEstado: true,
          anular: false,
        },
      },
    },
  },
];