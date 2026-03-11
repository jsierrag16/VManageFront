import { createEmptyPermisos } from "@/data/roles";
import type { UsuarioSistema } from "@/data/usuarios-sistema";
import type { PermisoBackend } from "@/features/roles/services/permisos.service";

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
  "administracion.usuarios.eliminar": ["administracion", "usuarios", "eliminar"],
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

function permisosBackendToFrontend(permisosBackend: PermisoBackend[]) {
  const permisos = createEmptyPermisos();

  permisosBackend.forEach((permiso) => {
    const path = permisoPathMap[permiso.nombre_permiso];
    if (path) {
      setDeepValue(permisos, path, true);
    }
  });

  return permisos;
}

export function authUserToUsuarioSistema(user: any): UsuarioSistema {
  const permisosFuente: PermisoBackend[] = Array.isArray(user?.permisos)
    ? user.permisos
    : Array.isArray(user?.roles?.roles_permisos)
      ? user.roles.roles_permisos
        .map((rp: any) => rp?.permisos)
        .filter(Boolean)
      : [];

  const bodegasFuente = Array.isArray(user?.bodegas)
    ? user.bodegas
    : Array.isArray(user?.bodegas_por_usuario)
      ? user.bodegas_por_usuario
        .map((item: any) => item?.bodega)
        .filter(Boolean)
      : [];

  return {
    id: user.id_usuario,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    avatarUrl: user.img_url ?? "",
    telefono: user.telefono ?? "",
    documento: user.num_documento ?? "",
    tipoDocumento: user.tipo_documento?.nombre_doc ?? "",
    rol: user.roles?.nombre_rol ?? "",
    estado: user.estado,
    permisos: permisosBackendToFrontend(permisosFuente),
    bodegasIds: bodegasFuente.map((b: any) => b.id_bodega),
    bodegas: bodegasFuente.map((b: any) => ({
      id: b.id_bodega,
      nombre: b.nombre_bodega,
      direccion: b.direccion,
      idMunicipio: b.id_municipio,
      estado: b.estado,
    })),
    idBodegaActiva: user.id_bodega_activa ?? null,
    requiereSeleccion: user.requiereSeleccion ?? false,
    raw: user,
  } as UsuarioSistema;
}