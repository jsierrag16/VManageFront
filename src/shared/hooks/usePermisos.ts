import { useAuth } from "../context/AuthContext";

/**
 * Hook personalizado para verificar permisos del usuario
 */
export function usePermisos() {
  const { tienePermiso, usuario } = useAuth();

  return {
    roles: {
      ver: tienePermiso("administracion", "roles", "ver"),
      crear: tienePermiso("administracion", "roles", "crear"),
      editar: tienePermiso("administracion", "roles", "editar"),
      cambiarEstado: tienePermiso("administracion", "roles", "cambiarEstado"),
      eliminar: tienePermiso("administracion", "roles", "eliminar"),
    },

    usuarios: {
      ver: tienePermiso("administracion", "usuarios", "ver"),
      crear: tienePermiso("administracion", "usuarios", "crear"),
      editar: tienePermiso("administracion", "usuarios", "editar"),
      cambiarEstado: tienePermiso("administracion", "usuarios", "cambiarEstado"),
      restablecerContrasena: tienePermiso(
        "administracion",
        "usuarios",
        "restablecerContrasena"
      ),
    },

    clientes: {
      ver: tienePermiso("ventas", "clientes", "ver"),
      crear: tienePermiso("ventas", "clientes", "crear"),
      editar: tienePermiso("ventas", "clientes", "editar"),
      cambiarEstado: tienePermiso("ventas", "clientes", "cambiarEstado"),
      eliminar: tienePermiso("ventas", "clientes", "eliminar"),
    },

    proveedores: {
      ver: tienePermiso("compras", "proveedores", "ver"),
      crear: tienePermiso("compras", "proveedores", "crear"),
      editar: tienePermiso("compras", "proveedores", "editar"),
      cambiarEstado: tienePermiso("compras", "proveedores", "cambiarEstado"),
      eliminar: tienePermiso("compras", "proveedores", "eliminar"),
    },

    bodegas: {
      ver: tienePermiso("existencias", "bodegas", "ver"),
      crear: tienePermiso("existencias", "bodegas", "crear"),
      editar: tienePermiso("existencias", "bodegas", "editar"),
      cambiarEstado: tienePermiso("existencias", "bodegas", "cambiarEstado"),
      eliminar: tienePermiso("existencias", "bodegas", "eliminar"),
    },

    productos: {
      ver: tienePermiso("existencias", "productos", "ver"),
      crear: tienePermiso("existencias", "productos", "crear"),
      editar: tienePermiso("existencias", "productos", "editar"),
      cambiarEstado: tienePermiso("existencias", "productos", "cambiarEstado"),
    },

    traslados: {
      ver: tienePermiso("existencias", "traslados", "ver"),
      crear: tienePermiso("existencias", "traslados", "crear"),
      editar: tienePermiso("existencias", "traslados", "editar"),
      cambiarEstado: tienePermiso("existencias", "traslados", "cambiarEstado"),
      anular: tienePermiso("existencias", "traslados", "anular"),
    },

    ordenesCompra: {
      ver: tienePermiso("compras", "ordenesCompra", "ver"),
      crear: tienePermiso("compras", "ordenesCompra", "crear"),
      descargar: tienePermiso("compras", "ordenesCompra", "descargar"),
      editar: tienePermiso("compras", "ordenesCompra", "editar"),
      cambiarEstado: tienePermiso("compras", "ordenesCompra", "cambiarEstado"),
      anular: tienePermiso("compras", "ordenesCompra", "anular"),
    },

    remisionesCompra: {
      ver: tienePermiso("compras", "remisionesCompra", "ver"),
      crear: tienePermiso("compras", "remisionesCompra", "crear"),
      descargar: tienePermiso("compras", "remisionesCompra", "descargar"),
      editar: tienePermiso("compras", "remisionesCompra", "editar"),
      cambiarEstado: tienePermiso("compras", "remisionesCompra", "cambiarEstado"),
      anular: tienePermiso("compras", "remisionesCompra", "anular"),
    },

    cotizaciones: {
      ver: tienePermiso("ventas", "cotizaciones", "ver"),
      crear: tienePermiso("ventas", "cotizaciones", "crear"),
      descargar: tienePermiso("ventas", "cotizaciones", "descargar"),
      editar: tienePermiso("ventas", "cotizaciones", "editar"),
      cambiarEstado: tienePermiso("ventas", "cotizaciones", "cambiarEstado"),
      anular: tienePermiso("ventas", "cotizaciones", "anular"),
    },

    ordenesVenta: {
      ver: tienePermiso("ventas", "ordenesVenta", "ver"),
      crear: tienePermiso("ventas", "ordenesVenta", "crear"),
      descargar: tienePermiso("ventas", "ordenesVenta", "descargar"),
      editar: tienePermiso("ventas", "ordenesVenta", "editar"),
      cambiarEstado: tienePermiso("ventas", "ordenesVenta", "cambiarEstado"),
      anular: tienePermiso("ventas", "ordenesVenta", "anular"),
    },

    remisionesVenta: {
      ver: tienePermiso("ventas", "remisionesVenta", "ver"),
      crear: tienePermiso("ventas", "remisionesVenta", "crear"),
      descargar: tienePermiso("ventas", "remisionesVenta", "descargar"),
      editar: tienePermiso("ventas", "remisionesVenta", "editar"),
      cambiarEstado: tienePermiso("ventas", "remisionesVenta", "cambiarEstado"),
      anular: tienePermiso("ventas", "remisionesVenta", "anular"),
    },

    pagos: {
      ver: tienePermiso("ventas", "pagos", "ver"),
      crear: tienePermiso("ventas", "pagos", "crear"),
      agregarAbonos: tienePermiso("ventas", "pagos", "agregarAbonos"),
      anular: tienePermiso("ventas", "pagos", "anular"),
    },

    dashboard: {
      acceder: tienePermiso("dashboard", undefined, "acceder"),
    },

    usuario,
    verificar: tienePermiso,
  };
}