export type ClienteApi = {
  id_cliente: number;
  codigo_cliente: string;
  nombre_cliente: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  num_documento: string;
  id_tipo_cliente: number;
  id_municipio: number;
  id_tipo_doc: number;
  estado: boolean;

  tipo_documento?: {
    id_tipo_doc: number;
    nombre_doc?: string;
    nombre?: string;
  };

  tipo_cliente?: {
    id_tipo_cliente: number;
    nombre_tipo_cliente?: string;
    nombre?: string;
    tipo_cliente?: string;
  };

  municipios?: {
    id_municipio: number;
    nombre_municipio?: string;
    nombre?: string;
    municipio?: string;
    departamento?: {
      id_departamento: number;
      nombre_departamento?: string;
      nombre?: string;
      departamento?: string;
    };
  };
};

export type ClienteUI = {
  id: number;
  codigo: string;
  tipoDocumento: string;
  idTipoDocumento: number;
  numeroDocumento: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  idMunicipio: number;
  tipoCliente: string;
  idTipoCliente: number;
  estado: "Activo" | "Inactivo";
};

export type TipoDocumentoOption = {
  id: number;
  nombre: string;
};

export type TipoClienteOption = {
  id: number;
  nombre: string;
};

export type MunicipioOption = {
  id: number;
  nombre: string;
  departamento: string;
};

export type ClienteFormPayload = {
  nombre_cliente: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  num_documento: string;
  id_tipo_cliente: number;
  id_municipio: number;
  id_tipo_doc: number;
  estado?: boolean;
};
