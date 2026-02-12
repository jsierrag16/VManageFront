import { useAuth } from "../context/AuthContext";

/**
 * Hook personalizado para verificar permisos del usuario
 * Simplifica el uso de permisos en los componentes
 */
export function usePermisos() {
  const { tienePermiso, usuario } = useAuth();

  return {
    // Permisos de Roles
    roles: {
      crear: tienePermiso("configuracion", "roles", "crear"),
      editar: tienePermiso("configuracion", "roles", "editar"),
      eliminar: tienePermiso("configuracion", "roles", "eliminar"),
      inhabilitar: tienePermiso("configuracion", "roles", "inhabilitar"),
    },
    
    // Permisos de Usuarios
    usuarios: {
      crear: tienePermiso("usuarios", undefined, "crear"),
      editar: tienePermiso("usuarios", undefined, "editar"),
      eliminar: tienePermiso("usuarios", undefined, "eliminar"),
      inhabilitar: tienePermiso("usuarios", undefined, "inhabilitar"),
    },
    
    // Permisos de Clientes
    clientes: {
      crear: tienePermiso("ventas", "clientes", "crear"),
      editar: tienePermiso("ventas", "clientes", "editar"),
      eliminar: tienePermiso("ventas", "clientes", "eliminar"),
    },
    
    // Permisos de Proveedores
    proveedores: {
      crear: tienePermiso("compras", "proveedores", "crear"),
      editar: tienePermiso("compras", "proveedores", "editar"),
      eliminar: tienePermiso("compras", "proveedores", "eliminar"),
    },
    
    // Permisos de Bodegas
    bodegas: {
      crear: tienePermiso("inventario", "bodegas", "crear"),
      editar: tienePermiso("inventario", "bodegas", "editar"),
      eliminar: tienePermiso("inventario", "bodegas", "eliminar"),
    },
    
    // Permisos de Existencias
    existencias: {
      crear: tienePermiso("inventario", "existencias", "crear"),
    },
    
    // Permisos de Productos
    productos: {
      crear: tienePermiso("inventario", "productos", "crear"),
      darDeBaja: tienePermiso("inventario", "productos", "darDeBaja"),
    },
    
    // Permisos de Traslados
    traslados: {
      crear: tienePermiso("inventario", "traslados", "crear"),
    },
    
    // Permisos de Órdenes de Compra
    ordenesCompra: {
      crear: tienePermiso("compras", "ordenesCompra", "crear"),
      editar: tienePermiso("compras", "ordenesCompra", "editar"),
      eliminar: tienePermiso("compras", "ordenesCompra", "eliminar"),
      cambiarEstado: tienePermiso("compras", "ordenesCompra", "cambiarEstado"),
    },
    
    // Permisos de Remisiones de Compra
    remisionesCompra: {
      crear: tienePermiso("compras", "remisionesCompra", "crear"),
      editar: tienePermiso("compras", "remisionesCompra", "editar"),
      eliminar: tienePermiso("compras", "remisionesCompra", "eliminar"),
      cambiarEstado: tienePermiso("compras", "remisionesCompra", "cambiarEstado"),
    },
    
    // Permisos de Órdenes de Venta
    ordenesVenta: {
      crear: tienePermiso("ventas", "ordenes", "crear"),
      editar: tienePermiso("ventas", "ordenes", "editar"),
      eliminar: tienePermiso("ventas", "ordenes", "eliminar"),
      cambiarEstado: tienePermiso("ventas", "ordenes", "cambiarEstado"),
    },
    
    // Permisos de Remisiones de Venta
    remisionesVenta: {
      crear: tienePermiso("ventas", "remisionesVenta", "crear"),
      editar: tienePermiso("ventas", "remisionesVenta", "editar"),
      eliminar: tienePermiso("ventas", "remisionesVenta", "eliminar"),
      cambiarEstado: tienePermiso("ventas", "remisionesVenta", "cambiarEstado"),
    },
    
    // Permisos de Pagos y Abonos
    pagosAbonos: {
      crear: tienePermiso("ventas", "pagosAbonos", "crear"),
      editar: tienePermiso("ventas", "pagosAbonos", "editar"),
      eliminar: tienePermiso("ventas", "pagosAbonos", "eliminar"),
      cambiarEstado: tienePermiso("ventas", "pagosAbonos", "cambiarEstado"),
    },
    
    // Información del usuario
    usuario,
    
    // Función genérica para verificar permisos
    verificar: tienePermiso,
  };
}
