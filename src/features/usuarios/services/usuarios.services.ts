import api from "@/shared/services/api";

export type UsuarioListQuery = {
    q?: string;
    estado?: "true" | "false";
    page?: number;
    limit?: number;
};

export type UsuarioBackend = {
    id_usuario: number;
    nombre: string;
    apellido: string;
    id_tipo_doc: number;
    num_documento: string;
    email: string;
    id_rol: number;
    estado: boolean;
    telefono?: string | null;
    fecha_nacimiento?: string | null;
    img_url?: string | null;
    id_genero?: number | null;
    tipo_documento?: {
        id_tipo_doc: number;
        nombre_doc: string;
    } | null;
    roles?: {
        id_rol: number;
        nombre_rol: string;
    } | null;
    genero?: {
        id_genero: number;
        nombre_genero: string;
    } | null;
    bodegas_por_usuario?: Array<{
        id_bodega: number;
        estado: boolean;
        bodega?: {
            id_bodega: number;
            nombre_bodega: string;
            direccion?: string | null;
            id_municipio?: number | null;
            estado?: boolean;
        } | null;
    }>;
};

export type Usuario = {
    id: number;
    tipoDocumento: string;
    idTipoDocumento: number;
    numeroDocumento: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    rol: string;
    genero: string;
    idRol: number;
    estado: boolean;
    fechaNacimiento: string;
    imgUrl: string;
    idGenero: number | null;
    bodegas: string[];
    bodegasIds: number[];
    raw: UsuarioBackend;
};

export type CrearUsuarioPayload = {
    nombre: string;
    apellido: string;
    id_tipo_doc: number;
    num_documento: string;
    email: string;
    id_rol: number;
    estado?: boolean;
    telefono?: string;
    fecha_nacimiento?: string;
    img_url?: string;
    id_genero?: number;
};

export type ActualizarUsuarioPayload = Partial<CrearUsuarioPayload>;

type UsuariosListRawResponse =
    | UsuarioBackend[]
    | {
        page: number;
        limit: number;
        total: number;
        pages: number;
        data: UsuarioBackend[];
    };

export type UsuariosListResponse = {
    page: number;
    limit: number;
    total: number;
    pages: number;
    data: Usuario[];
};

export type CrearUsuarioResponse = {
    message: string;
    usuario: UsuarioBackend;
};

export type AsignarBodegaUsuarioPayload = {
    id_usuario: number;
    id_bodega: number;
};

function toDateInputValue(value?: string | null) {
    if (!value) return "";
    return String(value).slice(0, 10);
}

export function usuarioBackendToFrontend(user: UsuarioBackend): Usuario {
    const bodegas = Array.isArray(user.bodegas_por_usuario)
        ? user.bodegas_por_usuario
            .map((item) => item?.bodega)
            .filter(Boolean)
        : [];

    return {
        id: user.id_usuario,
        tipoDocumento: user.tipo_documento?.nombre_doc ?? String(user.id_tipo_doc),
        idTipoDocumento: user.id_tipo_doc,
        numeroDocumento: user.num_documento,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono ?? "",
        genero: user.genero?.nombre_genero ?? "",
        rol: user.roles?.nombre_rol ?? String(user.id_rol),
        idRol: user.id_rol,
        estado: user.estado,
        fechaNacimiento: toDateInputValue(user.fecha_nacimiento),
        imgUrl: user.img_url ?? "",
        idGenero: user.id_genero ?? null,
        bodegas: bodegas.map((b) => b!.nombre_bodega),
        bodegasIds: bodegas.map((b) => b!.id_bodega),
        raw: user,
    };
}

function normalizeUsuariosListResponse(
    raw: UsuariosListRawResponse,
    query?: UsuarioListQuery
): UsuariosListResponse {
    if (Array.isArray(raw)) {
        const mapped = raw.map(usuarioBackendToFrontend);

        return {
            page: query?.page ?? 1,
            limit: query?.limit ?? (mapped.length || 1),
            total: mapped.length,
            pages: 1,
            data: mapped,
        };
    }

    return {
        page: raw.page,
        limit: raw.limit,
        total: raw.total,
        pages: raw.pages,
        data: raw.data.map(usuarioBackendToFrontend),
    };
}

export async function getUsuarios(
    query: UsuarioListQuery = {}
): Promise<UsuariosListResponse> {
    const params: Record<string, string | number> = {};

    if (query.q?.trim()) params.q = query.q.trim();
    if (query.estado) params.estado = query.estado;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const { data } = await api.get<UsuariosListRawResponse>("/usuario", { params });
    return normalizeUsuariosListResponse(data, query);
}

export async function getUsuarioById(id: number): Promise<Usuario> {
    const { data } = await api.get<UsuarioBackend>(`/usuario/${id}`);
    return usuarioBackendToFrontend(data);
}

export async function createUsuario(
    payload: CrearUsuarioPayload
): Promise<CrearUsuarioResponse> {
    const { data } = await api.post<CrearUsuarioResponse>("/usuario", payload);
    return data;
}

export async function updateUsuario(
    id: number,
    payload: ActualizarUsuarioPayload
): Promise<Usuario> {
    const { data } = await api.patch<UsuarioBackend>(`/usuario/${id}`, payload);
    return usuarioBackendToFrontend(data);
}

export async function deleteUsuario(id: number): Promise<Usuario> {
    const { data } = await api.delete<UsuarioBackend>(`/usuario/${id}`);
    return usuarioBackendToFrontend(data);
}

export async function cambiarEstadoUsuario(
    id: number,
    estado: boolean
): Promise<Usuario> {
    const { data } = await api.patch<UsuarioBackend>(`/usuario/${id}`, { estado });
    return usuarioBackendToFrontend(data);
}

export async function asignarBodegaAUsuario(
    payload: AsignarBodegaUsuarioPayload
) {
    const { data } = await api.post("/bodegas-por-usuario", payload);
    return data;
}

export async function quitarBodegaAUsuario(
    id_usuario: number,
    id_bodega: number
) {
    const { data } = await api.delete(
        `/bodegas-por-usuario/${id_usuario}/${id_bodega}`
    );
    return data;
}