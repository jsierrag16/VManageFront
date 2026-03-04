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