import { Checkbox } from "../../../shared/components/ui/checkbox";
import { Label } from "../../../shared/components/ui/label";
import { Permisos } from "../../../data/roles";

interface PermisosFormProps {
  formPermisos: Permisos;
  updatePermiso: (path: string[], value: boolean) => void;
  toggleModulePermissions: (module: string) => void;
  isModuleFullyChecked: (module: string) => boolean;
}

export function PermisosForm({
  formPermisos,
  updatePermiso,
  toggleModulePermissions,
  isModuleFullyChecked,
}: PermisosFormProps) {
  const PermisoCheckbox = ({
    label,
    path,
    value,
    onChange,
    className = "",
  }: {
    label: string;
    path: string[];
    value: boolean;
    onChange?: () => void;
    className?: string;
  }) => (
    <div className={`flex items-center space-x-2 py-1 ${className}`}>
      <Checkbox
        id={`permiso-${path.join("-")}`}
        checked={value}
        onCheckedChange={
          onChange
            ? onChange
            : (checked) => updatePermiso(path, checked as boolean)
        }
      />
      <Label
        htmlFor={`permiso-${path.join("-")}`}
        className="text-sm text-gray-700 cursor-pointer select-none"
      >
        {label}
      </Label>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Dashboard */}
      <div className="border border-blue-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Dashboard
          </p>
        </div>
        <div className="space-y-1 ml-2">
          <PermisoCheckbox
            label="Acceder"
            path={["dashboard", "acceder"]}
            value={formPermisos.dashboard.acceder}
          />
        </div>
      </div>

      {/* Existencias */}
      <div className="border border-orange-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Existencias
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["existencias", "selectAll"]}
            value={isModuleFullyChecked("existencias")}
            onChange={() => toggleModulePermissions("existencias")}
            className="text-xs"
          />
        </div>

        <div className="space-y-2 ml-2">
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">Productos</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["existencias", "productos", "ver"]}
                value={formPermisos.existencias.productos.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["existencias", "productos", "crear"]}
                value={formPermisos.existencias.productos.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["existencias", "productos", "editar"]}
                value={formPermisos.existencias.productos.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["existencias", "productos", "cambiarEstado"]}
                value={formPermisos.existencias.productos.cambiarEstado}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">Traslados</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["existencias", "traslados", "ver"]}
                value={formPermisos.existencias.traslados.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["existencias", "traslados", "crear"]}
                value={formPermisos.existencias.traslados.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["existencias", "traslados", "editar"]}
                value={formPermisos.existencias.traslados.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["existencias", "traslados", "cambiarEstado"]}
                value={formPermisos.existencias.traslados.cambiarEstado}
              />
              <PermisoCheckbox
                label="Anular"
                path={["existencias", "traslados", "anular"]}
                value={formPermisos.existencias.traslados.anular}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">Bodegas</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["existencias", "bodegas", "ver"]}
                value={formPermisos.existencias.bodegas.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["existencias", "bodegas", "crear"]}
                value={formPermisos.existencias.bodegas.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["existencias", "bodegas", "editar"]}
                value={formPermisos.existencias.bodegas.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["existencias", "bodegas", "cambiarEstado"]}
                value={formPermisos.existencias.bodegas.cambiarEstado}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["existencias", "bodegas", "eliminar"]}
                value={formPermisos.existencias.bodegas.eliminar}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compras */}
      <div className="border border-green-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-green-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Compras
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["compras", "selectAll"]}
            value={isModuleFullyChecked("compras")}
            onChange={() => toggleModulePermissions("compras")}
            className="text-xs"
          />
        </div>

        <div className="space-y-2 ml-2">
          <div>
            <p className="text-xs font-medium text-green-700 mb-1">Proveedores</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["compras", "proveedores", "ver"]}
                value={formPermisos.compras.proveedores.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["compras", "proveedores", "crear"]}
                value={formPermisos.compras.proveedores.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["compras", "proveedores", "editar"]}
                value={formPermisos.compras.proveedores.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["compras", "proveedores", "cambiarEstado"]}
                value={formPermisos.compras.proveedores.cambiarEstado}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["compras", "proveedores", "eliminar"]}
                value={formPermisos.compras.proveedores.eliminar}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-green-700 mb-1">Órdenes de compra</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["compras", "ordenesCompra", "ver"]}
                value={formPermisos.compras.ordenesCompra.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["compras", "ordenesCompra", "crear"]}
                value={formPermisos.compras.ordenesCompra.crear}
              />
              <PermisoCheckbox
                label="Descargar"
                path={["compras", "ordenesCompra", "descargar"]}
                value={formPermisos.compras.ordenesCompra.descargar}
              />
              <PermisoCheckbox
                label="Editar"
                path={["compras", "ordenesCompra", "editar"]}
                value={formPermisos.compras.ordenesCompra.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["compras", "ordenesCompra", "cambiarEstado"]}
                value={formPermisos.compras.ordenesCompra.cambiarEstado}
              />
              <PermisoCheckbox
                label="Anular"
                path={["compras", "ordenesCompra", "anular"]}
                value={formPermisos.compras.ordenesCompra.anular}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-green-700 mb-1">Remisiones de compra</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["compras", "remisionesCompra", "ver"]}
                value={formPermisos.compras.remisionesCompra.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["compras", "remisionesCompra", "crear"]}
                value={formPermisos.compras.remisionesCompra.crear}
              />
              <PermisoCheckbox
                label="Descargar"
                path={["compras", "remisionesCompra", "descargar"]}
                value={formPermisos.compras.remisionesCompra.descargar}
              />
              <PermisoCheckbox
                label="Editar"
                path={["compras", "remisionesCompra", "editar"]}
                value={formPermisos.compras.remisionesCompra.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["compras", "remisionesCompra", "cambiarEstado"]}
                value={formPermisos.compras.remisionesCompra.cambiarEstado}
              />
              <PermisoCheckbox
                label="Anular"
                path={["compras", "remisionesCompra", "anular"]}
                value={formPermisos.compras.remisionesCompra.anular}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ventas */}
      <div className="border border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Ventas
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["ventas", "selectAll"]}
            value={isModuleFullyChecked("ventas")}
            onChange={() => toggleModulePermissions("ventas")}
            className="text-xs"
          />
        </div>

        <div className="space-y-2 ml-2">
          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">Clientes</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["ventas", "clientes", "ver"]}
                value={formPermisos.ventas.clientes.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "clientes", "crear"]}
                value={formPermisos.ventas.clientes.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "clientes", "editar"]}
                value={formPermisos.ventas.clientes.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["ventas", "clientes", "cambiarEstado"]}
                value={formPermisos.ventas.clientes.cambiarEstado}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["ventas", "clientes", "eliminar"]}
                value={formPermisos.ventas.clientes.eliminar}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">Cotizaciones</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["ventas", "cotizaciones", "ver"]}
                value={formPermisos.ventas.cotizaciones.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "cotizaciones", "crear"]}
                value={formPermisos.ventas.cotizaciones.crear}
              />
              <PermisoCheckbox
                label="Descargar"
                path={["ventas", "cotizaciones", "descargar"]}
                value={formPermisos.ventas.cotizaciones.descargar}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "cotizaciones", "editar"]}
                value={formPermisos.ventas.cotizaciones.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["ventas", "cotizaciones", "cambiarEstado"]}
                value={formPermisos.ventas.cotizaciones.cambiarEstado}
              />
              <PermisoCheckbox
                label="Anular"
                path={["ventas", "cotizaciones", "anular"]}
                value={formPermisos.ventas.cotizaciones.anular}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">Órdenes de venta</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["ventas", "ordenesVenta", "ver"]}
                value={formPermisos.ventas.ordenesVenta.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "ordenesVenta", "crear"]}
                value={formPermisos.ventas.ordenesVenta.crear}
              />
              <PermisoCheckbox
                label="Descargar"
                path={["ventas", "ordenesVenta", "descargar"]}
                value={formPermisos.ventas.ordenesVenta.descargar}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "ordenesVenta", "editar"]}
                value={formPermisos.ventas.ordenesVenta.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["ventas", "ordenesVenta", "cambiarEstado"]}
                value={formPermisos.ventas.ordenesVenta.cambiarEstado}
              />
              <PermisoCheckbox
                label="Anular"
                path={["ventas", "ordenesVenta", "anular"]}
                value={formPermisos.ventas.ordenesVenta.anular}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">Remisiones de venta</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["ventas", "remisionesVenta", "ver"]}
                value={formPermisos.ventas.remisionesVenta.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "remisionesVenta", "crear"]}
                value={formPermisos.ventas.remisionesVenta.crear}
              />
              <PermisoCheckbox
                label="Descargar"
                path={["ventas", "remisionesVenta", "descargar"]}
                value={formPermisos.ventas.remisionesVenta.descargar}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "remisionesVenta", "editar"]}
                value={formPermisos.ventas.remisionesVenta.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["ventas", "remisionesVenta", "cambiarEstado"]}
                value={formPermisos.ventas.remisionesVenta.cambiarEstado}
              />
              <PermisoCheckbox
                label="Anular"
                path={["ventas", "remisionesVenta", "anular"]}
                value={formPermisos.ventas.remisionesVenta.anular}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">Pagos</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["ventas", "pagos", "ver"]}
                value={formPermisos.ventas.pagos.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "pagos", "crear"]}
                value={formPermisos.ventas.pagos.crear}
              />
              <PermisoCheckbox
                label="Agregar abonos"
                path={["ventas", "pagos", "agregarAbonos"]}
                value={formPermisos.ventas.pagos.agregarAbonos}
              />
              <PermisoCheckbox
                label="Anular"
                path={["ventas", "pagos", "anular"]}
                value={formPermisos.ventas.pagos.anular}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Administración */}
      <div className="border border-pink-200 rounded-lg p-4 bg-gradient-to-br from-pink-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-pink-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
            Administración
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["administracion", "selectAll"]}
            value={isModuleFullyChecked("administracion")}
            onChange={() => toggleModulePermissions("administracion")}
            className="text-xs"
          />
        </div>

        <div className="space-y-2 ml-2">
          <div>
            <p className="text-xs font-medium text-pink-700 mb-1">Roles</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["administracion", "roles", "ver"]}
                value={formPermisos.administracion.roles.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["administracion", "roles", "crear"]}
                value={formPermisos.administracion.roles.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["administracion", "roles", "editar"]}
                value={formPermisos.administracion.roles.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["administracion", "roles", "cambiarEstado"]}
                value={formPermisos.administracion.roles.cambiarEstado}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["administracion", "roles", "eliminar"]}
                value={formPermisos.administracion.roles.eliminar}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-pink-700 mb-1">Usuarios</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Ver"
                path={["administracion", "usuarios", "ver"]}
                value={formPermisos.administracion.usuarios.ver}
              />
              <PermisoCheckbox
                label="Crear"
                path={["administracion", "usuarios", "crear"]}
                value={formPermisos.administracion.usuarios.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["administracion", "usuarios", "editar"]}
                value={formPermisos.administracion.usuarios.editar}
              />
              <PermisoCheckbox
                label="Cambiar estado"
                path={["administracion", "usuarios", "cambiarEstado"]}
                value={formPermisos.administracion.usuarios.cambiarEstado}
              />
              <PermisoCheckbox
                label="Restablecer contraseña"
                path={["administracion", "usuarios", "restablecerContrasena"]}
                value={formPermisos.administracion.usuarios.restablecerContrasena}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}