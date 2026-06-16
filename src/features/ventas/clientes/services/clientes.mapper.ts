import type {
  ClienteApi,
  ClienteUI,
  ClienteFormPayload,
  TipoClienteOption,
  TipoDocumentoOption,
  MunicipioOption,
  DepartamentoOption,
  BodegaOption,
} from "../types/clientes.types";

const safe = (value?: string | null) => value ?? "";

const getTipoDocNombre = (tipo?: ClienteApi["tipo_documento"]) =>
  tipo?.nombre_doc ?? tipo?.nombre ?? "";

const getTipoClienteNombre = (tipo?: ClienteApi["tipo_cliente"]) =>
  tipo?.nombre_tipo_cliente ?? tipo?.nombre ?? tipo?.tipo_cliente ?? "";

const getDepartamentoRef = (m?: ClienteApi["municipios"]) =>
  m?.departamentos ?? m?.departamento ?? null;

const getMunicipioNombre = (m?: ClienteApi["municipios"]) =>
  m?.nombre_municipio ?? m?.nombre ?? m?.municipio ?? "";

const getDepartamentoNombre = (m?: ClienteApi["municipios"]) => {
  const departamento = getDepartamentoRef(m);

  return (
    departamento?.nombre_departamento ??
    departamento?.nombre ??
    departamento?.departamento ??
    ""
  );
};

const getDepartamentoId = (m?: ClienteApi["municipios"]) => {
  const departamento = getDepartamentoRef(m);

  return Number(
    m?.id_departamento ??
    departamento?.id_departamento ??
    0
  );
};

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
    idDepartamento: getDepartamentoId(cliente.municipios),
    idMunicipio: cliente.id_municipio,
    tipoCliente: getTipoClienteNombre(cliente.tipo_cliente),
    idTipoCliente: cliente.id_tipo_cliente,
    estado: cliente.estado ? "Activo" : "Inactivo",
    idBodega: cliente.id_bodega,
    bodega: cliente.bodega?.nombre_bodega ?? "",
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
  idBodega: number;
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
    id_bodega: input.idBodega,
  };
}

export function mapDepartamentos(raw: any[]): DepartamentoOption[] {
  return raw.map((item) => ({
    id: item.id_departamento,
    nombre:
      item.nombre_departamento ??
      item.nombre ??
      item.departamento ??
      "Sin nombre",
  }));
}

export function mapBodegas(raw: any[]): BodegaOption[] {
  return raw.map((item) => ({
    id: item.id_bodega,
    nombre: item.nombre_bodega ?? item.nombre ?? "Sin nombre",
  }));
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
  return raw.map((item) => {
    const departamentoRef = item.departamentos ?? item.departamento ?? null;

    const nombre = item.nombre_municipio ?? item.nombre ?? item.municipio ?? "Sin nombre";

    const idDepartamento = Number(
      item.id_departamento ??
      departamentoRef?.id_departamento ??
      0
    );

    const departamento =
      departamentoRef?.nombre_departamento ??
      departamentoRef?.nombre ??
      departamentoRef?.departamento ??
      item.nombre_departamento ??
      "";

    return {
      id: item.id_municipio,
      nombre,
      idDepartamento,
      departamento,
    };
  });
}