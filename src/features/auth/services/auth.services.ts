import api from "@/shared/services/api"; // ajusta la ruta si tu api.ts está en otro lado

export type LoginRequest = {
  email: string;
  contrasena: string;
};

export type LoginResponse = {
  access_token: string;
  user: any;
};

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

export function saveToken(token: string) {
  localStorage.setItem("token", token);
}

export async function solicitarRestablecimientoContrasena(email: string) {
  const { data } = await api.post("/auth/solicitar-restablecimiento", { email });
  return data;
}

export async function crearContrasenaConToken(payload: {
  token: string;
  contrasena: string;
}) {
  const { data } = await api.post("/auth/crear-contrasena", payload);
  return data;
}

export async function getMiPerfil() {
  const { data } = await api.get("/auth/mi-perfil");
  return data;
}

export async function actualizarMiPerfil(payload: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  id_genero?: number;
}) {
  const { data } = await api.patch("/auth/mi-perfil", payload);
  return data;
}

export async function subirFotoMiPerfil(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/auth/mi-perfil/foto", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}