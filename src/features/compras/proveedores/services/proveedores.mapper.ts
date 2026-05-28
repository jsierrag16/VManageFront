export type CatalogOption = {
  value: string;
  label: string;
};

export type MunicipioOption = CatalogOption & {
  nombre: string;
  idDepartamento: number;
  departamento: string;
  idPais: number;
  pais: string;
};

export type ProveedorItem = {
  id: number;
  codigo: string;
  numeroDocumento: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  idTipoDocumento: number;
  tipoDocumento: string;
  idTipoProveedor: number;
  tipoProveedor: string;
  idPais: number;
  pais: string;
  idDepartamento: number;
  departamento: string;
  idMunicipio: number;
  ciudad: string;
  estado: "Activo" | "Inactivo";
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toText = (value: unknown, fallback = ""): string => {
  if (value == null) return fallback;
  return String(value).trim();
};

const normalizeEstado = (value: unknown): "Activo" | "Inactivo" => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["activo", "true", "1"].includes(normalized)) return "Activo";
    return "Inactivo";
  }

  return Boolean(value) ? "Activo" : "Inactivo";
};

export const mapCatalogOption = (
  raw: any,
  idKeys: string[],
  labelKeys: string[]
): CatalogOption => {
  const id =
    idKeys.map((key) => raw?.[key]).find((value) => value !== undefined && value !== null) ??
    raw?.id ??
    "";

  const label =
    labelKeys
      .map((key) => raw?.[key])
      .find((value) => typeof value === "string" && value.trim() !== "") ?? "";

  return {
    value: String(id),
    label: String(label).trim(),
  };
};

export const mapMunicipioOption = (raw: any): MunicipioOption => {
  const departamentoRef =
    raw?.departamentos ??
    raw?.departamento ??
    null;

  const paisRef =
    departamentoRef?.paises ??
    departamentoRef?.pais ??
    raw?.paises ??
    raw?.pais ??
    null;

  const id = toNumber(raw?.id_municipio ?? raw?.id ?? raw?.value);

  const nombre = toText(
    raw?.nombre_municipio ??
    raw?.nombre ??
    raw?.municipio ??
    raw?.label
  );

  const idDepartamento = toNumber(
    raw?.id_departamento ??
    raw?.idDepartamento ??
    departamentoRef?.id_departamento ??
    departamentoRef?.id
  );

  const departamento = toText(
    departamentoRef?.nombre_departamento ??
    raw?.nombre_departamento ??
    raw?.departamento
  );

  const idPais = toNumber(
    departamentoRef?.id_pais ??
    raw?.id_pais ??
    raw?.idPais ??
    paisRef?.id_pais ??
    paisRef?.id
  );

  const pais = toText(
    paisRef?.nombre_pais ??
    raw?.nombre_pais ??
    raw?.pais
  );

  return {
    value: String(id),
    label: nombre,

    nombre,
    idDepartamento,
    departamento,
    idPais,
    pais,
  };
};

export const mapProveedor = (raw: any): ProveedorItem => {
  const tipoDocumentoRef = raw?.tipo_documento ?? raw?.tipoDocumento ?? null;
  const tipoProveedorRef = raw?.tipo_proveedor ?? raw?.tipoProveedorRef ?? null;

  const municipioRef = raw?.municipios ?? raw?.municipio ?? null;
  const departamentoRef =
    municipioRef?.departamentos ??
    municipioRef?.departamento ??
    raw?.departamentos ??
    raw?.departamento ??
    null;

  const paisRef =
    departamentoRef?.paises ??
    departamentoRef?.pais ??
    raw?.paises ??
    raw?.pais ??
    null;

  const id = toNumber(raw?.id_proveedor ?? raw?.id);

  const idTipoDocumento = toNumber(
    raw?.id_tipo_doc ??
    raw?.idTipoDocumento ??
    tipoDocumentoRef?.id_tipo_doc ??
    tipoDocumentoRef?.id
  );

  const idTipoProveedor = toNumber(
    raw?.id_tipo_proveedor ??
    raw?.idTipoProveedor ??
    tipoProveedorRef?.id_tipo_proveedor ??
    tipoProveedorRef?.id
  );

  const idMunicipio = toNumber(
    raw?.id_municipio ??
    raw?.idMunicipio ??
    municipioRef?.id_municipio ??
    municipioRef?.id
  );

  const idDepartamento = toNumber(
    municipioRef?.id_departamento ??
    raw?.id_departamento ??
    raw?.idDepartamento ??
    departamentoRef?.id_departamento ??
    departamentoRef?.id
  );

  const idPais = toNumber(
    departamentoRef?.id_pais ??
    raw?.id_pais ??
    raw?.idPais ??
    paisRef?.id_pais ??
    paisRef?.id
  );

  return {
    id,
    codigo: toText(raw?.codigo_proveedor ?? raw?.codigo),

    numeroDocumento: toText(raw?.num_documento ?? raw?.numeroDocumento),
    nombre: toText(raw?.nombre_empresa ?? raw?.nombre),
    email: toText(raw?.email),
    telefono: toText(raw?.telefono),
    direccion: toText(raw?.direccion),
    contacto: toText(raw?.nombre_contacto ?? raw?.contacto),

    idTipoDocumento,
    tipoDocumento: toText(
      tipoDocumentoRef?.nombre_doc ??
      tipoDocumentoRef?.nombre_tipo_doc ??
      raw?.tipoDocumento ??
      raw?.nombre_doc
    ),

    idTipoProveedor,
    tipoProveedor: toText(
      tipoProveedorRef?.nombre_tipo_proveedor ??
      raw?.tipoProveedor ??
      raw?.nombre_tipo_proveedor
    ),

    idPais,
    pais: toText(
      paisRef?.nombre_pais ??
      raw?.pais ??
      raw?.nombre_pais
    ),

    idDepartamento,
    departamento: toText(
      departamentoRef?.nombre_departamento ??
      raw?.departamento ??
      raw?.nombre_departamento
    ),

    idMunicipio,
    ciudad: toText(
      municipioRef?.nombre_municipio ??
      raw?.ciudad ??
      raw?.municipio ??
      raw?.nombre_municipio
    ),

    estado: normalizeEstado(raw?.estado),
  };
};
