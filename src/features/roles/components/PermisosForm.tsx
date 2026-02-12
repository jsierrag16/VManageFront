import { Checkbox } from "../../../shared/components/ui/checkbox";
import { Label } from "../../../shared/components/ui/label";
import { Permisos } from "../../../../data/roles";
import { Package } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";

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
      {/* Inventario */}
      <div className="border border-orange-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Inventario
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["inventario", "selectAll"]}
            value={isModuleFullyChecked("inventario")}
            onChange={() => toggleModulePermissions("inventario")}
            className="text-xs"
          />
        </div>
        <div className="space-y-2 ml-2">
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">
              Existencias
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["inventario", "existencias", "crear"]}
                value={formPermisos.inventario.existencias.crear}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">
              Productos
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["inventario", "productos", "crear"]}
                value={formPermisos.inventario.productos.crear}
              />
              <PermisoCheckbox
                label="Dar de Baja"
                path={["inventario", "productos", "darDeBaja"]}
                value={formPermisos.inventario.productos.darDeBaja}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">
              Traslados
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["inventario", "traslados", "crear"]}
                value={formPermisos.inventario.traslados.crear}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">
              Bodegas
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["inventario", "bodegas", "crear"]}
                value={formPermisos.inventario.bodegas.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["inventario", "bodegas", "editar"]}
                value={formPermisos.inventario.bodegas.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["inventario", "bodegas", "eliminar"]}
                value={formPermisos.inventario.bodegas.eliminar}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compras */}
      <div className="border border-orange-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
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
            <p className="text-xs font-medium text-orange-700 mb-1">
              Proveedores
            </p>
            <div className="ml-2">
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
                label="Eliminar"
                path={["compras", "proveedores", "eliminar"]}
                value={formPermisos.compras.proveedores.eliminar}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">
              Órdenes de Compra
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["compras", "ordenesCompra", "crear"]}
                value={formPermisos.compras.ordenesCompra.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["compras", "ordenesCompra", "editar"]}
                value={formPermisos.compras.ordenesCompra.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["compras", "ordenesCompra", "eliminar"]}
                value={formPermisos.compras.ordenesCompra.eliminar}
              />
              <PermisoCheckbox
                label="Cambiar Estado"
                path={["compras", "ordenesCompra", "cambiarEstado"]}
                value={formPermisos.compras.ordenesCompra.cambiarEstado}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">
              Remisiones de Compra
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["compras", "remisionesCompra", "crear"]}
                value={formPermisos.compras.remisionesCompra.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["compras", "remisionesCompra", "editar"]}
                value={formPermisos.compras.remisionesCompra.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["compras", "remisionesCompra", "eliminar"]}
                value={formPermisos.compras.remisionesCompra.eliminar}
              />
              <PermisoCheckbox
                label="Cambiar Estado"
                path={["compras", "remisionesCompra", "cambiarEstado"]}
                value={formPermisos.compras.remisionesCompra.cambiarEstado}
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
            <p className="text-xs font-medium text-purple-700 mb-1">
              Clientes
            </p>
            <div className="ml-2">
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
                label="Eliminar"
                path={["ventas", "clientes", "eliminar"]}
                value={formPermisos.ventas.clientes.eliminar}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">
              Órdenes
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "ordenes", "crear"]}
                value={formPermisos.ventas.ordenes.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "ordenes", "editar"]}
                value={formPermisos.ventas.ordenes.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["ventas", "ordenes", "eliminar"]}
                value={formPermisos.ventas.ordenes.eliminar}
              />
              <PermisoCheckbox
                label="Cambiar Estado"
                path={["ventas", "ordenes", "cambiarEstado"]}
                value={formPermisos.ventas.ordenes.cambiarEstado}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">
              Remisiones de Venta
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "remisionesVenta", "crear"]}
                value={formPermisos.ventas.remisionesVenta.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "remisionesVenta", "editar"]}
                value={formPermisos.ventas.remisionesVenta.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["ventas", "remisionesVenta", "eliminar"]}
                value={formPermisos.ventas.remisionesVenta.eliminar}
              />
              <PermisoCheckbox
                label="Cambiar Estado"
                path={["ventas", "remisionesVenta", "cambiarEstado"]}
                value={formPermisos.ventas.remisionesVenta.cambiarEstado}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-purple-700 mb-1">
              Pagos y Abonos
            </p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["ventas", "pagosAbonos", "crear"]}
                value={formPermisos.ventas.pagosAbonos.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["ventas", "pagosAbonos", "editar"]}
                value={formPermisos.ventas.pagosAbonos.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["ventas", "pagosAbonos", "eliminar"]}
                value={formPermisos.ventas.pagosAbonos.eliminar}
              />
              <PermisoCheckbox
                label="Cambiar Estado"
                path={["ventas", "pagosAbonos", "cambiarEstado"]}
                value={formPermisos.ventas.pagosAbonos.cambiarEstado}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="border border-pink-200 rounded-lg p-4 bg-gradient-to-br from-pink-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-pink-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
            Configuración
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["configuracion", "selectAll"]}
            value={isModuleFullyChecked("configuracion")}
            onChange={() => toggleModulePermissions("configuracion")}
            className="text-xs"
          />
        </div>
        <div className="space-y-2 ml-2">
          <div>
            <p className="text-xs font-medium text-pink-700 mb-1">Roles</p>
            <div className="ml-2">
              <PermisoCheckbox
                label="Crear"
                path={["configuracion", "roles", "crear"]}
                value={formPermisos.configuracion.roles.crear}
              />
              <PermisoCheckbox
                label="Editar"
                path={["configuracion", "roles", "editar"]}
                value={formPermisos.configuracion.roles.editar}
              />
              <PermisoCheckbox
                label="Eliminar"
                path={["configuracion", "roles", "eliminar"]}
                value={formPermisos.configuracion.roles.eliminar}
              />
              <PermisoCheckbox
                label="Inhabilitar"
                path={["configuracion", "roles", "inhabilitar"]}
                value={formPermisos.configuracion.roles.inhabilitar}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Usuarios */}
      <div className="border border-yellow-200 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-yellow-100">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Usuarios
          </p>
          <PermisoCheckbox
            label="Seleccionar Todos"
            path={["usuarios", "selectAll"]}
            value={isModuleFullyChecked("usuarios")}
            onChange={() => toggleModulePermissions("usuarios")}
            className="text-xs"
          />
        </div>
        <div className="space-y-1 ml-2">
          <PermisoCheckbox
            label="Crear"
            path={["usuarios", "crear"]}
            value={formPermisos.usuarios.crear}
          />
          <PermisoCheckbox
            label="Editar"
            path={["usuarios", "editar"]}
            value={formPermisos.usuarios.editar}
          />
          <PermisoCheckbox
            label="Eliminar"
            path={["usuarios", "eliminar"]}
            value={formPermisos.usuarios.eliminar}
          />
          <PermisoCheckbox
            label="Inhabilitar"
            path={["usuarios", "inhabilitar"]}
            value={formPermisos.usuarios.inhabilitar}
          />
        </div>
      </div>

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
    </div>
  );
}