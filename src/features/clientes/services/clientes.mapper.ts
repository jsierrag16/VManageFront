import type {
  ClienteApi,
  ClienteUI,
  ClienteFormPayload,
  TipoClienteOption,
  TipoDocumentoOption,
  MunicipioOption,
} from "../types/clientes.types";

const safe = (value?: string | null) => value ?? "";

const getTipoDocNombre = (tipo?: ClienteApi["tipo_documento"]) =>
  tipo?.nombre_doc ?? tipo?.nombre ?? "";

const getTipoClienteNombre = (tipo?: ClienteApi["tipo_cliente"]) =>
  tipo?.nombre_tipo_cliente ?? tipo?.nombre ?? tipo?.tipo_cliente ?? "";

const getMunicipioNombre = (m?: ClienteApi["municipios"]) =>
  m?.nombre_municipio ?? m?.nombre ?? m?.municipio ?? "";

const getDepartamentoNombre = (m?: ClienteApi["municipios"]) =>
  m?.departamento?.nombre_departamento ??
  m?.departamento?.nombre ??
  m?.departamento?.departamento ??
  "";

export function mapClienteApiToUi(cliente: ClienteApi): ClienteUI {
  return {
    id: cliente.id_cliente,
    codigo: cliente.codigo_cliente,
    tipoDocumento: getTipoDocNombre(cliente.tipo_documento),
    idTipoDocumento: cliente.id_tipo_doc,
    numeroDocumento: cliente.num_documento,
    nombre: cliente.nombre_cliente,
    email: safe(cliente.email),
    telefono: safe(cliente.telefono),
    direccion: safe(cliente.direccion),
    ciudad: getMunicipioNombre(cliente.municipios),
    departamento: getDepartamentoNombre(cliente.municipios),
    idMunicipio: cliente.id_municipio,
    tipoCliente: getTipoClienteNombre(cliente.tipo_cliente),
    idTipoCliente: cliente.id_tipo_cliente,
    estado: cliente.estado ? "Activo" : "Inactivo",
  };
}

export function mapFormToClientePayload(input: {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  numeroDocumento: string;
  idTipoCliente: number;
  idMunicipio: number;
  idTipoDocumento: number;
  estado?: boolean;
}): ClienteFormPayload {
  return {
    nombre_cliente: input.nombre.trim(),
    email: input.email.trim() || null,
    telefono: input.telefono.trim() || null,
    direccion: input.direccion.trim() || null,
    num_documento: input.numeroDocumento.trim(),
    id_tipo_cliente: input.idTipoCliente,
    id_municipio: input.idMunicipio,
    id_tipo_doc: input.idTipoDocumento,
    estado: input.estado ?? true,
  };
}

export function mapTiposDocumento(raw: any[]): TipoDocumentoOption[] {
  return raw.map((item) => ({
    id: item.id_tipo_doc,
    nombre: item.nombre_doc ?? item.nombre ?? "Sin nombre",
  }));
}

export function mapTiposCliente(raw: any[]): TipoClienteOption[] {
  return raw.map((item) => ({
    id: item.id_tipo_cliente,
    nombre: item.nombre_tipo_cliente ?? item.nombre ?? item.tipo_cliente ?? "Sin nombre",
  }));
}

export function mapMunicipios(raw: any[]): MunicipioOption[] {
  return raw.map((item) => ({
    id: item.id_municipio,
    nombre: item.nombre_municipio ?? item.nombre ?? item.municipio ?? "Sin nombre",
    departamento:
      item.departamento?.nombre_departamento ??
      item.departamento?.nombre ??
      item.departamento?.departamento ??
      "",
  }));
}
