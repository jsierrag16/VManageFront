// src/data/bodegas.ts

export interface Bodega {
  id: number;
  nombre: string;
  departamento: string;
  municipio: string;
  direccion: string;
  estado: boolean;
}

export const bodegasData: Bodega[] = [
  {
    id: 1,
    nombre: "Bodega Principal",
    departamento: "Cundinamarca",
    municipio: "Bogotá D.C.",
    direccion: "Calle 80 #45-23",
    estado: true,
  },
  {
    id: 2,
    nombre: "Bodega Secundaria",
    departamento: "Cundinamarca",
    municipio: "Soacha",
    direccion: "Carrera 15 #123-45",
    estado: true,
  },
  {
    id: 3,
    nombre: "Bodega Medellín",
    departamento: "Antioquia",
    municipio: "Medellín",
    direccion: "Carrera 43A #12-34",
    estado: true,
  },
  {
    id: 4,
    nombre: "Bodega Cali",
    departamento: "Valle del Cauca",
    municipio: "Cali",
    direccion: "Calle 25 #100-45",
    estado: false,
  },
];
