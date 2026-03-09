import { Permisos } from "./roles";
import { Bodega } from "./bodegas";

export interface UsuarioSistema {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  estado: boolean;

  permisos: Permisos | null;

  bodegasIds: number[];
  bodegas: Bodega[];

  idBodegaActiva: number | null;
  requiereSeleccion: boolean;

  raw?: any;
}