import type { Permisos } from "@/features/configuracion/roles/types/roles.types";
import type { Bodega } from "@/features/existencias/bodegas/types/bodega.types";

export interface UsuarioSistema {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  estado: boolean;

  avatarUrl?: string;

  telefono?: string;
  documento?: string;
  tipoDocumento?: string;

  permisos: Permisos | null;

  bodegasIds: number[];
  bodegas: Bodega[];

  idBodegaActiva: number | null;
  requiereSeleccion: boolean;

  raw?: any;
}