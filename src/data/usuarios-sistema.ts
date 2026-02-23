import { Permisos } from "./roles";

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
    bodegasIds: [1, 2, 3, 4], // ✅ Acceso a todas las bodegas
    permisos: {
      dashboard: { acceder: true },
      inventario: {
        existencias: { crear: true },
        productos: { crear: true, darDeBaja: true },
        traslados: { crear: true },
        bodegas: { crear: true, editar: true, eliminar: true },
      },
      compras: {
        proveedores: { crear: true, editar: true, eliminar: true },
        ordenesCompra: { crear: true, editar: true, eliminar: true, cambiarEstado: true },
        remisionesCompra: { crear: true, editar: true, eliminar: true, cambiarEstado: true },
      },
      ventas: {
        clientes: { crear: true, editar: true, eliminar: true },
        ordenes: { crear: true, editar: true, eliminar: true, cambiarEstado: true },
        remisionesVenta: { crear: true, editar: true, eliminar: true, cambiarEstado: true },
        pagosAbonos: { crear: true, editar: true, eliminar: true, cambiarEstado: true },
      },
      configuracion: {
        roles: { crear: true, editar: true, eliminar: true, inhabilitar: true },
      },
      usuarios: { crear: true, editar: true, eliminar: true, inhabilitar: true },
    },
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
    bodegasIds: [2], // ✅ Solo Bodega 2
    permisos: {
      dashboard: { acceder: true },
      inventario: {
        existencias: { crear: false },
        productos: { crear: false, darDeBaja: false },
        traslados: { crear: false },
        bodegas: { crear: false, editar: false, eliminar: false },
      },
      compras: {
        proveedores: { crear: false, editar: false, eliminar: false },
        ordenesCompra: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
        remisionesCompra: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
      },
      ventas: {
        clientes: { crear: true, editar: true, eliminar: false },
        ordenes: { crear: true, editar: true, eliminar: false, cambiarEstado: true },
        remisionesVenta: { crear: true, editar: false, eliminar: false, cambiarEstado: false },
        pagosAbonos: { crear: true, editar: false, eliminar: false, cambiarEstado: false },
      },
      configuracion: {
        roles: { crear: false, editar: false, eliminar: false, inhabilitar: false },
      },
      usuarios: { crear: false, editar: false, eliminar: false, inhabilitar: false },
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
    bodegasIds: [1], // ✅ Solo Bodega 1
    permisos: {
      dashboard: { acceder: true },
      inventario: {
        existencias: { crear: true },
        productos: { crear: true, darDeBaja: false },
        traslados: { crear: true },
        bodegas: { crear: false, editar: false, eliminar: false },
      },
      compras: {
        proveedores: { crear: true, editar: true, eliminar: false },
        ordenesCompra: { crear: true, editar: true, eliminar: false, cambiarEstado: true },
        remisionesCompra: { crear: true, editar: true, eliminar: false, cambiarEstado: true },
      },
      ventas: {
        clientes: { crear: true, editar: true, eliminar: false },
        ordenes: { crear: true, editar: true, eliminar: false, cambiarEstado: true },
        remisionesVenta: { crear: true, editar: true, eliminar: false, cambiarEstado: true },
        pagosAbonos: { crear: true, editar: true, eliminar: false, cambiarEstado: true },
      },
      configuracion: {
        roles: { crear: false, editar: false, eliminar: false, inhabilitar: false },
      },
      usuarios: { crear: false, editar: false, eliminar: false, inhabilitar: false },
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
    bodegasIds: [3], // ✅ Solo Bodega 3
    permisos: {
      dashboard: { acceder: true },
      inventario: {
        existencias: { crear: true },
        productos: { crear: false, darDeBaja: false },
        traslados: { crear: true },
        bodegas: { crear: false, editar: false, eliminar: false },
      },
      compras: {
        proveedores: { crear: false, editar: false, eliminar: false },
        ordenesCompra: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
        remisionesCompra: { crear: true, editar: false, eliminar: false, cambiarEstado: false },
      },
      ventas: {
        clientes: { crear: false, editar: false, eliminar: false },
        ordenes: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
        remisionesVenta: { crear: true, editar: false, eliminar: false, cambiarEstado: false },
        pagosAbonos: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
      },
      configuracion: {
        roles: { crear: false, editar: false, eliminar: false, inhabilitar: false },
      },
      usuarios: { crear: false, editar: false, eliminar: false, inhabilitar: false },
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
    bodegasIds: [1], // ✅ Solo Bodega 1
    permisos: {
      dashboard: { acceder: true },
      inventario: {
        existencias: { crear: false },
        productos: { crear: false, darDeBaja: false },
        traslados: { crear: false },
        bodegas: { crear: false, editar: false, eliminar: false },
      },
      compras: {
        proveedores: { crear: false, editar: false, eliminar: false },
        ordenesCompra: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
        remisionesCompra: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
      },
      ventas: {
        clientes: { crear: false, editar: false, eliminar: false },
        ordenes: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
        remisionesVenta: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
        pagosAbonos: { crear: false, editar: false, eliminar: false, cambiarEstado: false },
      },
      configuracion: {
        roles: { crear: false, editar: false, eliminar: false, inhabilitar: false },
      },
      usuarios: { crear: false, editar: false, eliminar: false, inhabilitar: false },
    },
  },
];
