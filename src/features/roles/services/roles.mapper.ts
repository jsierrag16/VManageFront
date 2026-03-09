import type { Permisos } from "@/data/roles";
import { createEmptyPermisos } from "@/data/roles";
import type { PermisoBackend, RolBackend } from "../services/roles.services";

type RolUI = {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: Permisos;
  usuariosAsignados: number;
  estado: boolean;
};

const permisoPathMap: Record<string, string[]> = {
  "dashboard.acceder": ["dashboard", "acceder"],

  "existencias.productos.ver": ["existencias", "productos", "ver"],
  "existencias.productos.crear": ["existencias", "productos", "crear"],
  "existencias.productos.editar": ["existencias", "productos", "editar"],
  "existencias.productos.cambiar_estado": ["existencias", "productos", "cambiarEstado"],

  "existencias.traslados.ver": ["existencias", "traslados", "ver"],
  "existencias.traslados.crear": ["existencias", "traslados", "crear"],
  "existencias.traslados.editar": ["existencias", "traslados", "editar"],
  "existencias.traslados.cambiar_estado": ["existencias", "traslados", "cambiarEstado"],
  "existencias.traslados.anular": ["existencias", "traslados", "anular"],

  "existencias.bodegas.ver": ["existencias", "bodegas", "ver"],
  "existencias.bodegas.crear": ["existencias", "bodegas", "crear"],
  "existencias.bodegas.editar": ["existencias", "bodegas", "editar"],
  "existencias.bodegas.cambiar_estado": ["existencias", "bodegas", "cambiarEstado"],
  "existencias.bodegas.eliminar": ["existencias", "bodegas", "eliminar"],

  "compras.proveedores.ver": ["compras", "proveedores", "ver"],
  "compras.proveedores.crear": ["compras", "proveedores", "crear"],
  "compras.proveedores.editar": ["compras", "proveedores", "editar"],
  "compras.proveedores.cambiar_estado": ["compras", "proveedores", "cambiarEstado"],
  "compras.proveedores.eliminar": ["compras", "proveedores", "eliminar"],

  "compras.ordenes_compra.ver": ["compras", "ordenesCompra", "ver"],
  "compras.ordenes_compra.crear": ["compras", "ordenesCompra", "crear"],
  "compras.ordenes_compra.descargar": ["compras", "ordenesCompra", "descargar"],
  "compras.ordenes_compra.editar": ["compras", "ordenesCompra", "editar"],
  "compras.ordenes_compra.cambiar_estado": ["compras", "ordenesCompra", "cambiarEstado"],
  "compras.ordenes_compra.anular": ["compras", "ordenesCompra", "anular"],

  "compras.remisiones_compra.ver": ["compras", "remisionesCompra", "ver"],
  "compras.remisiones_compra.crear": ["compras", "remisionesCompra", "crear"],
  "compras.remisiones_compra.descargar": ["compras", "remisionesCompra", "descargar"],
  "compras.remisiones_compra.editar": ["compras", "remisionesCompra", "editar"],
  "compras.remisiones_compra.cambiar_estado": ["compras", "remisionesCompra", "cambiarEstado"],
  "compras.remisiones_compra.anular": ["compras", "remisionesCompra", "anular"],

  "ventas.clientes.ver": ["ventas", "clientes", "ver"],
  "ventas.clientes.crear": ["ventas", "clientes", "crear"],
  "ventas.clientes.editar": ["ventas", "clientes", "editar"],
  "ventas.clientes.cambiar_estado": ["ventas", "clientes", "cambiarEstado"],
  "ventas.clientes.eliminar": ["ventas", "clientes", "eliminar"],

  "ventas.cotizaciones.ver": ["ventas", "cotizaciones", "ver"],
  "ventas.cotizaciones.crear": ["ventas", "cotizaciones", "crear"],
  "ventas.cotizaciones.descargar": ["ventas", "cotizaciones", "descargar"],
  "ventas.cotizaciones.editar": ["ventas", "cotizaciones", "editar"],
  "ventas.cotizaciones.cambiar_estado": ["ventas", "cotizaciones", "cambiarEstado"],
  "ventas.cotizaciones.anular": ["ventas", "cotizaciones", "anular"],

  "ventas.ordenes_venta.ver": ["ventas", "ordenesVenta", "ver"],
  "ventas.ordenes_venta.crear": ["ventas", "ordenesVenta", "crear"],
  "ventas.ordenes_venta.descargar": ["ventas", "ordenesVenta", "descargar"],
  "ventas.ordenes_venta.editar": ["ventas", "ordenesVenta", "editar"],
  "ventas.ordenes_venta.cambiar_estado": ["ventas", "ordenesVenta", "cambiarEstado"],
  "ventas.ordenes_venta.anular": ["ventas", "ordenesVenta", "anular"],

  "ventas.remisiones_venta.ver": ["ventas", "remisionesVenta", "ver"],
  "ventas.remisiones_venta.crear": ["ventas", "remisionesVenta", "crear"],
  "ventas.remisiones_venta.descargar": ["ventas", "remisionesVenta", "descargar"],
  "ventas.remisiones_venta.editar": ["ventas", "remisionesVenta", "editar"],
  "ventas.remisiones_venta.cambiar_estado": ["ventas", "remisionesVenta", "cambiarEstado"],
  "ventas.remisiones_venta.anular": ["ventas", "remisionesVenta", "anular"],

  "ventas.pagos.ver": ["ventas", "pagos", "ver"],
  "ventas.pagos.crear": ["ventas", "pagos", "crear"],
  "ventas.pagos.agregar_abonos": ["ventas", "pagos", "agregarAbonos"],
  "ventas.pagos.anular": ["ventas", "pagos", "anular"],

  "administracion.roles.ver": ["administracion", "roles", "ver"],
  "administracion.roles.crear": ["administracion", "roles", "crear"],
  "administracion.roles.editar": ["administracion", "roles", "editar"],
  "administracion.roles.cambiar_estado": ["administracion", "roles", "cambiarEstado"],
  "administracion.roles.eliminar": ["administracion", "roles", "eliminar"],

  "administracion.usuarios.ver": ["administracion", "usuarios", "ver"],
  "administracion.usuarios.crear": ["administracion", "usuarios", "crear"],
  "administracion.usuarios.editar": ["administracion", "usuarios", "editar"],
  "administracion.usuarios.cambiar_estado": ["administracion", "usuarios", "cambiarEstado"],
  "administracion.usuarios.restablecer_contrasena": ["administracion", "usuarios", "restablecerContrasena"],
};

