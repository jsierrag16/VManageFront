export type CatalogOption = {
  value: string;
  label: string;
};

export type MunicipioOption = CatalogOption & {
  nombre: string;
  departamento: string;
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
  idMunicipio: number;
  ciudad: string;
  departamento: string;
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
  const id = toNumber(raw?.id_municipio ?? raw?.id ?? raw?.value);

  const nombre = toText(
    raw?.nombre_municipio ??
      raw?.nombre ??
      raw?.municipio ??
      raw?.label
  );

  const departamento = toText(
    raw?.departamentos?.nombre_departamento ??
      raw?.departamento?.nombre_departamento ??
      raw?.departamento ??
      raw?.nombre_departamento
  );

  return {
    value: String(id),
    label: departamento ? `${nombre} - ${departamento}` : nombre,
    nombre,
    departamento,
  };
};

export const mapProveedor = (raw: any): ProveedorItem => {
  const tipoDocumentoRef = raw?.tipo_documento ?? raw?.tipoDocumento ?? null;
  const tipoProveedorRef = raw?.tipo_proveedor ?? raw?.tipoProveedorRef ?? null;
  const municipioRef = raw?.municipios ?? raw?.municipio ?? null;

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
        raw?.tipoDocumento ??
        raw?.nombre_doc
    ),
    idTipoProveedor,
    tipoProveedor: toText(
      tipoProveedorRef?.nombre_tipo_proveedor ??
        raw?.tipoProveedor ??
        raw?.nombre_tipo_proveedor
    ),
    idMunicipio,
    ciudad: toText(
      municipioRef?.nombre_municipio ??
        raw?.ciudad ??
        raw?.nombre_municipio
    ),
    departamento: toText(
      municipioRef?.departamentos?.nombre_departamento ??
        municipioRef?.departamento?.nombre_departamento ??
        raw?.departamento ??
        raw?.nombre_departamento
    ),
    estado: normalizeEstado(raw?.estado),
  };
};