function setDeepValue(obj: any, path: string[], value: boolean) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}

export function permisosBackendToFrontend(permisosBackend: PermisoBackend[]): Permisos {
  const permisos = createEmptyPermisos();

  permisosBackend.forEach((permiso) => {
    const path = permisoPathMap[permiso.nombre_permiso];
    if (path) {
      setDeepValue(permisos, path, true);
    }
  });

  return permisos;
}

export function rolBackendToUI(rol: RolBackend): RolUI {
  const permisosBackend = rol.roles_permisos.map((rp) => rp.permisos);

  return {
    id: rol.id_rol,
    nombre: rol.nombre_rol,
    descripcion: rol.descripcion,
    permisos: permisosBackendToFrontend(permisosBackend),
    usuariosAsignados: rol._count?.usuario ?? 0,
    estado: rol.estado,
  };
}

export function permisosFrontendToIds(
  formPermisos: Permisos,
  catalogoPermisos: PermisoBackend[],
): number[] {
  const nombresActivos = new Set<string>();

  Object.entries(permisoPathMap).forEach(([nombrePermiso, path]) => {
    let current: any = formPermisos;
    for (const key of path) {
      current = current?.[key];
    }
    if (current === true) {
      nombresActivos.add(nombrePermiso);
    }
  });

  return catalogoPermisos
    .filter((p) => nombresActivos.has(p.nombre_permiso))
    .map((p) => p.id_permiso);
}